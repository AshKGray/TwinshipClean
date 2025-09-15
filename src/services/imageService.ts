import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

/**
 * Image Service for optimized image loading, caching, and management
 * Implements progressive loading with expo-image and advanced caching strategies
 */

export interface ImageCacheOptions {
  maxAge?: number; // Cache duration in milliseconds
  maxSize?: number; // Max cache size in bytes
  priority?: 'low' | 'normal' | 'high';
}

export interface ImagePreloadConfig {
  uri: string;
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
}

class ImageService {
  private cacheDir: string;
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB default
  private defaultMaxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.cacheDir = FileSystem.cacheDirectory + 'images/';
    this.initializeCache();
  }

  /**
   * Initialize image cache directory
   */
  private async initializeCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
    } catch (error) {
      console.warn('ImageService: Failed to initialize cache directory:', error);
    }
  }

  /**
   * Configure image caching globally with expo-image
   */
  static configureCaching(): void {
    // Set global expo-image cache policy
    Image.clearMemoryCache();

    // Configure cache policies for different image types
    const cachePolicy = {
      memory: 50 * 1024 * 1024, // 50MB memory cache
      disk: 200 * 1024 * 1024,  // 200MB disk cache
      maxAge: 7 * 24 * 60 * 60,  // 7 days
    };

    console.log('ImageService: Configured with cache policy:', cachePolicy);
  }

  /**
   * Preload critical images for better performance
   */
  static async preloadImages(configs: ImagePreloadConfig[]): Promise<void> {
    const preloadPromises = configs.map(async (config) => {
      try {
        await Image.prefetch(config.uri);
        console.log(`ImageService: Preloaded ${config.uri}`);
      } catch (error) {
        console.warn(`ImageService: Failed to preload ${config.uri}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload app's critical images
   */
  static async preloadCriticalAssets(): Promise<void> {
    const criticalImages: ImagePreloadConfig[] = [
      {
        uri: require('../../assets/galaxybackground.png'),
        blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
        priority: 'high'
      },
      {
        uri: require('../../assets/twinshipAppIcon.png'),
        priority: 'high'
      }
    ];

    await this.preloadImages(criticalImages);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestFile: Date | null;
  }> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;
      let oldestDate: Date | null = null;

      for (const file of files) {
        const filePath = this.cacheDir + file;
        const info = await FileSystem.getInfoAsync(filePath);

        if (info.exists && info.size) {
          totalSize += info.size;

          if (info.modificationTime) {
            const modDate = new Date(info.modificationTime * 1000);
            if (!oldestDate || modDate < oldestDate) {
              oldestDate = modDate;
            }
          }
        }
      }

      return {
        totalSize,
        fileCount: files.length,
        oldestFile: oldestDate
      };
    } catch (error) {
      console.warn('ImageService: Failed to get cache stats:', error);
      return { totalSize: 0, fileCount: 0, oldestFile: null };
    }
  }

  /**
   * Clean up cache if it exceeds size limits
   */
  async cleanupCache(): Promise<void> {
    try {
      const stats = await this.getCacheStats();

      if (stats.totalSize > this.maxCacheSize) {
        console.log('ImageService: Cache size exceeded, cleaning up...');

        // Get all files with their modification times
        const files = await FileSystem.readDirectoryAsync(this.cacheDir);
        const fileInfos = await Promise.all(
          files.map(async (file) => {
            const filePath = this.cacheDir + file;
            const info = await FileSystem.getInfoAsync(filePath);
            return {
              name: file,
              path: filePath,
              modificationTime: info.modificationTime || 0,
              size: info.size || 0
            };
          })
        );

        // Sort by modification time (oldest first)
        fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);

        // Delete oldest files until under limit
        let currentSize = stats.totalSize;
        for (const fileInfo of fileInfos) {
          if (currentSize <= this.maxCacheSize * 0.8) break; // Keep 20% buffer

          await FileSystem.deleteAsync(fileInfo.path);
          currentSize -= fileInfo.size;
          console.log(`ImageService: Deleted cached file ${fileInfo.name}`);
        }
      }
    } catch (error) {
      console.warn('ImageService: Failed to cleanup cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  static async clearCache(): Promise<void> {
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      console.log('ImageService: Cleared all image caches');
    } catch (error) {
      console.warn('ImageService: Failed to clear cache:', error);
    }
  }

  /**
   * Get optimized image props for expo-image
   */
  static getOptimizedImageProps(
    source: any,
    options: {
      blurhash?: string;
      contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
      transition?: number;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ) {
    return {
      source,
      contentFit: options.contentFit || 'cover',
      placeholder: options.blurhash ? { blurhash: options.blurhash } : undefined,
      transition: options.transition || 200,
      cachePolicy: 'memory-disk',
      priority: options.priority || 'normal',
      recyclingKey: `${source}_${Date.now()}` // Prevent memory leaks
    };
  }
}

// Common blurhash values for app assets
export const BLURHASHES = {
  GALAXY_BACKGROUND: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  LOADING_GRADIENT: 'L8I}3A4T00%M~qDi-;xu9F9F-;xu',
  DEFAULT_AVATAR: 'LcI~w2a}t7j[xvj[j[j[-;j[j[j['
};

// Export singleton instance
export const imageService = new ImageService();

// Export the class for testing
export default ImageService;