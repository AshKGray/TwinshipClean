import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';

/**
 * Hook for implementing lazy loading of images in scrollable views
 * Loads images only when they're about to come into view
 */

export interface LazyImageItem {
  id: string;
  source: any;
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface LazyLoadingConfig {
  threshold?: number; // Distance from viewport to start loading (in pixels)
  rootMargin?: number; // Additional margin around root (in pixels)
  enablePreloading?: boolean; // Whether to preload next images
  preloadCount?: number; // Number of images to preload ahead
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const useImageLazyLoading = (
  items: LazyImageItem[],
  config: LazyLoadingConfig = {}
) => {
  const {
    threshold = SCREEN_HEIGHT * 0.5, // Start loading when 50% of screen away
    rootMargin = 100,
    enablePreloading = true,
    preloadCount = 3
  } = config;

  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 10, // Consider visible when 10% is shown
    minimumViewTime: 100, // Minimum time to be considered visible
  });

  /**
   * Mark an image as loaded
   */
  const markImageAsLoaded = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]));
  }, []);

  /**
   * Check if an image should be loaded
   */
  const shouldLoadImage = useCallback((imageId: string) => {
    return loadedImages.has(imageId) || visibleItems.has(imageId);
  }, [loadedImages, visibleItems]);

  /**
   * Handle viewability change for FlatList/ScrollView
   */
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems: viewable }: { viewableItems: any[] }) => {
      const currentVisible = new Set<string>();
      const toLoad = new Set<string>();

      // Mark currently visible items
      viewable.forEach(item => {
        if (item.item?.id) {
          currentVisible.add(item.item.id);
          toLoad.add(item.item.id);
        }
      });

      // Preload upcoming items if enabled
      if (enablePreloading) {
        viewable.forEach(item => {
          const currentIndex = items.findIndex(i => i.id === item.item?.id);
          if (currentIndex !== -1) {
            // Load next items
            for (let i = 1; i <= preloadCount; i++) {
              const nextIndex = currentIndex + i;
              if (nextIndex < items.length) {
                toLoad.add(items[nextIndex].id);
              }
            }
          }
        });
      }

      setVisibleItems(currentVisible);
      setLoadedImages(prev => new Set([...prev, ...toLoad]));
    },
    [items, enablePreloading, preloadCount]
  );

  /**
   * Get optimized image props for lazy loading
   */
  const getLazyImageProps = useCallback((item: LazyImageItem) => {
    const shouldLoad = shouldLoadImage(item.id);

    return {
      source: shouldLoad ? item.source : undefined,
      placeholder: item.blurhash ? { blurhash: item.blurhash } : undefined,
      contentFit: 'cover' as const,
      transition: shouldLoad ? 200 : 0,
      cachePolicy: 'memory-disk' as const,
      priority: item.priority || 'normal' as const,
      onLoad: () => markImageAsLoaded(item.id),
      // Use a placeholder source if not ready to load
      ...(shouldLoad ? {} : {
        source: require('../../assets/placeholder.png') // Add a 1x1 transparent placeholder
      })
    };
  }, [shouldLoadImage, markImageAsLoaded]);

  /**
   * Preload specific images manually
   */
  const preloadImages = useCallback((imageIds: string[]) => {
    setLoadedImages(prev => new Set([...prev, ...imageIds]));
  }, []);

  /**
   * Reset all loaded images (useful for refresh)
   */
  const resetLoadedImages = useCallback(() => {
    setLoadedImages(new Set());
    setVisibleItems(new Set());
  }, []);

  /**
   * Get stats about loading state
   */
  const getLoadingStats = useCallback(() => {
    return {
      totalItems: items.length,
      loadedCount: loadedImages.size,
      visibleCount: visibleItems.size,
      loadingProgress: items.length > 0 ? loadedImages.size / items.length : 0
    };
  }, [items.length, loadedImages.size, visibleItems.size]);

  return {
    // Main functions
    getLazyImageProps,
    handleViewableItemsChanged,

    // Manual controls
    preloadImages,
    resetLoadedImages,
    markImageAsLoaded,

    // State queries
    shouldLoadImage,
    getLoadingStats,

    // ViewabilityConfig for FlatList
    viewabilityConfig: viewabilityConfigRef.current,

    // Current state
    loadedImages,
    visibleItems
  };
};

/**
 * Simplified hook for basic lazy loading without FlatList integration
 */
export const useSimpleLazyLoading = (imageId: string, isVisible: boolean = true) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !shouldLoad) {
      // Small delay to prevent loading too many images at once
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldLoad]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    shouldLoad,
    isLoaded,
    handleLoad
  };
};