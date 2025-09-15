import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface WebSocketConfig {
  url: string;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  timeout: number;
  forcePolling?: boolean;
}

// Default WebSocket configuration
const DEFAULT_CONFIG: WebSocketConfig = {
  url: __DEV__ ? 'http://localhost:3000' : 'https://api.twinship.app',
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forcePolling: Platform.OS === 'android' && __DEV__, // Force polling on Android dev builds
};

/**
 * Get WebSocket configuration based on environment
 */
export function getWebSocketConfig(): WebSocketConfig {
  const config = { ...DEFAULT_CONFIG };
  
  // Override with environment variables if available
  if (Constants.expoConfig?.extra?.websocketUrl) {
    config.url = Constants.expoConfig.extra.websocketUrl;
  }
  
  // Development mode adjustments
  if (__DEV__) {
    config.reconnectionDelay = 500; // Faster reconnection in dev
    config.timeout = 10000; // Shorter timeout in dev
  }
  
  return config;
}

/**
 * Get Socket.io connection options
 */
export function getSocketOptions(userId?: string) {
  const config = getWebSocketConfig();
  
  return {
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: config.reconnectionAttempts,
    reconnectionDelay: config.reconnectionDelay,
    timeout: config.timeout,
    transports: config.forcePolling ? ['polling'] : ['websocket', 'polling'],
    auth: userId ? { userId } : undefined,
    autoConnect: false, // We'll connect manually after authentication
  };
}