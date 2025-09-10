import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  AppState,
  AppStateStatus,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageInput } from '../../components/chat/MessageInput';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useTwinStore } from '../../state/twinStore';
import { useChatStore } from '../../state/chatStore';
import { chatService } from '../../services/chatService';
import { getNeonAccentColor } from '../../utils/neonColors';
import { ChatMessage } from '../../types/chat';
import * as Haptics from 'expo-haptics';

export const TwinTalkScreen = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const { userProfile, twinProfile } = useTwinStore();
  const {
    messages,
    typingIndicator,
    connection,
    twintuitionMoments,
    resetUnreadCount,
    selectedMessageId,
    setSelectedMessage,
  } = useChatStore();

  const accentColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        chatService.markAllAsRead();
        resetUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Mark as read immediately when component mounts
    chatService.markAllAsRead();
    resetUnreadCount();

    return () => subscription?.remove();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate refresh - reconnect to chat service
    chatService.disconnect();
    setTimeout(() => {
      chatService.connect();
      setRefreshing(false);
    }, 1000);
  };

  const handleMessageLongPress = (message: ChatMessage) => {
    setSelectedMessage(selectedMessageId === message.id ? null : message.id);
    
    const isOwn = message.senderId === userProfile?.id;
    const actions = isOwn 
      ? ['Delete Message', 'Copy Text', 'Cancel']
      : ['Copy Text', 'Reply', 'Cancel'];
      
    Alert.alert(
      'Message Options',
      message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
      actions.map(action => ({
        text: action,
        style: action === 'Cancel' ? 'cancel' : action === 'Delete Message' ? 'destructive' : 'default',
        onPress: () => {
          switch (action) {
            case 'Delete Message':
              // Handle delete
              break;
            case 'Copy Text':
              // Handle copy
              break;
            case 'Reply':
              // Handle reply
              break;
          }
          setSelectedMessage(null);
        },
      }))
    );
  };

  const handleVideoCall = () => {
    Alert.alert(
      'Video Call',
      'Would you like to start a video call with your twin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // In a real app, integrate with video calling service
            Alert.alert('Feature Coming Soon', 'Video calling will be available in a future update!');
          }
        },
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connection.status) {
      case 'connected': return '#00ff7f';
      case 'connecting': return '#ffff00';
      case 'reconnecting': return '#ff8c00';
      default: return '#ff4444';
    }
  };

  const getConnectionStatusText = () => {
    switch (connection.status) {
      case 'connected': return 'Online';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      default: return 'Offline';
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    setShowScrollToBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  if (!userProfile || !twinProfile) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Twin Talk</Text>
            <View className="w-10" />
          </View>
          
          <View className="flex-1 justify-center items-center px-6">
            <View className="bg-white/10 rounded-2xl p-8 items-center max-w-sm">
              <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.5)" />
              <Text className="text-white text-xl font-semibold mb-4 text-center">Setting up Twin Talk...</Text>
              <Text className="text-white/70 text-center mb-6 leading-6">
                You need to pair with your twin before you can start chatting. Complete your profile and twin pairing first.
              </Text>
              
              <Pressable 
                onPress={() => navigation.navigate('Pair')}
                className="bg-purple-500 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Pair with Twin</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-white/10">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="chevron-back" size={24} color="white" />
            </Pressable>
            <View className="flex-row items-center flex-1">
              {/* Twin Avatar */}
              <View 
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderColor: neonColor,
                  borderWidth: 2,
                }}
                className="rounded-full w-12 h-12 items-center justify-center mr-3"
              >
                <Text className="text-white text-lg font-bold">
                  {twinProfile.name.charAt(0)}
                </Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">
                  {twinProfile.name}
                </Text>
                <View className="flex-row items-center">
                  <View 
                    style={{ backgroundColor: getConnectionStatusColor() }}
                    className="w-2 h-2 rounded-full mr-2" 
                  />
                  <Text className="text-white/70 text-sm">
                    {getConnectionStatusText()}
                  </Text>
                  {connection.lastSeen && connection.status === 'disconnected' && (
                    <Text className="text-white/50 text-xs ml-2">
                      Last seen {new Date(connection.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row items-center space-x-3">
              {/* Video Call Button */}
              <Pressable
                onPress={handleVideoCall}
                className="bg-white/10 rounded-full p-2"
              >
                <Ionicons name="videocam" size={20} color="white" />
              </Pressable>
              
              {/* Settings Button */}
              <Pressable
                onPress={() => navigation.navigate('Twinsettings')}
                className="bg-white/10 rounded-full p-2"
              >
                <Ionicons name="settings" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Messages */}
        <View className="flex-1 relative">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={neonColor}
                colors={[neonColor]}
              />
            }
          >
            {messages.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/50 text-lg mt-4 text-center">
                  Start your sacred twin conversation
                </Text>
                <Text className="text-white/30 text-sm mt-2 text-center px-8">
                  Your messages are private and secure between you and your twin
                </Text>
              </View>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === userProfile.id;
                const showTimestamp = index === 0 || 
                  new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp || 0).getTime() > 300000; // 5 minutes
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showTimestamp={showTimestamp}
                    onLongPress={handleMessageLongPress}
                  />
                );
              })
            )}
            
            {/* Typing Indicator */}
            {typingIndicator && (
              <TypingIndicator typingIndicator={typingIndicator} />
            )}
          </ScrollView>

          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <Pressable
              onPress={scrollToBottom}
              style={{
                backgroundColor: neonColor,
                position: 'absolute',
                bottom: 20,
                right: 20,
                shadowColor: neonColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
              }}
              className="w-12 h-12 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-down" size={24} color="white" />
            </Pressable>
          )}
        </View>

        {/* Message Input */}
        <MessageInput />
      </SafeAreaView>
    </ImageBackground>
  );
};