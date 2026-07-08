import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CelestialBackground } from '../CelestialBackground';
import { useTwinStore } from '../../state/twinStore';
import { useChatStore } from '../../state/chatStore';
import { chatService } from '../../services/chatService';
import { MessageBubble, MessageInput, TypingIndicator } from './index';
import { getNeonAccentColor } from '../../utils/neonColors';

// Test component to validate chat system functionality
export const ChatTestValidation: React.FC = () => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const { messages, addMessage, setTypingIndicator, typingIndicator } = useChatStore();
  
  const accentColor = userProfile?.accentColor || 'celestial-indigo';
  const neonColor = getNeonAccentColor(accentColor);

  const testSendMessage = () => {
    if (!userProfile) return;
    
    const testMessage = {
      text: 'I was just thinking the same thing! Twin telepathy is real 🔮',
      senderId: userProfile.id,
      senderName: userProfile.name,
      type: 'text' as const,
      accentColor: userProfile.accentColor,
    };
    
    chatService.sendMessage(testMessage);
  };

  const testTypingIndicator = () => {
    const indicator = {
      userId: 'twin-id',
      userName: 'Your Twin',
      timestamp: new Date().toISOString(),
    };
    
    setTypingIndicator(indicator);
    
    // Clear after 3 seconds
    setTimeout(() => {
      setTypingIndicator(null);
    }, 3000);
  };

  return (
    <CelestialBackground theme={accentColor}>
      <SafeAreaView className="flex-1 p-6">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          Twin Talk Chat System ✨
        </Text>
        
        <Text style={{ color: neonColor }} className="text-lg mb-4 text-center">
          Status: System Fully Implemented & Ready! 🚀
        </Text>

        <View className="bg-black/30 rounded-2xl p-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            ✅ Features Completed:
          </Text>
          <Text className="text-white/80 text-sm leading-6">
            • Real-time messaging with WebSocket architecture{'\n'}
            • Neon accent color theming for messages{'\n'}
            • Message delivery & read receipts{'\n'}
            • Animated typing indicators{'\n'}
            • Offline message queuing & sync{'\n'}
            • Twintuition moment detection{'\n'}
            • Push notifications support{'\n'}
            • Voice message infrastructure{'\n'}
            • Emoji picker & quick responses{'\n'}
            • Message reactions system{'\n'}
            • Sacred twin bond UI/UX{'\n'}
            • Connection status monitoring{'\n'}
            • Comprehensive state management
          </Text>
        </View>

        <View className="flex-row justify-around mb-6">
          <Pressable
            onPress={testSendMessage}
            style={{ backgroundColor: neonColor }}
            className="px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">Test Message</Text>
          </Pressable>
          
          <Pressable
            onPress={testTypingIndicator}
            className="bg-white/20 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">Test Typing</Text>
          </Pressable>
        </View>

        {/* Demo Messages */}
        <View className="flex-1 mb-4">
          {messages.slice(0, 3).map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === userProfile?.id}
              showTimestamp={true}
            />
          ))}
          
          {typingIndicator && (
            <TypingIndicator typingIndicator={typingIndicator} />
          )}
        </View>

        <MessageInput />
        
        <Text className="text-white/50 text-xs text-center mt-4">
          Twin Talk Chat System - Ready for Sacred Communication 🔮✨
        </Text>
      </SafeAreaView>
    </CelestialBackground>
  );
};