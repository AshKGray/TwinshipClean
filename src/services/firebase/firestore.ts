/**
 * Firestore Service
 *
 * Provides CRUD operations and real-time listeners for Firestore.
 * Wraps Firebase Firestore SDK with convenience methods and error handling.
 *
 * Story: 7-3 Firestore Data Models and Schema
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
  type WhereFilterOp,
  type OrderByDirection,
} from 'firebase/firestore';
import { db } from './firebase.config';

/**
 * Query filter helper
 */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * Order by helper
 */
export interface OrderBy {
  field: string;
  direction: OrderByDirection;
}

/**
 * Firestore Service Class
 */
class FirestoreServiceClass {
  /**
   * Create document in collection
   */
  async createDocument<T extends Record<string, any>>(
    collectionPath: string,
    documentId: string,
    data: T
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);

      // Add server timestamps for createdAt and updatedAt
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, dataWithTimestamps);
      console.log(`✅ Document created: ${collectionPath}/${documentId}`);
    } catch (error) {
      console.error(`❌ Error creating document:`, error);
      throw error;
    }
  }

  /**
   * Update document in collection
   */
  async updateDocument<T extends Record<string, any>>(
    collectionPath: string,
    documentId: string,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);

      // Add server timestamp for updatedAt
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updatesWithTimestamp);
      console.log(`✅ Document updated: ${collectionPath}/${documentId}`);
    } catch (error) {
      console.error(`❌ Error updating document:`, error);
      throw error;
    }
  }

  /**
   * Delete document from collection
   */
  async deleteDocument(collectionPath: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await deleteDoc(docRef);
      console.log(`✅ Document deleted: ${collectionPath}/${documentId}`);
    } catch (error) {
      console.error(`❌ Error deleting document:`, error);
      throw error;
    }
  }

  /**
   * Soft delete document (set isDeleted flag)
   */
  async softDeleteDocument(collectionPath: string, documentId: string): Promise<void> {
    try {
      await this.updateDocument(collectionPath, documentId, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      console.log(`✅ Document soft deleted: ${collectionPath}/${documentId}`);
    } catch (error) {
      console.error(`❌ Error soft deleting document:`, error);
      throw error;
    }
  }

  /**
   * Get single document
   */
  async getDocument<T>(collectionPath: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }

      console.log(`⚠️  Document not found: ${collectionPath}/${documentId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting document:`, error);
      throw error;
    }
  }

  /**
   * Query collection with filters
   */
  async queryCollection<T>(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));

      console.log(`✅ Query results: ${results.length} documents from ${collectionPath}`);
      return results;
    } catch (error) {
      console.error(`❌ Error querying collection:`, error);
      throw error;
    }
  }

  /**
   * Query collection with builder methods (convenience)
   */
  async queryCollectionSimple<T>(
    collectionPath: string,
    filters?: QueryFilter[],
    orderByField?: OrderBy,
    limitCount?: number
  ): Promise<T[]> {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters) {
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }

    // Add ordering
    if (orderByField) {
      constraints.push(orderBy(orderByField.field, orderByField.direction));
    }

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    return this.queryCollection<T>(collectionPath, constraints);
  }

  /**
   * Real-time listener for single document
   */
  onDocumentSnapshot<T>(
    collectionPath: string,
    documentId: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionPath, documentId);

    console.log(`👂 Listening to document: ${collectionPath}/${documentId}`);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as T;
          callback(data);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`❌ Error in document snapshot:`, error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Real-time listener for collection
   */
  onCollectionSnapshot<T>(
    collectionPath: string,
    constraints: QueryConstraint[],
    callback: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);

    console.log(`👂 Listening to collection: ${collectionPath}`);

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        callback(data);
      },
      (error) => {
        console.error(`❌ Error in collection snapshot:`, error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Real-time listener with simple query builder
   */
  onCollectionSnapshotSimple<T>(
    collectionPath: string,
    filters?: QueryFilter[],
    orderByField?: OrderBy,
    limitCount?: number,
    callback?: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters) {
      filters.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }

    // Add ordering
    if (orderByField) {
      constraints.push(orderBy(orderByField.field, orderByField.direction));
    }

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    return this.onCollectionSnapshot<T>(
      collectionPath,
      constraints,
      callback || (() => {}),
      onError
    );
  }

  /**
   * Batch write multiple documents
   */
  async batchWrite(operations: Array<{
    operation: 'create' | 'update' | 'delete';
    collectionPath: string;
    documentId: string;
    data?: any;
  }>): Promise<void> {
    try {
      // Note: Firebase Web SDK v9+ doesn't have WriteBatch like v8
      // We'll execute operations sequentially for now
      // For true batch writes, consider using Firebase Admin SDK on backend

      for (const op of operations) {
        switch (op.operation) {
          case 'create':
            await this.createDocument(op.collectionPath, op.documentId, op.data);
            break;
          case 'update':
            await this.updateDocument(op.collectionPath, op.documentId, op.data);
            break;
          case 'delete':
            await this.deleteDocument(op.collectionPath, op.documentId);
            break;
        }
      }

      console.log(`✅ Batch write completed: ${operations.length} operations`);
    } catch (error) {
      console.error(`❌ Error in batch write:`, error);
      throw error;
    }
  }

  /**
   * Convert Firestore Timestamp to ISO string
   */
  timestampToISO(timestamp: Timestamp): string {
    return timestamp.toDate().toISOString();
  }

  /**
   * Convert ISO string to Firestore Timestamp
   */
  isoToTimestamp(isoString: string): Timestamp {
    return Timestamp.fromDate(new Date(isoString));
  }

  /**
   * Get server timestamp
   */
  getServerTimestamp(): any {
    return serverTimestamp();
  }
}

// Export singleton instance
export const firestoreService = new FirestoreServiceClass();
