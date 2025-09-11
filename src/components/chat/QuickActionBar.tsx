import React from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QUICK_RESPONSES } from '../../types/chat';
import { getNeonAccentColor } from '../../utils/neonColors';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface QuickActionBarProps {
  onQuickResponse: (text: string) => void;
  onToggleEmoji: () => void;
  onToggleVoice: () => void;
  showEmoji?: boolean;
  isRecording?: boolean;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onQuickResponse,
  onToggleEmoji,
  onToggleVoice,
  showEmoji = false,
  isRecording = false,
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const accentColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  const handleQuickResponse = async (text: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onQuickResponse(text);
  };

  const handleVoiceToggle = async () => {
    await Haptics.impactAsync(
      isRecording 
        ? Haptics.ImpactFeedbackStyle.Heavy 
        : Haptics.ImpactFeedbackStyle.Medium
    );
    onToggleVoice();
  };

  return (
    <View className="bg-black/30 border-t border-white/10 px-4 py-3">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-3"
      >
        {QUICK_RESPONSES.map((response) => (
          <Pressable
            key={response.id}
            onPress={() => handleQuickResponse(response.text)}
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderColor: neonColor,
              borderWidth: 1,
            }}
            className="flex-row items-center px-3 py-2 rounded-full mr-3"
          >
            <Text className="text-lg mr-2">{response.emoji}</Text>
            <Text className="text-white text-sm">{response.text}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-between">
        {/* Quick Actions */}
        <View className="flex-row items-center space-x-3">
          {/* Emoji Toggle */}
          <Pressable
            onPress={onToggleEmoji}
            style={{
              backgroundColor: showEmoji ? neonColor : 'rgba(0,0,0,0.7)',
            }}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons 
              name={showEmoji ? "happy" : "happy-outline"} 
              size={20} 
              color={showEmoji ? "white" : neonColor} 
            />
          </Pressable>

          {/* Voice Recording */}
          <Pressable
            onPress={handleVoiceToggle}
            style={{
              backgroundColor: isRecording ? '#ff4444' : 'rgba(0,0,0,0.7)',
            }}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic-outline"} 
              size={20} 
              color="white"
            />
          </Pressable>

          {/* Camera/Gallery */}
          <Pressable
            onPress={() => {
              // Handle image/camera action
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="camera-outline" size={20} color={neonColor} />
          </Pressable>

          {/* Games */}
          <Pressable
            onPress={() => {
              // Navigate to twin games
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="game-controller-outline" size={20} color={neonColor} />
          </Pressable>
        </View>

        {/* Twintuition Trigger */}
        <Pressable
          onPress={() => {
            // Manually trigger twintuition moment
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          style={{
            backgroundColor: `${neonColor}20`,
            borderColor: neonColor,
            borderWidth: 1,
          }}
          className="flex-row items-center px-3 py-2 rounded-full"
        >
          <Ionicons name="flash" size={16} color={neonColor} />
          <Text style={{ color: neonColor }} className="text-sm ml-1 font-medium">
            Twintuition
          </Text>
        </Pressable>
      </View>
    </View>
  );
};