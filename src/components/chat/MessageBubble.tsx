import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, TWIN_EMOJIS } from '../../types/chat';
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from '../../utils/neonColors';
import { useTwinStore } from '../../state/twinStore';
import { useChatStore } from '../../state/chatStore';
import { chatService } from '../../services/chatService';
import * as Haptics from 'expo-haptics';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTimestamp?: boolean;
  onLongPress?: (message: ChatMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTimestamp = false,
  onLongPress,
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const [showReactions, setShowReactions] = useState(false);
  const scaleValue = new Animated.Value(1);

  const bubbleColor = isOwn
    ? getNeonAccentColorWithOpacity(message.accentColor, 0.8)
    : getNeonAccentColorWithOpacity(message.accentColor, 0.8);

  const textColor = isOwn ? '#FFFFFF' : '#FFFFFF';
  const borderColor = getNeonAccentColor(message.accentColor);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(message);
    setShowReactions(true);
  };

  const handleReaction = async (emoji: string) => {
    if (!userProfile) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await chatService.sendReaction(message.id, emoji);
    setShowReactions(false);
  };

  const getReactionCount = (emoji: string) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.userId === userProfile?.id);
  };

  const uniqueReactions = [...new Set(message.reactions?.map(r => r.emoji) || [])];

  return (
    <View className={`mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          maxWidth: '80%',
        }}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          className="relative"
        >
          {/* Message Bubble */}
          <View
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderWidth: 1,
              borderColor: borderColor,
            }}
            className={`px-4 py-3 rounded-2xl ${
              isOwn ? 'rounded-br-md' : 'rounded-bl-md'
            }`}
          >
            {/* Message Text */}
            <Text
              style={{ color: textColor }}
              className="text-base leading-5"
            >
              {message.text}
            </Text>

            {/* Message Status (for own messages) */}
            {isOwn && (
              <View className="flex-row items-center justify-end mt-1">
                <Text className="text-white/60 text-xs mr-1">
                  {formatTime(message.timestamp)}
                </Text>
                <View className="flex-row">
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={message.isDelivered ? borderColor : 'rgba(255,255,255,0.4)'}
                  />
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={message.isRead ? borderColor : 'rgba(255,255,255,0.4)'}
                    style={{ marginLeft: -4 }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Reactions */}
          {uniqueReactions.length > 0 && (
            <View className={`flex-row flex-wrap mt-1 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}>
              {uniqueReactions.map((emoji, index) => {
                const count = getReactionCount(emoji);
                const userReacted = hasUserReacted(emoji);
                return (
                  <Pressable
                    key={`${emoji}-${index}`}
                    onPress={() => handleReaction(emoji)}
                    style={{
                      backgroundColor: userReacted
                        ? getNeonAccentColorWithOpacity(message.accentColor, 0.8)
                        : 'rgba(0,0,0,0.7)',
                      borderColor: userReacted ? borderColor : 'rgba(255,255,255,0.3)',
                      borderWidth: 1,
                    }}
                    className="flex-row items-center px-2 py-1 rounded-full mr-1 mb-1"
                  >
                    <Text className="text-sm">{emoji}</Text>
                    {count > 1 && (
                      <Text className="text-white text-xs ml-1">{count}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Pressable>

        {/* Quick Reaction Panel */}
        {showReactions && (
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              borderColor: borderColor,
              borderWidth: 1,
            }}
            className={`absolute top-0 ${isOwn ? 'right-0' : 'left-0'} flex-row items-center px-3 py-2 rounded-full`}
          >
            {TWIN_EMOJIS.slice(0, 6).map((emoji, index) => (
              <Pressable
                key={index}
                onPress={() => handleReaction(emoji)}
                className="mx-1"
              >
                <Text className="text-xl">{emoji}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowReactions(false)}
              className="ml-2"
            >
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
          </View>
        )}
      </Animated.View>

      {/* Timestamp (for twin's messages) */}
      {!isOwn && (showTimestamp || message.reactions?.length > 0) && (
        <Text className="text-white/50 text-xs mt-1 ml-1">
          {formatTime(message.timestamp)}
        </Text>
      )}
    </View>
  );
};
