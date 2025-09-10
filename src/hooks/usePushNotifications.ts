import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useTwinStore } from '../state/twinStore';
import { useChatStore } from '../state/chatStore';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = () => {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const { notificationsEnabled } = useTwinStore();
  const { incrementUnreadCount } = useChatStore();

  useEffect(() => {
    if (!notificationsEnabled) return;

    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        // Handle twintuition alerts specially
        if (notification.request.content.data?.type === 'twintuition') {
          // Add haptic feedback or special handling
        } else if (notification.request.content.data?.screen === 'TwinTalk') {
          incrementUnreadCount();
        }
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        if (data?.screen === 'TwinTalk') {
          // Navigate to Twin Talk (would need navigation context)
        } else if (data?.screen === 'Twintuition') {
          // Navigate to Twintuition screen
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [notificationsEnabled]);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your actual project ID
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('twinship-default', {
        name: 'Twinship',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8a2be2',
      });

      await Notifications.setNotificationChannelAsync('twintuition', {
        name: 'Twintuition Alerts',
        description: 'Sacred twin connection moments',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#ff1493',
        sound: 'twintuition_sound.wav', // Custom sound file
      });
    }

    return token.data;
  };

  const scheduleLocalTwintuitionAlert = async (message: string) => {
    if (!notificationsEnabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Twintuition Moment! 🔮',
        body: message,
        data: { type: 'twintuition', screen: 'Twintuition' },
        sound: 'twintuition_sound.wav',
      },
      trigger: null, // Show immediately
    });
  };

  const scheduleMessageNotification = async (senderName: string, messageText: string, messageId: string) => {
    if (!notificationsEnabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${senderName} sent a message`,
        body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        data: { messageId, screen: 'TwinTalk' },
      },
      trigger: null,
    });
  };

  return {
    scheduleLocalTwintuitionAlert,
    scheduleMessageNotification,
  };
};