import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTwinStore } from '../../state/twinStore';
import { useChatStore } from '../../state/chatStore';
import { chatService } from '../../services/chatService';
import { QUICK_RESPONSES } from '../../types/chat';
import { getNeonAccentColor } from '../../utils/neonColors';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

interface MessageInputProps {
  onSendMessage?: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const navigation = useNavigation<any>();
  const userProfile = useTwinStore((state) => state.userProfile);
  const twinProfile = useTwinStore((state) => state.twinProfile);
  const twintuitionMoments = useChatStore((state) => state.twintuitionMoments);
  const { showQuickResponses, setShowQuickResponses, isVoiceRecording, setVoiceRecording } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [twinLocation, setTwinLocation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scaleValue = new Animated.Value(1);

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  useEffect(() => {
    // Handle typing indicator
    if (inputText.length > 0 && !isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        chatService.sendTypingIndicator(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userProfile || isSending) return;

    setIsSending(true);
    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(false);
    chatService.sendTypingIndicator(false);

    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Send message
      await chatService.sendMessage({
        text: messageText,
        senderId: userProfile.id,
        senderName: userProfile.name,
        type: 'text',
        accentColor: userProfile.accentColor,
      });

      onSendMessage?.(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickResponse = async (response: string) => {
    if (!userProfile) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await chatService.sendQuickResponse(response);
    setShowQuickResponses(false);
  };

  const handleVoiceRecord = async () => {
    if (!userProfile) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isVoiceRecording) {
      // Stop recording
      setVoiceRecording(false);
      // In a real app, you'd process the recording here
      await chatService.sendVoiceMessage('mock-uri', 5); // Mock 5-second message
    } else {
      // Start recording
      setVoiceRecording(true);
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (isVoiceRecording) {
          setVoiceRecording(false);
        }
      }, 60000);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
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

  const commonEmojis = ['❤️', '😊', '😂', '🥺', '😍', '🤔', '👯', '✨', '🔮', '💫'];

  const handleLocationShare = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to share your location with your twin.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      
      // Send location message
      await chatService.sendLocationMessage({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: 'Current Location', // In a real app, reverse geocode this
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sharing location:', error);
      alert('Failed to share location. Please try again.');
    }
  };

  const handleViewTwinLocation = async () => {
    // Mock twin location for demo - in real app, get from server
    const mockTwinLocation = {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      name: twinProfile?.name || 'Your Twin',
      lastUpdated: new Date().toISOString(),
    };
    
    setTwinLocation(mockTwinLocation);
    setShowLocationModal(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-black/20 border-t border-white/10"
    >
      {/* Quick Responses */}
      {showQuickResponses && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 bg-black/30"
        >
          {QUICK_RESPONSES.map((response) => (
            <Pressable
              key={response.id}
              onPress={() => handleQuickResponse(response.text)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: neonColor,
                borderWidth: 1,
              }}
              className="flex-row items-center px-3 py-2 rounded-full mr-2"
            >
              <Text className="text-lg mr-1">{response.emoji}</Text>
              <Text className="text-white text-sm">{response.text}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 bg-black/30"
        >
          {commonEmojis.map((emoji, index) => (
            <Pressable
              key={index}
              onPress={() => {
                setInputText(prev => prev + emoji);
                setShowEmojiPicker(false);
                textInputRef.current?.focus();
              }}
              className="bg-white/10 w-12 h-12 rounded-full items-center justify-center mr-2"
            >
              <Text className="text-xl">{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Main Input Area */}
      <View className="flex-row items-end px-4 py-3 space-x-3">
        {/* Twintuition Button */}
        <Pressable
          onPress={() => navigation.navigate('Twintuition')}
          className="bg-white/10 rounded-full p-3 relative"
        >
          <Ionicons name="flash" size={20} color={neonColor} />
          {twintuitionMoments.length > 0 && (
            <View 
              style={{ backgroundColor: neonColor }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
            >
              <Text className="text-black text-xs font-bold">
                {twintuitionMoments.length > 9 ? '9+' : twintuitionMoments.length}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Location Button */}
        <Pressable
          onPress={handleViewTwinLocation}
          onLongPress={handleLocationShare}
          className="bg-white/10 rounded-full p-3"
        >
          <Ionicons name="location" size={20} color="white" />
        </Pressable>

        {/* Quick Actions Button */}
        <Pressable
          onPress={() => {
            animateButton();
            setShowQuickResponses(!showQuickResponses);
            setShowEmojiPicker(false);
          }}
          className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons 
            name={showQuickResponses ? "close" : "flash"} 
            size={20} 
            color={showQuickResponses ? neonColor : "white"} 
          />
        </Pressable>

        {/* Text Input Container */}
        <View className="flex-1 bg-white/10 rounded-2xl px-4 py-2 min-h-[44px] max-h-[120px]">
          <TextInput
            ref={textInputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            className="text-white text-base flex-1"
            multiline
            maxLength={1000}
            style={{
              textAlignVertical: 'center',
            }}
          />
        </View>

        {/* Emoji Button */}
        <Pressable
          onPress={() => {
            animateButton();
            setShowEmojiPicker(!showEmojiPicker);
            setShowQuickResponses(false);
          }}
          className="bg-white/10 w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons 
            name={showEmojiPicker ? "close" : "happy-outline"} 
            size={20} 
            color={showEmojiPicker ? neonColor : "white"} 
          />
        </Pressable>

        {/* Voice/Send Button */}
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Pressable
            onPress={inputText.trim() ? handleSendMessage : handleVoiceRecord}
            onPressIn={animateButton}
            disabled={isSending}
            style={{
              backgroundColor: inputText.trim() || isVoiceRecording ? neonColor : 'rgba(255,255,255,0.2)',
              opacity: isSending ? 0.7 : 1,
            }}
            className="w-12 h-12 rounded-full items-center justify-center"
          >
            <Ionicons
              name={
                isSending
                  ? "hourglass"
                  : inputText.trim() 
                    ? "send" 
                    : isVoiceRecording 
                      ? "stop" 
                      : "mic"
              }
              size={20}
              color="white"
            />
          </Pressable>
        </Animated.View>
      </View>

      {/* Voice Recording Indicator */}
      {isVoiceRecording && (
        <View className="flex-row items-center justify-center py-2 bg-red-500/20">
          <View className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
          <Text className="text-white text-sm">Recording voice message...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};
