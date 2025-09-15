import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useEffect, useState } from "react";
import { deepLinkManager } from "./src/utils/deepLinking";
// Re-enable subscription service with safe imports
// import { invitationService } from "./src/services/invitationService";
import { subscriptionService } from "./src/services/subscriptionService";
import ImageService from "./src/services/imageService";
import * as SplashScreen from 'expo-splash-screen';
import { performanceTracker } from "./src/utils/performanceTracker";
import { FontOptimizer } from "./src/utils/fontOptimization";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const [isCriticalReady, setIsCriticalReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Mark first render
        performanceTracker.mark('firstRender');

        // Phase 1: Critical resources only
        await initializeCriticalResources();
        performanceTracker.mark('criticalResourcesLoaded');
        setIsCriticalReady(true);

        // Phase 2: Defer non-critical initialization
        requestAnimationFrame(() => {
          setTimeout(() => {
            initializeNonCriticalServices();
          }, 100); // Small delay to ensure UI is responsive
        });

        // Mark app ready after critical resources
        setTimeout(() => {
          performanceTracker.mark('appReady');
        }, 50);

      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still mark as ready to prevent infinite loading
        setIsCriticalReady(true);
        performanceTracker.mark('appReady');
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      deepLinkManager.cleanup();
    };
  }, []);

  // Phase 1: Critical resources only - must complete before app is usable
  const initializeCriticalResources = async () => {
    try {
      // Load critical fonts first (non-blocking for startup)
      await FontOptimizer.optimizedFontPreload();

      // Essential services that block UI
      await deepLinkManager.initialize();
      console.log('[Startup] Critical services initialized');
    } catch (error) {
      console.error('[Startup] Critical initialization failed:', error);
      throw error;
    }
  };

  // Phase 2: Non-critical services - can be deferred for better startup performance
  const initializeNonCriticalServices = async () => {
    try {
      // Setup notifications (deferred)
      const setupNotifications = async () => {
        try {
          const Notifications = await import('expo-notifications');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          console.log('[Startup] Notifications configured');
        } catch (error) {
          console.warn('[Startup] Notifications not available:', error);
        }
      };

      // Initialize image service (deferred)
      const initializeImageService = async () => {
        try {
          ImageService.configureCaching();
          // Preload critical assets in background - don't block startup
          ImageService.preloadCriticalAssets().then(() => {
            console.log('[Startup] Critical assets preloaded');
          }).catch((error) => {
            console.warn('[Startup] Asset preloading failed:', error);
          });
        } catch (error) {
          console.warn('[Startup] Image service setup failed:', error);
        }
      };

      // Initialize subscription service (deferred)
      const initializeSubscriptionService = async () => {
        try {
          await subscriptionService.initialize();
          console.log('[Startup] Subscription service initialized');
        } catch (error) {
          console.warn('[Startup] Subscription service failed:', error);
        }
      };

      // Run deferred initializations concurrently
      await Promise.allSettled([
        setupNotifications(),
        initializeImageService(),
        initializeSubscriptionService(),
      ]);

      console.log('[Startup] Non-critical services initialization complete');

      // TODO: Re-enable invitation service with safe imports
      // await invitationService.initialize();

    } catch (error) {
      console.error('[Startup] Non-critical initialization failed:', error);
      // Don't throw - these are non-critical
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
