import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatConnection } from '../../types/chat';
import { getNeonAccentColor } from '../../utils/neonColors';
import { useTwinStore } from '../../state/twinStore';

interface ConnectionStatusBarProps {
  connection: ChatConnection;
}

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  connection,
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  useEffect(() => {
    if (connection.status === 'connecting' || connection.status === 'reconnecting') {
      // Pulse animation for connecting states
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Slide animation
    if (connection.status !== 'connected') {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [connection.status]);

  const getStatusConfig = () => {
    switch (connection.status) {
      case 'connected':
        return {
          color: '#00ff7f',
          icon: 'checkmark-circle' as const,
          text: 'Connected to your twin',
          bgColor: 'rgba(0, 255, 127, 0.1)',
        };
      case 'connecting':
        return {
          color: '#ffff00',
          icon: 'sync' as const,
          text: 'Connecting to twin...',
          bgColor: 'rgba(255, 255, 0, 0.1)',
        };
      case 'reconnecting':
        return {
          color: '#ff8c00',
          icon: 'refresh' as const,
          text: 'Reconnecting...',
          bgColor: 'rgba(255, 140, 0, 0.1)',
        };
      case 'disconnected':
      default:
        return {
          color: '#ff4444',
          icon: 'close-circle' as const,
          text: 'Disconnected from twin',
          bgColor: 'rgba(255, 68, 68, 0.1)',
        };
    }
  };

  const config = getStatusConfig();

  if (connection.status === 'connected') return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
        backgroundColor: config.bgColor,
        borderBottomColor: config.color,
        borderBottomWidth: 1,
      }}
      className="px-4 py-2"
    >
      <View className="flex-row items-center justify-center">
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </Animated.View>
        <Text 
          style={{ color: config.color }}
          className="text-sm font-medium ml-2"
        >
          {config.text}
        </Text>
        
        {connection.status === 'reconnecting' && (
          <View className="ml-auto">
            <Text className="text-white/50 text-xs">
              Attempt {Math.floor(Math.random() * 3) + 1}/5
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};