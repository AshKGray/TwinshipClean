import { useTwinStore } from '../../state/twinStore';
import { useStoryStore } from '../../state/stores/stories/storyStore';
import { Story as LegacyStory } from '../../state/twinStore';
import { Story, StoryCategory, StoryMilestone } from '../../types/stories';
import { StoryService } from './storyService';

export class MigrationService {
  static async migrateLegacyStories(): Promise<{
    migrated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Get legacy stories from twinStore
      const { stories: legacyStories } = useTwinStore.getState();
      const { addStory } = useStoryStore.getState();

      if (!legacyStories || legacyStories.length === 0) {
        return { migrated: 0, errors: [] };
      }

      for (const legacyStory of legacyStories) {
        try {
          const migratedStory = this.convertLegacyStory(legacyStory);
          addStory(migratedStory);
          migrated++;
        } catch (error) {
          errors.push(`Failed to migrate story "${legacyStory.title}": ${error}`);
        }
      }

      // Clear legacy stories after successful migration
      if (migrated > 0) {
        // Note: This would clear the legacy stories from twinStore
        // You might want to keep them for backup purposes
        console.log(`Successfully migrated ${migrated} stories`);
      }

      return { migrated, errors };
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return { migrated, errors };
    }
  }

  private static convertLegacyStory(legacyStory: LegacyStory): Omit<Story, 'id' | 'timestamp' | 'lastModified' | 'collaborations' | 'comments' | 'likes' | 'favorites' | 'views'> {
    // Convert legacy story to new story format
    const category: StoryCategory = this.inferCategory(legacyStory.title, legacyStory.content);
    
    // Create milestone data if the legacy story was marked as a milestone
    let milestone: StoryMilestone | undefined;
    if (legacyStory.milestone) {
      milestone = {
        type: 'custom',
        date: legacyStory.timestamp,
        significance: `Milestone from ${new Date(legacyStory.timestamp).toLocaleDateString()}`,
      };
    }

    // Convert legacy photos to new media format
    const media = (legacyStory.photos || []).map((photoUri, index) => ({
      id: `legacy_${legacyStory.id}_photo_${index}`,
      type: 'photo' as const,
      uri: photoUri,
      mimeType: 'image/jpeg',
      size: 0, // Size unknown for legacy photos
      compressed: false,
    }));

    // Extract tags from content (simple implementation)
    const tags = this.extractTagsFromContent(legacyStory.content);

    return {
      title: legacyStory.title,
      content: legacyStory.content,
      category,
      tags,
      media,
      milestone,
      authorId: 'legacy_user', // This should be replaced with actual user ID
      isShared: legacyStory.isShared || false,
      isPrivate: false,
      sharedWith: legacyStory.isShared ? ['twin'] : [],
      sharePermissions: 'view',
    };
  }

  private static inferCategory(title: string, content: string): StoryCategory {
    const text = (title + ' ' + content).toLowerCase();
    
    // Simple keyword-based category inference
    if (text.includes('birthday') || text.includes('birth') || text.includes('born')) {
      return 'milestones';
    }
    if (text.includes('childhood') || text.includes('young') || text.includes('kid')) {
      return 'childhood';
    }
    if (text.includes('travel') || text.includes('adventure') || text.includes('trip')) {
      return 'adventures';
    }
    if (text.includes('sync') || text.includes('telepathy') || text.includes('intuition') || text.includes('connection')) {
      return 'synchronicity';
    }
    if (text.includes('achievement') || text.includes('accomplish') || text.includes('success') || text.includes('award')) {
      return 'achievements';
    }
    
    // Default to memories
    return 'memories';
  }

  private static extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    
    // Simple keyword extraction for common twin-related terms
    const keywords = [
      'twin', 'twins', 'sister', 'brother', 'family', 'childhood', 'memory', 'memories',
      'birthday', 'celebration', 'milestone', 'achievement', 'adventure', 'travel',
      'school', 'friends', 'connection', 'bond', 'sync', 'telepathy', 'intuition'
    ];

    const textLower = content.toLowerCase();
    keywords.forEach(keyword => {
      if (textLower.includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    });

    // Limit to 5 tags
    return tags.slice(0, 5);
  }

  static async checkMigrationNeeded(): Promise<boolean> {
    try {
      const { stories: legacyStories } = useTwinStore.getState();
      const { stories: newStories } = useStoryStore.getState();
      
      // If we have legacy stories but no new stories, migration is needed
      return (legacyStories?.length || 0) > 0 && newStories.length === 0;
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return false;
    }
  }

  static async createMigrationBackup(): Promise<string | null> {
    try {
      const { stories: legacyStories } = useTwinStore.getState();
      
      if (!legacyStories || legacyStories.length === 0) {
        return null;
      }

      const backup = {
        version: 'legacy',
        timestamp: new Date().toISOString(),
        legacyStories,
      };

      const backupJson = JSON.stringify(backup, null, 2);
      const backupPath = `${FileSystem.documentDirectory}legacy_stories_backup_${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(backupPath, backupJson);
      return backupPath;
    } catch (error) {
      console.error('Failed to create migration backup:', error);
      return null;
    }
  }

  static getMigrationSummary(legacyStories: LegacyStory[]): {
    totalStories: number;
    withPhotos: number;
    milestones: number;
    sharedStories: number;
    estimatedCategories: { [key in StoryCategory]: number };
  } {
    let withPhotos = 0;
    let milestones = 0;
    let sharedStories = 0;
    const estimatedCategories: { [key in StoryCategory]: number } = {
      childhood: 0,
      milestones: 0,
      adventures: 0,
      synchronicity: 0,
      achievements: 0,
      memories: 0,
      other: 0,
    };

    legacyStories.forEach(story => {
      if (story.photos && story.photos.length > 0) withPhotos++;
      if (story.milestone) milestones++;
      if (story.isShared) sharedStories++;
      
      const category = this.inferCategory(story.title, story.content);
      estimatedCategories[category]++;
    });

    return {
      totalStories: legacyStories.length,
      withPhotos,
      milestones,
      sharedStories,
      estimatedCategories,
    };
  }
}

// Import FileSystem for backup functionality
import * as FileSystem from 'expo-file-system';