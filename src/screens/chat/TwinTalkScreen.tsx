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
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);

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
  
  // Get solid accent color for keyboard background
  const getSolidAccentColor = (color: string) => {
    switch (color) {
      case 'neon-pink': return '#ff1493';
      case 'neon-blue': return '#00bfff';
      case 'neon-green': return '#00ff7f';
      case 'neon-yellow': return '#ffff00';
      case 'neon-purple': return '#8a2be2';
      case 'neon-orange': return '#ff4500';
      case 'neon-cyan': return '#00ffff';
      case 'neon-red': return '#ff0000';
      default: return '#8a2be2';
    }
  };
  
  const solidAccentColor = getSolidAccentColor(accentColor);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => {
        setIsKeyboardVisible(true);
        // Immediate scroll to bottom when keyboard appears
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

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

  const handleTwintuitionAlert = async () => {
    if (!userProfile || !twinProfile) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const alertTimestamp = new Date().toISOString();
    const twinName = twinProfile.name;
    
    // Send instant notification to twin (mock implementation)
    // In production, this would send a push notification
    console.log(`Sending Twintuition Alert to ${twinName}:`, {
      title: 'Twintuition Alert! 🔮',
      body: `${userProfile.name} is thinking of you!`,
      timestamp: alertTimestamp
    });
    
    // Show confirmation to user
    Alert.alert(
      'Twintuition Alert Sent! 🔮',
      `${twinName} will receive your alert instantly.`,
      [{ text: 'OK' }]
    );
    
    // TODO: Check for sync moments (if twin also pressed within same timeframe)
    // This would require backend coordination to detect simultaneous presses
    // For now, just send the alert
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? -34 : 0}
    >
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
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View className="flex-1 relative">
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-6"
              contentContainerStyle={{ 
                paddingTop: 16, 
                paddingBottom: isKeyboardVisible ? 8 : 16 
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
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
            
            {/* Twin's Typing Indicator - only show if twin is typing */}
            {typingIndicator && typingIndicator.userId !== userProfile?.id && (
              <TypingIndicator typingIndicator={typingIndicator} />
            )}
            
            {/* Your own typing indicator - show on your side when you're typing */}
            {isUserTyping && userProfile && (
              <View className="items-end mb-4">
                <View className="flex-row items-center">
                  <Text className="text-white/50 text-xs mr-2">You are typing</Text>
                  <View className="flex-row space-x-1">
                    <View className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                    <View className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <View className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </View>
                </View>
              </View>
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
        </TouchableWithoutFeedback>

            {/* Message Input with Camera Button */}
            <View 
              style={{
                backgroundColor: isKeyboardVisible ? solidAccentColor : 'rgba(0,0,0,0.2)',
                paddingBottom: 0, // Remove all bottom padding
                marginBottom: 0, // Ensure no margin
              }}
            >
              <View 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  marginBottom: 0,
                }}
              >
                {/* Camera/Gallery Button */}
                <Pressable
                  onPress={() => {
                    // Handle image/camera action
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: isKeyboardVisible ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="camera-outline" size={20} color={isKeyboardVisible ? 'white' : neonColor} />
                </Pressable>
                
                {/* Text Input Container */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => textInputRef.current?.focus()}
                  style={{
                    backgroundColor: isKeyboardVisible ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                    flex: 1,
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    height: 44,
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <TextInput
                    ref={textInputRef}
                    value={inputText}
                    onChangeText={(text) => {
                      setInputText(text);
                      setIsUserTyping(text.length > 0);
                    }}
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      // Immediate scroll to bottom when input is focused
                      scrollViewRef.current?.scrollToEnd({ animated: false });
                    }}
                    onBlur={() => setIsKeyboardVisible(false)}
                    placeholder="Type your message..."
                    placeholderTextColor={isKeyboardVisible ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
                    style={{
                      color: isKeyboardVisible ? '#000000' : '#ffffff',
                      fontSize: 16,
                      height: 20,
                      margin: 0,
                      padding: 0,
                    }}
                    multiline={false}
                    maxLength={1000}
                    selectionColor={isKeyboardVisible ? solidAccentColor : neonColor}
                    autoFocus={false}
                    blurOnSubmit={true}
                    returnKeyType="send"
                    onSubmitEditing={() => {
                      if (inputText.trim() && userProfile) {
                        const messageText = inputText.trim();
                        setInputText('');
                        setIsUserTyping(false);
                        
                        chatService.sendMessage({
                          text: messageText,
                          senderId: userProfile.id,
                          senderName: userProfile.name,
                          type: 'text',
                          accentColor: userProfile.accentColor,
                        });
                      }
                    }}
                  />
                </TouchableOpacity>

                {/* Send Button */}
                <Pressable
                  onPress={() => {
                    if (!inputText.trim() || !userProfile) return;
                    
                    const messageText = inputText.trim();
                    setInputText('');
                    setIsUserTyping(false);
                    
                    chatService.sendMessage({
                      text: messageText,
                      senderId: userProfile.id,
                      senderName: userProfile.name,
                      type: 'text',
                      accentColor: userProfile.accentColor,
                    });
                  }}
                  disabled={!inputText.trim()}
                  style={{
                    backgroundColor: inputText.trim() ? (isKeyboardVisible ? 'rgba(255,255,255,0.9)' : neonColor) : 'rgba(0,0,0,0.7)',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() && isKeyboardVisible ? solidAccentColor : 'white'}
                  />
                </Pressable>
              </View>
            </View>
            
        </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};