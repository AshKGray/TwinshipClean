import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, StoryDraft, StoryFilter, StoryStats } from '../../types/stories';
import { MediaService } from './mediaService';

const STORIES_STORAGE_KEY = 'twin_stories';
const DRAFTS_STORAGE_KEY = 'twin_story_drafts';

export class StoryService {
  static async saveStories(stories: Story[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
    } catch (error) {
      console.error('Failed to save stories:', error);
      throw new Error('Failed to save stories to storage');
    }
  }

  static async loadStories(): Promise<Story[]> {
    try {
      const storiesJson = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
      if (storiesJson) {
        return JSON.parse(storiesJson);
      }
      return [];
    } catch (error) {
      console.error('Failed to load stories:', error);
      return [];
    }
  }

  static async saveDrafts(drafts: StoryDraft[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save drafts:', error);
      throw new Error('Failed to save drafts to storage');
    }
  }

  static async loadDrafts(): Promise<StoryDraft[]> {
    try {
      const draftsJson = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (draftsJson) {
        return JSON.parse(draftsJson);
      }
      return [];
    } catch (error) {
      console.error('Failed to load drafts:', error);
      return [];
    }
  }

  static async exportStoryData(story: Story): Promise<{ 
    story: Omit<Story, 'media'>;
    mediaFiles: string[];
  }> {
    try {
      // Export media files
      const mediaFiles = await MediaService.exportMedia(story.media, story.title);
      
      // Create story data without media URIs (since they're exported separately)
      const { media, ...storyWithoutMedia } = story;
      
      return {
        story: storyWithoutMedia,
        mediaFiles,
      };
    } catch (error) {
      console.error('Failed to export story:', error);
      throw new Error('Failed to export story data');
    }
  }

  static async generateStoryBackup(): Promise<string> {
    try {
      const stories = await this.loadStories();
      const drafts = await this.loadDrafts();
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        stories,
        drafts,
      };

      const backupJson = JSON.stringify(backup, null, 2);
      const backupPath = `${FileSystem.documentDirectory}twin_stories_backup_${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(backupPath, backupJson);
      return backupPath;
    } catch (error) {
      console.error('Failed to generate backup:', error);
      throw new Error('Failed to generate story backup');
    }
  }

  static async restoreFromBackup(backupPath: string): Promise<{
    storiesRestored: number;
    draftsRestored: number;
  }> {
    try {
      const backupData = await FileSystem.readAsStringAsync(backupPath);
      const backup = JSON.parse(backupData);
      
      if (backup.version !== '1.0') {
        throw new Error('Unsupported backup version');
      }

      const stories: Story[] = backup.stories || [];
      const drafts: StoryDraft[] = backup.drafts || [];

      await this.saveStories(stories);
      await this.saveDrafts(drafts);

      return {
        storiesRestored: stories.length,
        draftsRestored: drafts.length,
      };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  static generateStoryId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static validateStory(story: Partial<Story>): string[] {
    const errors: string[] = [];

    if (!story.title?.trim()) {
      errors.push('Story title is required');
    }

    if (!story.content?.trim()) {
      errors.push('Story content is required');
    }

    if (story.title && story.title.length > 200) {
      errors.push('Story title must be less than 200 characters');
    }

    if (story.content && story.content.length > 10000) {
      errors.push('Story content must be less than 10,000 characters');
    }

    if (story.tags && story.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
    }

    if (story.media && story.media.length > 20) {
      errors.push('Maximum 20 media files allowed');
    }

    return errors;
  }

  static async searchStories(
    stories: Story[],
    query: string,
    filters?: StoryFilter
  ): Promise<Story[]> {
    let results = [...stories];

    // Text search
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      results = results.filter(story => {
        const searchableText = [
          story.title,
          story.content,
          ...story.tags,
          story.milestone?.significance || '',
          story.location?.address || '',
          story.location?.placeName || '',
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply filters
    if (filters) {
      if (filters.categories?.length) {
        results = results.filter(story => filters.categories!.includes(story.category));
      }

      if (filters.tags?.length) {
        results = results.filter(story =>
          story.tags.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        results = results.filter(story => {
          const storyDate = new Date(story.timestamp);
          return storyDate >= start && storyDate <= end;
        });
      }

      if (filters.milestoneOnly) {
        results = results.filter(story => !!story.milestone);
      }

      if (filters.sharedOnly) {
        results = results.filter(story => story.isShared);
      }

      if (filters.authorId) {
        results = results.filter(story => story.authorId === filters.authorId);
      }

      if (filters.hasMedia) {
        results = results.filter(story => story.media.length > 0);
      }
    }

    return results;
  }

  static calculateStoryStats(stories: Story[]): StoryStats {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalStories: stories.length,
      storiesThisMonth: stories.filter(s => new Date(s.timestamp) >= thisMonth).length,
      categoryCounts: stories.reduce((counts, story) => {
        counts[story.category] = (counts[story.category] || 0) + 1;
        return counts;
      }, {} as any),
      totalMedia: stories.reduce((sum, story) => sum + story.media.length, 0),
      totalViews: stories.reduce((sum, story) => sum + story.views.length, 0),
      totalLikes: stories.reduce((sum, story) => sum + story.likes.length, 0),
      collaborationCount: stories.reduce((sum, story) => sum + story.collaborations.length, 0),
      milestoneCount: stories.filter(s => !!s.milestone).length,
    };
  }

  static sortStories(stories: Story[], sortBy: 'newest' | 'oldest' | 'popular' | 'title'): Story[] {
    const sorted = [...stories];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      case 'popular':
        return sorted.sort((a, b) => {
          const aPopularity = a.likes.length + a.views.length + a.comments.length;
          const bPopularity = b.likes.length + b.views.length + b.comments.length;
          return bPopularity - aPopularity;
        });
      
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return sorted;
    }
  }

  static async cleanupExpiredDrafts(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const drafts = await this.loadDrafts();
      const now = Date.now();
      
      const validDrafts = drafts.filter(draft => {
        const draftAge = now - new Date(draft.lastSaved).getTime();
        return draftAge < maxAge;
      });

      if (validDrafts.length !== drafts.length) {
        await this.saveDrafts(validDrafts);
        return drafts.length - validDrafts.length;
      }

      return 0;
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error);
      return 0;
    }
  }
}

// Import FileSystem for backup functionality
import * as FileSystem from 'expo-file-system';