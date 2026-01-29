/**
 * Twincidence Service
 *
 * Core service for managing twincidences with Firebase integration,
 * real-time synchronization, and offline support.
 *
 * Story: Epic 4 - Twincidences System
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase/config';
import { encryptionService } from './encryptionService';
import { TwincidenceStorage } from './storage/twincidenceStorage';
import type {
  Twincidence,
  TwincidenceDraft,
  TwincidenceCategory,
  MediaItem,
  TwincidenceAnnotation
} from '../types/twincidences';
import type { TwincidenceDoc } from '../models/firebase/schema';

export class TwincidenceService {
  private static unsubscribes: (() => void)[] = [];

  /**
   * Create a new twincidence (manual entry)
   */
  static async createTwincidence(
    twinPairId: string,
    twincidence: Omit<Twincidence, 'id' | 'timestamp' | 'views' | 'favorites' | 'annotations'>
  ): Promise<string> {
    try {
      const twincidenceId = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const collectionRef = collection(db, 'twinPairs', twinPairId, 'twincidences');
      const docRef = doc(collectionRef, twincidenceId);

      // Encrypt sensitive data
      const encryptedTitle = await encryptionService.encryptText(twincidence.title);
      const encryptedDescription = twincidence.description
        ? await encryptionService.encryptText(twincidence.description)
        : undefined;

      // Upload media if present
      let uploadedMedia = twincidence.media;
      if (twincidence.media?.photos && twincidence.media.photos.length > 0) {
        uploadedMedia = {
          ...twincidence.media,
          photos: await this.uploadMediaItems(twinPairId, twincidenceId, twincidence.media.photos)
        };
      }

      const firestoreDoc: TwincidenceDoc = {
        id: twincidenceId,
        title: encryptedTitle,
        description: encryptedDescription || '',
        type: twincidence.detectionType,
        detectedAt: Timestamp.now(),
        metadata: twincidence.metadata,
        createdBy: twincidence.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isDeleted: false,
      };

      await setDoc(docRef, firestoreDoc);

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
   * Upload media items to Firebase Storage
   */
  private static async uploadMediaItems(
    twinPairId: string,
    twincidenceId: string,
    items: MediaItem[]
  ): Promise<MediaItem[]> {
    const uploaded: MediaItem[] = [];

    for (const item of items) {
      try {
        // Convert URI to blob
        const response = await fetch(item.uri);
        const blob = await response.blob();

        // Create storage reference
        const storageRef = ref(
          storage,
          `twinPairs/${twinPairId}/twincidences/${twincidenceId}/${item.id}`
        );

        // Upload to Firebase Storage
        await uploadBytes(storageRef, blob, {
          contentType: item.mimeType,
        });

        // Get download URL
        const cloudUrl = await getDownloadURL(storageRef);

        uploaded.push({
          ...item,
          cloudUrl,
        });
      } catch (error) {
        console.error('[TwincidenceService] Error uploading media:', error);
        // Continue with other items
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
      const docRef = doc(db, 'twinPairs', twinPairId, 'twincidences', twincidenceId);

      const firestoreUpdates: Partial<TwincidenceDoc> = {
        updatedAt: Timestamp.now(),
      };

      if (updates.title) {
        firestoreUpdates.title = await encryptionService.encryptText(updates.title);
      }

      if (updates.description) {
        firestoreUpdates.description = await encryptionService.encryptText(updates.description);
      }

      if (updates.metadata) {
        firestoreUpdates.metadata = updates.metadata;
      }

      await updateDoc(docRef, firestoreUpdates);

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
      const docRef = doc(db, 'twinPairs', twinPairId, 'twincidences', twincidenceId);

      // Soft delete in Firestore
      await updateDoc(docRef, {
        isDeleted: true,
        updatedAt: Timestamp.now(),
      });

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
      const docRef = doc(db, 'twinPairs', twinPairId, 'twincidences', twincidenceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Twincidence not found');
      }

      const annotation: TwincidenceAnnotation = {
        id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId,
        content,
        timestamp: new Date().toISOString(),
      };

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
      const collectionRef = collection(db, 'twinPairs', twinPairId, 'twincidences');
      const q = query(
        collectionRef,
        where('isDeleted', '==', false),
        orderBy('detectedAt', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const twincidences: Twincidence[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as TwincidenceDoc;

            // Decrypt sensitive data
            const decryptedTitle = await encryptionService.decryptText(data.title);
            const decryptedDescription = data.description
              ? await encryptionService.decryptText(data.description)
              : undefined;

            const twincidence: Twincidence = {
              id: data.id,
              category: this.mapTypeToCategory(data.type),
              detectionType: data.type,
              title: decryptedTitle,
              description: decryptedDescription,
              timestamp: data.detectedAt.toDate().toISOString(),
              metadata: data.metadata || {},
              tags: [],
              privacyLevel: 'twin_only',
              isSharedWithResearch: false,
              views: [],
              favorites: [],
              annotations: [],
              createdBy: data.createdBy,
              editedAt: data.updatedAt?.toDate().toISOString(),
            };

            twincidences.push(twincidence);
          }

          // Save to local storage
          await TwincidenceStorage.saveTwincidences(twincidences);

          callback(twincidences);
        },
        (error) => {
          console.error('[TwincidenceService] Subscription error:', error);
        }
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('[TwincidenceService] Error subscribing to twincidences:', error);
      return () => {};
    }
  }

  /**
   * Fetch twincidences from Firestore (one-time)
   */
  static async fetchTwincidences(twinPairId: string): Promise<Twincidence[]> {
    try {
      const collectionRef = collection(db, 'twinPairs', twinPairId, 'twincidences');
      const q = query(
        collectionRef,
        where('isDeleted', '==', false),
        orderBy('detectedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const twincidences: Twincidence[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as TwincidenceDoc;

        const decryptedTitle = await encryptionService.decryptText(data.title);
        const decryptedDescription = data.description
          ? await encryptionService.decryptText(data.description)
          : undefined;

        const twincidence: Twincidence = {
          id: data.id,
          category: this.mapTypeToCategory(data.type),
          detectionType: data.type,
          title: decryptedTitle,
          description: decryptedDescription,
          timestamp: data.detectedAt.toDate().toISOString(),
          metadata: data.metadata || {},
          tags: [],
          privacyLevel: 'twin_only',
          isSharedWithResearch: false,
          views: [],
          favorites: [],
          annotations: [],
          createdBy: data.createdBy,
        };

        twincidences.push(twincidence);
      }

      // Save to local storage
      await TwincidenceStorage.saveTwincidences(twincidences);

      return twincidences;
    } catch (error) {
      console.error('[TwincidenceService] Error fetching twincidences:', error);
      // Return local storage as fallback
      return TwincidenceStorage.loadTwincidences();
    }
  }

  /**
   * Map Firestore type to TwincidenceCategory
   */
  private static mapTypeToCategory(type: string): TwincidenceCategory {
    // This is a simplified mapping - extend based on your needs
    return type as TwincidenceCategory;
  }

  /**
   * Unsubscribe from all real-time listeners
   */
  static unsubscribeAll(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
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
    // TODO: Implement offline queue processing
    // This would handle twincidences created while offline
    console.log('[TwincidenceService] Syncing offline queue...');
  }
}

export const twincidenceService = TwincidenceService;
