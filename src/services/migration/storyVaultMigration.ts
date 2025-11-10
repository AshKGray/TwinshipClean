import AsyncStorage from '@react-native-async-storage/async-storage';
import { Twincidence, TwincidenceCategory, TwincidenceMedia } from '../../types/twincidences';
import { Story, StoryCategory, StoryMedia } from '../../types/stories';
import { TwincidenceStorage } from '../storage/twincidenceStorage';

const STORY_STORAGE_KEY = 'story-storage';
const LEGACY_STORIES_KEY = 'twin_stories';
const MIGRATION_FLAG_KEY = 'twincidence_migration_complete';
const ARCHIVED_STORIES_KEY = 'archived_story_vault_data';

export interface MigrationResult {
  success: boolean;
  totalStories: number;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  archiveSize: number; // bytes
}

export class StoryVaultMigration {
  /**
   * Check if migration has already been completed
   */
  static async isMigrationComplete(): Promise<boolean> {
    try {
      const flag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
      return flag === 'true';
    } catch (error) {
      console.error('[Migration] Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Mark migration as complete
   */
  static async markMigrationComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      await AsyncStorage.setItem(
        `${MIGRATION_FLAG_KEY}_timestamp`,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[Migration] Error marking migration complete:', error);
    }
  }

  /**
   * Check if Story Vault data exists
   */
  static async hasStoryVaultData(): Promise<boolean> {
    try {
      const zustandData = await AsyncStorage.getItem(STORY_STORAGE_KEY);
      const legacyData = await AsyncStorage.getItem(LEGACY_STORIES_KEY);
      return !!(zustandData || legacyData);
    } catch (error) {
      console.error('[Migration] Error checking for Story Vault data:', error);
      return false;
    }
  }

  /**
   * Load Story Vault data from AsyncStorage
   */
  static async loadStoryVaultData(): Promise<Story[]> {
    try {
      // Try loading from Zustand persisted store first
      const zustandData = await AsyncStorage.getItem(STORY_STORAGE_KEY);
      if (zustandData) {
        const parsed = JSON.parse(zustandData);
        // Zustand persist stores in { state: { stories: [...] } } format
        if (parsed.state && parsed.state.stories) {
          return parsed.state.stories;
        }
      }

      // Fallback to legacy storage key
      const legacyData = await AsyncStorage.getItem(LEGACY_STORIES_KEY);
      if (legacyData) {
        return JSON.parse(legacyData);
      }

      return [];
    } catch (error) {
      console.error('[Migration] Error loading Story Vault data:', error);
      return [];
    }
  }

  /**
   * Map Story category to Twincidence category
   */
  static mapCategoryToTwincidence(storyCategory: StoryCategory): TwincidenceCategory {
    switch (storyCategory) {
      case 'synchronicity':
        return TwincidenceCategory.MANUAL_TWIN_TALK;
      case 'milestones':
        return TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE;
      case 'childhood':
      case 'memories':
        return TwincidenceCategory.MANUAL_OTHER;
      case 'adventures':
      case 'achievements':
        return TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE;
      default:
        return TwincidenceCategory.MANUAL_OTHER;
    }
  }

  /**
   * Convert Story media to Twincidence media
   */
  static convertMedia(storyMedia: StoryMedia[]): {
    photos?: TwincidenceMedia[];
    videos?: TwincidenceMedia[];
    voiceNotes?: TwincidenceMedia[];
  } {
    const photos: TwincidenceMedia[] = [];
    const videos: TwincidenceMedia[] = [];
    const voiceNotes: TwincidenceMedia[] = [];

    storyMedia.forEach((media) => {
      const converted: TwincidenceMedia = {
        id: media.id,
        type: media.type === 'audio' ? 'voice' : media.type,
        uri: media.uri,
        thumbnail: media.thumbnail,
        duration: media.duration,
        size: media.size,
        mimeType: media.mimeType,
        caption: media.caption,
        timestamp: new Date().toISOString(), // Use current time as capture time
      };

      if (media.type === 'photo') {
        photos.push(converted);
      } else if (media.type === 'video') {
        videos.push(converted);
      } else if (media.type === 'audio') {
        voiceNotes.push({ ...converted, type: 'voice' });
      }
    });

    return {
      ...(photos.length > 0 && { photos }),
      ...(videos.length > 0 && { videos }),
      ...(voiceNotes.length > 0 && { voiceNotes }),
    };
  }

  /**
   * Convert a single Story to Twincidence
   */
  static convertStoryToTwincidence(story: Story): Twincidence {
    const category = this.mapCategoryToTwincidence(story.category);
    const media = story.media.length > 0 ? this.convertMedia(story.media) : undefined;

    const twincidence: Twincidence = {
      id: `migrated_${story.id}`,
      timestamp: story.timestamp,
      category,
      detectionType: 'manual',
      title: story.title,
      description: story.content,
      metadata: {
        // Store original story metadata
        eventDate: story.timestamp,
        customFields: {
          migratedFromStoryVault: true,
          originalCategory: story.category,
          originalStoryId: story.id,
          milestone: story.milestone,
          location: story.location,
        },
      },
      media,
      tags: story.tags,
      isSharedWithResearch: false,
      privacyLevel: story.isPrivate ? 'private' : story.isShared ? 'twin_only' : 'private',
      createdBy: story.authorId,
      editedAt: story.lastModified,
      annotations: story.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        timestamp: comment.timestamp,
        isEdited: comment.isEdited,
      })),
      views: story.views,
      favorites: story.favorites,
    };

    return twincidence;
  }

  /**
   * Archive original Story Vault data
   */
  static async archiveStoryVaultData(stories: Story[]): Promise<void> {
    try {
      const archiveData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        originalSource: 'Story Vault',
        stories,
      };

      await AsyncStorage.setItem(ARCHIVED_STORIES_KEY, JSON.stringify(archiveData));
      console.log(`[Migration] Archived ${stories.length} stories`);
    } catch (error) {
      console.error('[Migration] Error archiving Story Vault data:', error);
      throw new Error('Failed to archive Story Vault data');
    }
  }

  /**
   * Perform the migration
   */
  static async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalStories: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      archiveSize: 0,
    };

    try {
      // Check if migration already completed
      if (await this.isMigrationComplete()) {
        result.success = true;
        result.errors.push('Migration already completed previously');
        return result;
      }

      // Load Story Vault data
      const stories = await this.loadStoryVaultData();
      result.totalStories = stories.length;

      if (stories.length === 0) {
        result.success = true;
        result.errors.push('No Story Vault data found to migrate');
        await this.markMigrationComplete();
        return result;
      }

      console.log(`[Migration] Starting migration of ${stories.length} stories...`);

      // Convert stories to twincidences
      const twincidences: Twincidence[] = [];

      for (const story of stories) {
        try {
          const twincidence = this.convertStoryToTwincidence(story);
          twincidences.push(twincidence);
          result.migratedCount++;
        } catch (error) {
          console.error(`[Migration] Error converting story ${story.id}:`, error);
          result.errorCount++;
          result.errors.push(`Failed to convert story ${story.id}: ${(error as Error).message}`);
        }
      }

      // Archive original stories
      await this.archiveStoryVaultData(stories);

      // Calculate archive size
      const archiveData = await AsyncStorage.getItem(ARCHIVED_STORIES_KEY);
      result.archiveSize = archiveData ? new Blob([archiveData]).size : 0;

      // Save migrated twincidences
      if (twincidences.length > 0) {
        await TwincidenceStorage.batchSaveTwincidences(twincidences);
        console.log(`[Migration] Saved ${twincidences.length} twincidences`);
      }

      // Mark migration as complete
      await this.markMigrationComplete();

      result.success = result.errorCount === 0 || result.migratedCount > 0;
      console.log(`[Migration] Complete:`, result);

      return result;
    } catch (error) {
      console.error('[Migration] Fatal migration error:', error);
      result.errors.push(`Fatal error: ${(error as Error).message}`);
      return result;
    }
  }

  /**
   * Get migration summary for display to user
   */
  static getMigrationSummary(result: MigrationResult): string {
    if (result.totalStories === 0) {
      return 'No stories to migrate.';
    }

    const lines = [
      `Migrated ${result.migratedCount} of ${result.totalStories} stories to Twincidences.`,
    ];

    if (result.skippedCount > 0) {
      lines.push(`${result.skippedCount} stories were skipped.`);
    }

    if (result.errorCount > 0) {
      lines.push(`${result.errorCount} errors occurred during migration.`);
    }

    lines.push(
      `\nOriginal Story Vault data has been archived (${(result.archiveSize / 1024).toFixed(1)} KB).`
    );
    lines.push('You can export this data anytime from Settings.');

    return lines.join('\n');
  }

  /**
   * Export archived Story Vault data as JSON
   */
  static async exportArchivedStories(): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(ARCHIVED_STORIES_KEY);
      return data;
    } catch (error) {
      console.error('[Migration] Error exporting archived stories:', error);
      return null;
    }
  }

  /**
   * Delete archived Story Vault data (user can do this after verifying migration)
   */
  static async deleteArchivedStories(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ARCHIVED_STORIES_KEY);
      console.log('[Migration] Archived Story Vault data deleted');
    } catch (error) {
      console.error('[Migration] Error deleting archived stories:', error);
      throw new Error('Failed to delete archived stories');
    }
  }

  /**
   * Rollback migration (for testing or if user wants to revert)
   */
  static async rollback(): Promise<boolean> {
    try {
      // Load archived data
      const archiveData = await AsyncStorage.getItem(ARCHIVED_STORIES_KEY);
      if (!archiveData) {
        console.warn('[Migration] No archived data found for rollback');
        return false;
      }

      const archive = JSON.parse(archiveData);
      const stories: Story[] = archive.stories;

      // Restore to Story Vault storage
      await AsyncStorage.setItem(STORY_STORAGE_KEY, JSON.stringify({
        state: { stories },
      }));

      // Remove migrated twincidences (those with migrated_ prefix)
      const twincidences = await TwincidenceStorage.loadTwincidences();
      const nonMigrated = twincidences.filter((t) => !t.id.startsWith('migrated_'));
      await TwincidenceStorage.saveTwincidences(nonMigrated);

      // Reset migration flag
      await AsyncStorage.removeItem(MIGRATION_FLAG_KEY);
      await AsyncStorage.removeItem(`${MIGRATION_FLAG_KEY}_timestamp`);

      console.log(`[Migration] Rolled back ${stories.length} stories`);
      return true;
    } catch (error) {
      console.error('[Migration] Error during rollback:', error);
      return false;
    }
  }
}
