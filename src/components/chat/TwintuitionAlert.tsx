import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TwintuitionMoment } from '../../types/chat';
import { getNeonAccentColor } from '../../utils/neonColors';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface TwintuitionAlertProps {
  moment: TwintuitionMoment;
  onDismiss: () => void;
  onViewDetails: () => void;
}

export const TwintuitionAlert: React.FC<TwintuitionAlertProps> = ({
  moment,
  onDismiss,
  onViewDetails,
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Pulse animation for mystical effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#00ff7f';
    if (confidence >= 0.7) return '#ffff00';
    return '#ff8c00';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Very Strong';
    if (confidence >= 0.7) return 'Strong';
    return 'Moderate';
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: slideAnim },
          { scale: pulseAnim },
        ],
      }}
      className="mx-4 my-2"
    >
      <Pressable
        onPress={onViewDetails}
        style={{
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderColor: neonColor,
          borderWidth: 2,
          shadowColor: neonColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        }}
        className="rounded-2xl p-4 relative overflow-hidden"
      >
        {/* Mystical Background Gradient */}
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `${neonColor}15`,
          }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="mr-3">
              <Ionicons name="flash" size={24} color={neonColor} />
            </View>
            <Text className="text-white text-lg font-bold">
              Twintuition Alert
            </Text>
          </View>
          
          <Pressable
            onPress={onDismiss}
            className="bg-white/10 rounded-full p-1"
          >
            <Ionicons name="close" size={16} color="white" />
          </Pressable>
        </View>

        {/* Message */}
        <Text className="text-white text-base mb-3 leading-6">
          {moment.message}
        </Text>

        {/* Details */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-4">
              <Ionicons name="pulse" size={16} color={getConfidenceColor(moment.confidence)} />
              <Text className="text-white/70 text-sm ml-1">
                {getConfidenceText(moment.confidence)}
              </Text>
            </View>
            <Text className="text-white/50 text-sm">
              {new Date(moment.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>

          <Text className="text-xs px-2 py-1 rounded-full" style={{ 
            color: neonColor, 
            backgroundColor: `${neonColor}20`,
            borderColor: neonColor,
            borderWidth: 1,
          }}>
            {moment.type.toUpperCase()}
          </Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={onViewDetails}
          style={{ backgroundColor: neonColor }}
          className="mt-3 py-2 rounded-lg items-center"
        >
          <Text className="text-white font-semibold">
            View Twintuition Details
          </Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};