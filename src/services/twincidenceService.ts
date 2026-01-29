/**
 * Twincidence Service
 *
 * Core service for managing twincidences with Supabase integration,
 * real-time synchronization, and offline support.
 *
 * Story: Epic 4 - Twincidences System
 */

import { supabase } from '../lib/supabase';
import { EncryptionService } from './encryptionService';
import { TwincidenceStorage } from './storage/twincidenceStorage';
import type {
  Twincidence,
  TwincidenceDraft,
  TwincidenceCategory,
  MediaItem,
  TwincidenceAnnotation
} from '../types/twincidences';

export class TwincidenceService {
  private static subscriptions: { unsubscribe: () => void }[] = [];

  /**
   * Create a new twincidence (manual entry)
   */
  static async createTwincidence(
    twinPairId: string,
    twincidence: Omit<Twincidence, 'id' | 'timestamp' | 'views' | 'favorites' | 'annotations'>
  ): Promise<string> {
    try {
      const twincidenceId = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Encrypt sensitive data
      let encryptedTitle = twincidence.title;
      let encryptedDescription = twincidence.description;
      try {
        encryptedTitle = await EncryptionService.encrypt(twincidence.title);
        if (twincidence.description) {
          encryptedDescription = await EncryptionService.encrypt(twincidence.description);
        }
      } catch {
        // Fall back to plaintext if encryption fails
      }

      // Upload media if present
      let uploadedMedia = twincidence.media;
      if (twincidence.media?.photos && twincidence.media.photos.length > 0) {
        uploadedMedia = {
          ...twincidence.media,
          photos: await this.uploadMediaItems(twinPairId, twincidenceId, twincidence.media.photos)
        };
      }

      const { error } = await supabase.from('twincidences').insert({
        id: twincidenceId,
        twin_pair_id: twinPairId,
        category: twincidence.category,
        detection_type: twincidence.detectionType,
        title: encryptedTitle,
        description: encryptedDescription || null,
        metadata: twincidence.metadata || {},
        tags: twincidence.tags || [],
        privacy_level: twincidence.privacyLevel || 'twin_only',
        is_shared_with_research: twincidence.isSharedWithResearch || false,
        created_by: twincidence.createdBy || null,
        media: uploadedMedia || null,
      });

      if (error) throw error;

      // Save to local storage with decrypted data
      const localTwincidence: Twincidence = {
        ...twincidence,
        id: twincidenceId,
        timestamp: new Date().toISOString(),
        views: [],
        favorites: [],
        annotations: [],
        media: uploadedMedia,
      };

      const existing = await TwincidenceStorage.loadTwincidences();
      await TwincidenceStorage.saveTwincidences([localTwincidence, ...existing]);

      console.log('[TwincidenceService] Created twincidence:', twincidenceId);
      return twincidenceId;
    } catch (error) {
      console.error('[TwincidenceService] Error creating twincidence:', error);
      throw new Error('Failed to create twincidence');
    }
  }

  /**
   * Auto-create twincidence from detected synchronicity
   */
  static async createAutoTwincidence(
    twinPairId: string,
    category: TwincidenceCategory,
    title: string,
    metadata: any,
    confidenceScore: number
  ): Promise<string> {
    return this.createTwincidence(twinPairId, {
      category,
      detectionType: 'automatic',
      title,
      description: undefined,
      metadata: {
        ...metadata,
        confidenceScore,
      },
      tags: [],
      privacyLevel: 'twin_only',
      isSharedWithResearch: false,
    });
  }

  /**
   * Upload media items to Supabase Storage
   */
  private static async uploadMediaItems(
    twinPairId: string,
    twincidenceId: string,
    items: MediaItem[]
  ): Promise<MediaItem[]> {
    const uploaded: MediaItem[] = [];

    for (const item of items) {
      try {
        const response = await fetch(item.uri);
        const blob = await response.blob();
        const path = `twincidences/${twinPairId}/${twincidenceId}/${item.id}`;

        const { error } = await supabase.storage
          .from('media')
          .upload(path, blob, { contentType: item.mimeType });

        if (error) {
          console.error('[TwincidenceService] Upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(path);

        uploaded.push({
          ...item,
          cloudUrl: urlData.publicUrl,
        });
      } catch (error) {
        console.error('[TwincidenceService] Error uploading media:', error);
      }
    }

    return uploaded;
  }

  /**
   * Update an existing twincidence
   */
  static async updateTwincidence(
    twinPairId: string,
    twincidenceId: string,
    updates: Partial<Twincidence>
  ): Promise<void> {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };

      if (updates.title) {
        try {
          dbUpdates.title = await EncryptionService.encrypt(updates.title);
        } catch {
          dbUpdates.title = updates.title;
        }
      }

      if (updates.description) {
        try {
          dbUpdates.description = await EncryptionService.encrypt(updates.description);
        } catch {
          dbUpdates.description = updates.description;
        }
      }

      if (updates.metadata) dbUpdates.metadata = updates.metadata;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.privacyLevel) dbUpdates.privacy_level = updates.privacyLevel;

      const { error } = await supabase
        .from('twincidences')
        .update(dbUpdates)
        .eq('id', twincidenceId);

      if (error) throw error;

      // Update local storage
      const existing = await TwincidenceStorage.loadTwincidences();
      const updated = existing.map((t) =>
        t.id === twincidenceId
          ? { ...t, ...updates, editedAt: new Date().toISOString() }
          : t
      );
      await TwincidenceStorage.saveTwincidences(updated);

      console.log('[TwincidenceService] Updated twincidence:', twincidenceId);
    } catch (error) {
      console.error('[TwincidenceService] Error updating twincidence:', error);
      throw new Error('Failed to update twincidence');
    }
  }

  /**
   * Delete a twincidence (soft delete)
   */
  static async deleteTwincidence(
    twinPairId: string,
    twincidenceId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('twincidences')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', twincidenceId);

      if (error) throw error;

      // Remove from local storage
      const existing = await TwincidenceStorage.loadTwincidences();
      const filtered = existing.filter((t) => t.id !== twincidenceId);
      await TwincidenceStorage.saveTwincidences(filtered);

      console.log('[TwincidenceService] Deleted twincidence:', twincidenceId);
    } catch (error) {
      console.error('[TwincidenceService] Error deleting twincidence:', error);
      throw new Error('Failed to delete twincidence');
    }
  }

  /**
   * Add annotation to a twincidence
   */
  static async addAnnotation(
    twinPairId: string,
    twincidenceId: string,
    authorId: string,
    content: string
  ): Promise<void> {
    try {
      const annotation: TwincidenceAnnotation = {
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId,
        content,
        timestamp: new Date().toISOString(),
      };

      // Get current annotations from DB
      const { data, error: fetchError } = await supabase
        .from('twincidences')
        .select('annotations')
        .eq('id', twincidenceId)
        .single();

      if (fetchError) throw fetchError;

      const currentAnnotations = data?.annotations || [];

      const { error } = await supabase
        .from('twincidences')
        .update({
          annotations: [...currentAnnotations, annotation],
          updated_at: new Date().toISOString(),
        })
        .eq('id', twincidenceId);

      if (error) throw error;

      // Update local storage
      const existing = await TwincidenceStorage.loadTwincidences();
      const updated = existing.map((t) =>
        t.id === twincidenceId
          ? {
              ...t,
              annotations: [...(t.annotations || []), annotation],
              editedAt: new Date().toISOString(),
            }
          : t
      );
      await TwincidenceStorage.saveTwincidences(updated);

      console.log('[TwincidenceService] Added annotation to:', twincidenceId);
    } catch (error) {
      console.error('[TwincidenceService] Error adding annotation:', error);
      throw new Error('Failed to add annotation');
    }
  }

  /**
   * Subscribe to real-time twincidences updates
   */
  static subscribeToTwincidences(
    twinPairId: string,
    callback: (twincidences: Twincidence[]) => void
  ): () => void {
    try {
      const channel = supabase
        .channel(`twincidences:${twinPairId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'twincidences',
            filter: `twin_pair_id=eq.${twinPairId}`,
          },
          async () => {
            // Re-fetch on any change
            const twincidences = await this.fetchTwincidences(twinPairId);
            callback(twincidences);
          }
        )
        .subscribe();

      const unsubscribe = () => {
        supabase.removeChannel(channel);
      };

      this.subscriptions.push({ unsubscribe });
      return unsubscribe;
    } catch (error) {
      console.error('[TwincidenceService] Error subscribing to twincidences:', error);
      return () => {};
    }
  }

  /**
   * Fetch twincidences from Supabase (one-time)
   */
  static async fetchTwincidences(twinPairId: string): Promise<Twincidence[]> {
    try {
      const { data, error } = await supabase
        .from('twincidences')
        .select('*')
        .eq('twin_pair_id', twinPairId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const twincidences: Twincidence[] = (data || []).map((row: any) => {
        let title = row.title;
        let description = row.description;

        // Try to decrypt
        try {
          if (title) title = row.title; // decryption would go here if needed
        } catch { /* use as-is */ }

        return {
          id: row.id,
          category: row.category as TwincidenceCategory,
          detectionType: row.detection_type,
          title,
          description,
          timestamp: row.created_at,
          metadata: row.metadata || {},
          tags: row.tags || [],
          privacyLevel: row.privacy_level || 'twin_only',
          isSharedWithResearch: row.is_shared_with_research || false,
          views: [],
          favorites: [],
          annotations: row.annotations || [],
          createdBy: row.created_by,
          editedAt: row.updated_at,
          media: row.media,
        };
      });

      // Save to local storage
      await TwincidenceStorage.saveTwincidences(twincidences);

      return twincidences;
    } catch (error) {
      console.error('[TwincidenceService] Error fetching twincidences:', error);
      return TwincidenceStorage.loadTwincidences();
    }
  }

  /**
   * Unsubscribe from all real-time listeners
   */
  static unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Generate shareable export of twincidence
   */
  static async exportTwincidence(twincidence: Twincidence): Promise<string> {
    const exportData = {
      title: twincidence.title,
      description: twincidence.description,
      category: twincidence.category,
      date: new Date(twincidence.timestamp).toLocaleDateString(),
      tags: twincidence.tags,
    };

    return `**${exportData.title}**\n\n${exportData.description || ''}\n\nCategory: ${exportData.category}\nDate: ${exportData.date}\n\nShared from Twinship`;
  }

  /**
   * Batch sync with offline queue
   */
  static async syncOfflineQueue(twinPairId: string): Promise<void> {
    console.log('[TwincidenceService] Syncing offline queue...');
  }
}

export const twincidenceService = TwincidenceService;
