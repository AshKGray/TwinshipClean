/**
 * Storage Service - Unified storage interface for assessment data
 * Provides encryption, compression, and multi-tier storage management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { EncryptionService } from './encryptionService';

// Storage tiers for different data types and sensitivity levels
const standardStorage = new MMKV({ id: 'assessment-standard' });
const secureStorage = new MMKV({ 
  id: 'assessment-secure',
  encryptionKey: 'assessment-secure-key' // In production, use device keychain
});
const tempStorage = new MMKV({ id: 'assessment-temp' });

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  tier?: 'standard' | 'secure' | 'temp' | 'persistent';
  ttl?: number; // Time to live in milliseconds
  backup?: boolean;
}

export interface StorageItem {
  key: string;
  value: any;
  metadata: {
    createdAt: string;
    updatedAt: string;
    accessCount: number;
    lastAccessed: string;
    encrypted: boolean;
    compressed: boolean;
    size: number;
    ttl?: number;
    expiresAt?: string;
  };
}

export class StorageService {
  private static instance: StorageService;
  private compressionThreshold = 1024; // Compress data larger than 1KB
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Store data with automatic tier selection and optimization
   */
  async set(key: string, value: any, options: StorageOptions = {}): Promise<void> {
    const {
      encrypt = false,
      compress = true,
      tier = 'standard',
      ttl,
      backup = false
    } = options;

    let processedValue = value;
    let metadata: StorageItem['metadata'] = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      encrypted: encrypt,
      compressed: false,
      size: 0,
    };

    // Serialize data
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    metadata.size = serialized.length;

    // Apply compression if needed
    if (compress && serialized.length > this.compressionThreshold) {
      try {
        processedValue = await this.compressData(serialized);
        metadata.compressed = true;
      } catch (error) {
        console.warn('Compression failed, storing uncompressed:', error);
        processedValue = serialized;
      }
    } else {
      processedValue = serialized;
    }

    // Apply encryption if requested
    if (encrypt) {
      try {
        processedValue = await EncryptionService.encrypt(processedValue);
        metadata.encrypted = true;
      } catch (error) {
        throw new Error(`Encryption failed: ${error}`);
      }
    }

    // Set TTL if provided
    if (ttl) {
      metadata.ttl = ttl;
      metadata.expiresAt = new Date(Date.now() + ttl).toISOString();
    }

    const storageItem: StorageItem = {
      key,
      value: processedValue,
      metadata
    };

    // Store in appropriate tier
    await this.storeInTier(key, storageItem, tier);

    // Create backup if requested
    if (backup && tier !== 'temp') {
      await this.createBackup(key, storageItem);
    }
  }

  /**
   * Retrieve data with automatic decryption and decompression
   */
  async get(key: string, tier: StorageOptions['tier'] = 'standard'): Promise<any> {
    const item = await this.getFromTier(key, tier);
    if (!item) return null;

    // Check expiration
    if (item.metadata.expiresAt && new Date(item.metadata.expiresAt) < new Date()) {
      await this.remove(key, tier);
      return null;
    }

    let processedValue = item.value;

    // Decrypt if needed
    if (item.metadata.encrypted) {
      try {
        processedValue = await EncryptionService.decrypt(processedValue);
      } catch (error) {
        throw new Error(`Decryption failed: ${error}`);
      }
    }

    // Decompress if needed
    if (item.metadata.compressed) {
      try {
        processedValue = await this.decompressData(processedValue);
      } catch (error) {
        console.warn('Decompression failed:', error);
      }
    }

    // Update access metadata
    item.metadata.accessCount++;
    item.metadata.lastAccessed = new Date().toISOString();
    await this.storeInTier(key, item, tier);

    // Parse JSON if it's not already an object
    try {
      return typeof processedValue === 'string' ? JSON.parse(processedValue) : processedValue;
    } catch {
      return processedValue;
    }
  }

  /**
   * Store in secure tier with encryption
   */
  async setSecure(key: string, value: any, options: Omit<StorageOptions, 'tier' | 'encrypt'> = {}): Promise<void> {
    await this.set(key, value, { ...options, tier: 'secure', encrypt: true });
  }

  /**
   * Get from secure tier with decryption
   */
  async getSecure(key: string): Promise<any> {
    return this.get(key, 'secure');
  }

  /**
   * Store in persistent storage (device storage)
   */
  async setPersistent(key: string, value: any, options: StorageOptions = {}): Promise<void> {
    await this.set(key, value, { ...options, tier: 'persistent' });
  }

  /**
   * Get from persistent storage
   */
  async getPersistent(key: string): Promise<any> {
    return this.get(key, 'persistent');
  }

  /**
   * Remove data from storage
   */
  async remove(key: string, tier: StorageOptions['tier'] = 'standard'): Promise<void> {
    switch (tier) {
      case 'secure':
        secureStorage.delete(key);
        break;
      case 'temp':
        tempStorage.delete(key);
        break;
      case 'persistent':
        await AsyncStorage.removeItem(key);
        break;
      default:
        standardStorage.delete(key);
    }
  }

  /**
   * Remove from secure storage
   */
  async removeSecure(key: string): Promise<void> {
    await this.remove(key, 'secure');
  }

  /**
   * Clear all data from a specific tier
   */
  async clearTier(tier: StorageOptions['tier']): Promise<void> {
    switch (tier) {
      case 'secure':
        secureStorage.clearAll();
        break;
      case 'temp':
        tempStorage.clearAll();
        break;
      case 'persistent':
        await AsyncStorage.clear();
        break;
      default:
        standardStorage.clearAll();
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    tierStats: Record<string, { items: number; size: number }>;
    expiredItems: number;
  }> {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      tierStats: {
        standard: { items: 0, size: 0 },
        secure: { items: 0, size: 0 },
        temp: { items: 0, size: 0 },
        persistent: { items: 0, size: 0 },
      },
      expiredItems: 0,
    };

    // Count MMKV storage
    const mmkvStorages = {
      standard: standardStorage,
      secure: secureStorage,
      temp: tempStorage,
    };

    Object.entries(mmkvStorages).forEach(([tierName, storage]) => {
      const keys = storage.getAllKeys();
      keys.forEach(key => {
        try {
          const item = JSON.parse(storage.getString(key) || '{}') as StorageItem;
          stats.tierStats[tierName].items++;
          stats.tierStats[tierName].size += item.metadata.size;
          
          if (item.metadata.expiresAt && new Date(item.metadata.expiresAt) < new Date()) {
            stats.expiredItems++;
          }
        } catch {
          // Skip corrupted items
        }
      });
    });

    // Count AsyncStorage (persistent)
    try {
      const asyncKeys = await AsyncStorage.getAllKeys();
      const assessmentKeys = asyncKeys.filter(key => key.startsWith('assessment'));
      
      for (const key of assessmentKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          stats.tierStats.persistent.items++;
          stats.tierStats.persistent.size += value.length;
        }
      }
    } catch {
      // Handle AsyncStorage errors
    }

    // Calculate totals
    Object.values(stats.tierStats).forEach(tierStat => {
      stats.totalItems += tierStat.items;
      stats.totalSize += tierStat.size;
    });

    return stats;
  }

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<{ removed: number; freed: number }> {
    let removed = 0;
    let freed = 0;

    const storages = {
      standard: standardStorage,
      secure: secureStorage,
      temp: tempStorage,
    };

    for (const [tierName, storage] of Object.entries(storages)) {
      const keys = storage.getAllKeys();
      
      for (const key of keys) {
        try {
          const itemStr = storage.getString(key);
          if (!itemStr) continue;
          
          const item = JSON.parse(itemStr) as StorageItem;
          
          if (item.metadata.expiresAt && new Date(item.metadata.expiresAt) < new Date()) {
            storage.delete(key);
            removed++;
            freed += item.metadata.size;
          }
        } catch {
          // Remove corrupted items
          storage.delete(key);
          removed++;
        }
      }
    }

    return { removed, freed };
  }

  /**
   * Export all assessment data
   */
  async exportAll(): Promise<{
    standard: Record<string, any>;
    secure: Record<string, any>;
    persistent: Record<string, any>;
    metadata: {
      exportedAt: string;
      totalItems: number;
      totalSize: number;
    };
  }> {
    const exportData = {
      standard: {},
      secure: {},
      persistent: {},
      metadata: {
        exportedAt: new Date().toISOString(),
        totalItems: 0,
        totalSize: 0,
      },
    };

    // Export from MMKV storages (excluding temp)
    const storages = {
      standard: standardStorage,
      secure: secureStorage,
    };

    for (const [tierName, storage] of Object.entries(storages)) {
      const keys = storage.getAllKeys();
      
      for (const key of keys) {
        try {
          const value = await this.get(key, tierName as any);
          if (value) {
            exportData[tierName][key] = value;
            exportData.metadata.totalItems++;
          }
        } catch (error) {
          console.warn(`Failed to export ${key} from ${tierName}:`, error);
        }
      }
    }

    // Export from AsyncStorage
    try {
      const asyncKeys = await AsyncStorage.getAllKeys();
      const assessmentKeys = asyncKeys.filter(key => key.startsWith('assessment'));
      
      for (const key of assessmentKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            exportData.persistent[key] = JSON.parse(value);
            exportData.metadata.totalItems++;
            exportData.metadata.totalSize += value.length;
          } catch {
            exportData.persistent[key] = value;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to export from AsyncStorage:', error);
    }

    return exportData;
  }

  // Private methods
  private async storeInTier(key: string, item: StorageItem, tier: StorageOptions['tier']): Promise<void> {
    const serialized = JSON.stringify(item);
    
    switch (tier) {
      case 'secure':
        secureStorage.set(key, serialized);
        break;
      case 'temp':
        tempStorage.set(key, serialized);
        break;
      case 'persistent':
        await AsyncStorage.setItem(key, serialized);
        break;
      default:
        standardStorage.set(key, serialized);
    }
  }

  private async getFromTier(key: string, tier: StorageOptions['tier']): Promise<StorageItem | null> {
    let serialized: string | null = null;
    
    switch (tier) {
      case 'secure':
        serialized = secureStorage.getString(key) || null;
        break;
      case 'temp':
        serialized = tempStorage.getString(key) || null;
        break;
      case 'persistent':
        serialized = await AsyncStorage.getItem(key);
        break;
      default:
        serialized = standardStorage.getString(key) || null;
    }

    if (!serialized) return null;
    
    try {
      return JSON.parse(serialized) as StorageItem;
    } catch {
      return null;
    }
  }

  private async compressData(data: string): Promise<string> {
    // Simple compression using string manipulation
    // In production, consider using a proper compression library
    return btoa(data);
  }

  private async decompressData(data: string): Promise<string> {
    try {
      return atob(data);
    } catch {
      return data; // Return as-is if decompression fails
    }
  }

  private async createBackup(key: string, item: StorageItem): Promise<void> {
    const backupDir = `${FileSystem.documentDirectory}assessment_backups/`;
    
    try {
      // Ensure backup directory exists
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }

      const backupPath = `${backupDir}${key}.backup`;
      await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }

  private startCleanupTimer(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup timer (useful for testing or app shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const storageService = StorageService.getInstance();

// Convenience methods
export const {
  set,
  get,
  setSecure,
  getSecure,
  setPersistent,
  getPersistent,
  remove,
  removeSecure,
  clearTier,
  getStats,
  cleanup,
  exportAll,
} = storageService;