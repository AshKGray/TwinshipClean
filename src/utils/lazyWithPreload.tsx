import React, { ComponentType, lazy, Suspense } from 'react';
import { View, ActivityIndicator, Text, ImageBackground } from 'react-native';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { performanceTracker } from './performanceMeasurement';

// Basic loading fallback component with galaxy background
const LoadingFallback = () => (
  <ImageBackground
    source={require("../../assets/galaxybackground.png")}
    style={{ flex: 1 }}
  >
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#a855f7" />
      <Text className="text-white mt-4">Loading...</Text>
    </View>
  </ImageBackground>
);

// Enhanced loading fallback with skeleton support and galaxy background
const EnhancedLoadingFallback: React.FC<{
  type?: 'game' | 'assessment' | 'premium' | 'generic';
  message?: string;
}> = ({ type = 'generic', message }) => (
  <ImageBackground
    source={require("../../assets/galaxybackground.png")}
    style={{ flex: 1 }}
  >
    <LoadingSkeleton type={type} message={message} />
  </ImageBackground>
);

// Enhanced lazy loading with preload capability
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  let LoadedComponent: T | null = null;
  let factoryPromise: Promise<{ default: T }> | null = null;

  const load = () => {
    if (factoryPromise === null) {
      factoryPromise = factory();
      factoryPromise.then((module) => {
        LoadedComponent = module.default;
      });
    }
    return factoryPromise;
  };

  const LazyComponent = lazy(load);

  const Component = (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Add preload method to the component
  (Component as any).preload = load;

  return Component;
}

// Export regular lazy wrapper for simpler cases
export const lazyScreen = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Enhanced lazy screen with type-specific skeleton
export const lazyScreenWithSkeleton = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  skeletonType: 'game' | 'assessment' | 'premium' | 'generic' = 'generic',
  loadingMessage?: string
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<EnhancedLoadingFallback type={skeletonType} message={loadingMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Enhanced lazy with preload and skeleton support
export function lazyWithPreloadAndSkeleton<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  skeletonType: 'game' | 'assessment' | 'premium' | 'generic' = 'generic',
  loadingMessage?: string,
  componentName?: string
) {
  let factoryPromise: Promise<{ default: T }> | null = null;

  const load = () => {
    if (factoryPromise === null) {
      if (componentName) {
        performanceTracker.markLoadStart(componentName);
      }
      
      factoryPromise = factory().then((module) => {
        if (componentName) {
          performanceTracker.markLoadEnd(componentName);
        }
        return module;
      });
    }
    return factoryPromise;
  };

  const LazyComponent = lazy(load);

  const Component = (props: any) => {
    React.useEffect(() => {
      if (componentName) {
        performanceTracker.markRenderStart(componentName);
        
        // Mark render end after component mounts
        const timeoutId = setTimeout(() => {
          performanceTracker.markRenderEnd(componentName);
          performanceTracker.recordMemoryUsage(componentName);
        }, 0);
        
        return () => clearTimeout(timeoutId);
      }
    }, []);

    return (
      <Suspense fallback={<EnhancedLoadingFallback type={skeletonType} message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Add preload method to the component
  (Component as any).preload = load;

  return Component;
}