import AsyncStorage from '@react-native-async-storage/async-storage';
import { Twincidence, TwincidenceDraft, TwincidenceFilter, TwincidenceCategory } from '../../types/twincidences';

const TWINCIDENCES_KEY = 'twin_twincidences';
const DRAFTS_KEY = 'twin_twincidence_drafts';
const SETTINGS_KEY = 'twin_twincidence_settings';

export class TwincidenceStorage {
  /**
   * Save twincidences to AsyncStorage
   */
  static async saveTwincidences(twincidences: Twincidence[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TWINCIDENCES_KEY, JSON.stringify(twincidences));
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to save twincidences:', error);
      throw new Error('Failed to save twincidences to storage');
    }
  }

  /**
   * Load twincidences from AsyncStorage
   */
  static async loadTwincidences(): Promise<Twincidence[]> {
    try {
      const data = await AsyncStorage.getItem(TWINCIDENCES_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to load twincidences:', error);
      return [];
    }
  }

  /**
   * Save drafts to AsyncStorage
   */
  static async saveDrafts(drafts: TwincidenceDraft[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to save drafts:', error);
      throw new Error('Failed to save drafts to storage');
    }
  }

  /**
   * Load drafts from AsyncStorage
   */
  static async loadDrafts(): Promise<TwincidenceDraft[]> {
    try {
      const data = await AsyncStorage.getItem(DRAFTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to load drafts:', error);
      return [];
    }
  }

  /**
   * Batch save multiple twincidences (for bulk imports/migrations)
   */
  static async batchSaveTwincidences(newTwincidences: Twincidence[]): Promise<void> {
    try {
      const existing = await this.loadTwincidences();
      const combined = [...newTwincidences, ...existing];
      await this.saveTwincidences(combined);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to batch save twincidences:', error);
      throw new Error('Failed to batch save twincidences');
    }
  }

  /**
   * Get twincidence by ID
   */
  static async getTwincidenceById(id: string): Promise<Twincidence | null> {
    try {
      const twincidences = await this.loadTwincidences();
      return twincidences.find((t) => t.id === id) || null;
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to get twincidence by ID:', error);
      return null;
    }
  }

  /**
   * Delete twincidence by ID
   */
  static async deleteTwincidenceById(id: string): Promise<void> {
    try {
      const twincidences = await this.loadTwincidences();
      const filtered = twincidences.filter((t) => t.id !== id);
      await this.saveTwincidences(filtered);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to delete twincidence:', error);
      throw new Error('Failed to delete twincidence');
    }
  }

  /**
   * Search twincidences with filters
   */
  static async searchTwincidences(
    query: string,
    filters?: TwincidenceFilter
  ): Promise<Twincidence[]> {
    try {
      let results = await this.loadTwincidences();

      // Text search
      if (query.trim()) {
        const searchTerms = query.toLowerCase().split(' ').filter((term) => term.length > 0);
        results = results.filter((t) => {
          const searchableText = [
            t.title,
            t.description || '',
            ...t.tags,
          ].join(' ').toLowerCase();

          return searchTerms.every((term) => searchableText.includes(term));
        });
      }

      // Apply filters
      if (filters) {
        if (filters.categories?.length) {
          results = results.filter((t) => filters.categories!.includes(t.category));
        }

        if (filters.detectionTypes?.length) {
          results = results.filter((t) => filters.detectionTypes!.includes(t.detectionType));
        }

        if (filters.tags?.length) {
          results = results.filter((t) =>
            t.tags.some((tag) => filters.tags!.includes(tag))
          );
        }

        if (filters.dateRange) {
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          results = results.filter((t) => {
            const tDate = new Date(t.timestamp);
            return tDate >= start && tDate <= end;
          });
        }

        if (filters.hasMedia) {
          results = results.filter(
            (t) =>
              (t.media?.photos?.length || 0) > 0 ||
              (t.media?.videos?.length || 0) > 0 ||
              (t.media?.voiceNotes?.length || 0) > 0
          );
        }

        if (filters.minConfidence !== undefined) {
          results = results.filter(
            (t) => (t.metadata.confidenceScore || 0) >= filters.minConfidence!
          );
        }
      }

      return results;
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to search twincidences:', error);
      return [];
    }
  }

  /**
   * Get twincidences by category
   */
  static async getTwincidencesByCategory(category: TwincidenceCategory): Promise<Twincidence[]> {
    try {
      const twincidences = await this.loadTwincidences();
      return twincidences.filter((t) => t.category === category);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to get twincidences by category:', error);
      return [];
    }
  }

  /**
   * Get recent twincidences (sorted by timestamp, newest first)
   */
  static async getRecentTwincidences(limit: number = 20): Promise<Twincidence[]> {
    try {
      const twincidences = await this.loadTwincidences();
      return twincidences
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to get recent twincidences:', error);
      return [];
    }
  }

  /**
   * Clean up old drafts (older than 30 days)
   */
  static async cleanupExpiredDrafts(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const drafts = await this.loadDrafts();
      const now = Date.now();

      const validDrafts = drafts.filter((draft) => {
        const draftAge = now - new Date(draft.lastSaved).getTime();
        return draftAge < maxAge;
      });

      if (validDrafts.length !== drafts.length) {
        await this.saveDrafts(validDrafts);
        return drafts.length - validDrafts.length;
      }

      return 0;
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to cleanup expired drafts:', error);
      return 0;
    }
  }

  /**
   * Export twincidences as JSON
   */
  static async exportTwincidencesJSON(): Promise<string> {
    try {
      const twincidences = await this.loadTwincidences();
      const drafts = await this.loadDrafts();

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        twincidences,
        drafts,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to export twincidences:', error);
      throw new Error('Failed to export twincidences');
    }
  }

  /**
   * Clear all twincidence data (for testing/reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TWINCIDENCES_KEY, DRAFTS_KEY, SETTINGS_KEY]);
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to clear all data:', error);
      throw new Error('Failed to clear twincidence data');
    }
  }

  /**
   * Get storage size estimate
   */
  static async getStorageSize(): Promise<{ twincidences: number; drafts: number }> {
    try {
      const twincidencesData = await AsyncStorage.getItem(TWINCIDENCES_KEY);
      const draftsData = await AsyncStorage.getItem(DRAFTS_KEY);

      return {
        twincidences: twincidencesData ? new Blob([twincidencesData]).size : 0,
        drafts: draftsData ? new Blob([draftsData]).size : 0,
      };
    } catch (error) {
      console.error('[TwincidenceStorage] Failed to get storage size:', error);
      return { twincidences: 0, drafts: 0 };
    }
  }
}
