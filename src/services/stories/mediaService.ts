import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { StoryMedia, MediaType } from '../../types/stories';

export class MediaService {
  private static storageDirectory = FileSystem.documentDirectory + 'stories/media/';

  static async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.storageDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.storageDirectory, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize media storage:', error);
      throw new Error('Failed to initialize media storage');
    }
  }

  static async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      const compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize to max width of 1080px
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );
      return compressed.uri;
    } catch (error) {
      console.error('Failed to compress image:', error);
      return uri; // Return original URI if compression fails
    }
  }

  static async saveMediaToStorage(
    media: StoryMedia,
    storyId: string
  ): Promise<{ localUri: string; size: number }> {
    await this.initializeStorage();

    try {
      const filename = `${storyId}_${media.id}.${this.getFileExtension(media.mimeType)}`;
      const localUri = this.storageDirectory + filename;

      // Compress image if needed
      let sourceUri = media.uri;
      if (media.type === 'photo' && !media.compressed) {
        sourceUri = await this.compressImage(media.uri, 0.8);
      }

      // Copy file to local storage
      await FileSystem.copyAsync({
        from: sourceUri,
        to: localUri,
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      const size = fileInfo.exists ? fileInfo.size || 0 : 0;

      return { localUri, size };
    } catch (error) {
      console.error('Failed to save media to storage:', error);
      throw new Error('Failed to save media file');
    }
  }

  static async deleteMediaFromStorage(localUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localUri);
      }
    } catch (error) {
      console.error('Failed to delete media file:', error);
    }
  }

  static async generateThumbnail(videoUri: string): Promise<string | undefined> {
    try {
      // Note: This would require expo-av VideoThumbnails or similar
      // For now, return undefined as thumbnail generation is not implemented
      // In a real implementation, you would use expo-video-thumbnails
      return undefined;
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      return undefined;
    }
  }

  static getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/mov': 'mov',
      'video/quicktime': 'mov',
      'audio/mp3': 'mp3',
      'audio/m4a': 'm4a',
      'audio/wav': 'wav',
      'audio/aac': 'aac',
    };
    return extensions[mimeType] || 'bin';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    formattedSize: string;
  }> {
    try {
      await this.initializeStorage();
      const files = await FileSystem.readDirectoryAsync(this.storageDirectory);
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = this.storageDirectory + file;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        formattedSize: this.formatFileSize(totalSize),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        formattedSize: '0 Bytes',
      };
    }
  }

  static async cleanupOrphanedFiles(activeMediaIds: string[]): Promise<void> {
    try {
      await this.initializeStorage();
      const files = await FileSystem.readDirectoryAsync(this.storageDirectory);
      
      for (const file of files) {
        const filePath = this.storageDirectory + file;
        
        // Extract media ID from filename (format: storyId_mediaId.ext)
        const parts = file.split('_');
        if (parts.length >= 2) {
          const mediaIdWithExt = parts[1];
          const mediaId = mediaIdWithExt.split('.')[0];
          
          if (!activeMediaIds.includes(mediaId)) {
            await FileSystem.deleteAsync(filePath);
            console.log(`Cleaned up orphaned file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned files:', error);
    }
  }

  static async exportMedia(media: StoryMedia[], storyTitle: string): Promise<string[]> {
    try {
      const exportedFiles: string[] = [];
      const exportDirectory = FileSystem.documentDirectory + 'exports/';
      
      // Create export directory
      const dirInfo = await FileSystem.getInfoAsync(exportDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(exportDirectory, { intermediates: true });
      }

      for (const mediaItem of media) {
        const extension = this.getFileExtension(mediaItem.mimeType);
        const exportFilename = `${storyTitle}_${mediaItem.id}.${extension}`;
        const exportPath = exportDirectory + exportFilename;

        await FileSystem.copyAsync({
          from: mediaItem.uri,
          to: exportPath,
        });

        exportedFiles.push(exportPath);
      }

      return exportedFiles;
    } catch (error) {
      console.error('Failed to export media:', error);
      throw new Error('Failed to export media files');
    }
  }

  static validateMediaFile(uri: string, type: MediaType, maxSizeInMB: number = 50): boolean {
    // Basic validation - in a real implementation, you would check file size and format
    if (!uri) return false;
    
    // Check URI format
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      return false;
    }

    return true;
  }

  static getMediaTypeFromMimeType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'photo'; // Default fallback
  }

  static async getMediaDuration(uri: string, type: MediaType): Promise<number | undefined> {
    // Note: This would require expo-av or similar for actual implementation
    // For now, return undefined as duration detection is not implemented
    if (type === 'video' || type === 'audio') {
      // In a real implementation, you would use expo-av to get media duration
      return undefined;
    }
    return undefined;
  }
}