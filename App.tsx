import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useEffect } from "react";
import { deepLinkManager } from "./src/utils/deepLinking";
// Re-enable subscription service with safe imports
// import { invitationService } from "./src/services/invitationService";
import { subscriptionService } from "./src/services/subscriptionService";

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
  useEffect(() => {
    // Setup notifications (safely handle expo-notifications)
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
      } catch (error) {
        console.warn('Notifications not available in this environment:', error);
      }
    };
    
    setupNotifications();

    // Initialize deep linking and other services
    const initializeServices = async () => {
      try {
        await deepLinkManager.initialize();
        console.log('Core app services initialized successfully');
        
        // Re-enable subscription service with safe imports
        try {
          await subscriptionService.initialize();
          console.log('Subscription service initialized');
        } catch (error) {
          console.warn('Subscription service failed to initialize:', error);
        }
        
        // TODO: Re-enable invitation service with safe imports
        // await invitationService.initialize();
      } catch (error) {
        console.error('Failed to initialize app services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      deepLinkManager.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
