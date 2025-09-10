import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppNavigator } from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { deepLinkManager } from "./src/utils/deepLinking";
import { invitationService } from "./src/services/invitationService";
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
    // Setup notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Initialize deep linking, invitation service, and subscription service
    const initializeServices = async () => {
      try {
        await Promise.all([
          deepLinkManager.initialize(),
          invitationService.initialize(),
          subscriptionService.initialize(), // Initialize RevenueCat on app start
        ]);
        console.log('App services initialized successfully');
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
