import EventEmitter from 'eventemitter3';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ChatMessage, TypingIndicator, TwintuitionMoment } from '../types/chat';
import { useChatStore } from '../state/chatStore';
import { useTwinStore } from '../state/twinStore';

// Mock WebSocket implementation for real-time communication
// In production, replace with Firebase Realtime Database or Socket.io
class MockWebSocket extends EventEmitter {
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    this.connected = true;
    this.emit('connected');
    console.log('Chat WebSocket connected');
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnected');
    console.log('Chat WebSocket disconnected');
  }

  send(data: any) {
    if (!this.connected) {
      this.emit('error', new Error('Not connected'));
      return;
    }

    // Simulate network delay
    setTimeout(() => {
      this.emit('message', data);
    }, Math.random() * 500 + 100);
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect();
      this.reconnectAttempts = 0;
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

class ChatService {
  private ws: MockWebSocket;
  private offlineQueue: ChatMessage[] = [];
  private typingTimeout: NodeJS.Timeout | null = null;
  private twintuitionTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ws = new MockWebSocket();
    this.setupEventListeners();
    this.loadOfflineMessages();
  }

  private setupEventListeners() {
    this.ws.on('connected', () => {
      useChatStore.getState().setConnection({ status: 'connected' });
      this.processOfflineQueue();
    });

    this.ws.on('disconnected', () => {
      useChatStore.getState().setConnection({ status: 'disconnected' });
    });

    this.ws.on('reconnecting', (attempt) => {
      useChatStore.getState().setConnection({ status: 'reconnecting' });
    });

    this.ws.on('message', (data) => {
      this.handleIncomingMessage(data);
    });

    this.ws.on('typing', (data: TypingIndicator) => {
      useChatStore.getState().setTypingIndicator(data);
      
      // Clear typing indicator after 3 seconds
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        useChatStore.getState().setTypingIndicator(null);
      }, 3000);
    });
  }

  connect() {
    useChatStore.getState().setConnection({ status: 'connecting' });
    setTimeout(() => this.ws.connect(), 1000);
  }

  disconnect() {
    this.ws.disconnect();
  }

  async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'isDelivered' | 'isRead'>) {
    const chatStore = useChatStore.getState();
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
      reactions: [],
    };

    // Add to store immediately (optimistic update)
    chatStore.addMessage({
      ...message,
    });

    try {
      if (this.ws.connected) {
        this.ws.send({
          type: 'message',
          data: newMessage,
        });
        
        // Simulate delivery confirmation
        setTimeout(() => {
          chatStore.markAsDelivered(newMessage.id);
        }, 1000);
      } else {
        // Queue for offline sending
        this.offlineQueue.push(newMessage);
        await this.saveOfflineMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      this.offlineQueue.push(newMessage);
      await this.saveOfflineMessages();
    }

    // Check for twintuition moments
    this.checkForTwintuition(newMessage);
    
    // Auto-respond if paired with test twin
    this.handleTestTwinAutoResponse(newMessage);
  }

  sendTypingIndicator(isTyping: boolean) {
    if (!this.ws.connected) return;

    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile) return;

    if (isTyping) {
      this.ws.send({
        type: 'typing',
        data: {
          userId: userProfile.id,
          userName: userProfile.name,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      this.ws.send({
        type: 'stop_typing',
        data: {
          userId: userProfile.id,
        },
      });
    }
  }

  async sendReaction(messageId: string, emoji: string) {
    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile) return;

    const chatStore = useChatStore.getState();
    chatStore.addReaction(messageId, emoji, userProfile.id, userProfile.name);

    if (this.ws.connected) {
      this.ws.send({
        type: 'reaction',
        data: {
          messageId,
          emoji,
          userId: userProfile.id,
          userName: userProfile.name,
        },
      });
    }
  }

  private handleIncomingMessage(data: any) {
    const chatStore = useChatStore.getState();

    switch (data.type) {
      case 'message':
        chatStore.addMessage(data.data);
        this.sendPushNotification(data.data);
        chatStore.incrementUnreadCount();
        break;
      
      case 'message_delivered':
        chatStore.markAsDelivered(data.messageId);
        break;
        
      case 'message_read':
        chatStore.markAsRead(data.messageId);
        break;
        
      case 'reaction':
        chatStore.addReaction(
          data.data.messageId,
          data.data.emoji,
          data.data.userId,
          data.data.userName
        );
        break;
        
      case 'typing':
        chatStore.setTypingIndicator(data.data);
        break;
        
      case 'stop_typing':
        chatStore.setTypingIndicator(null);
        break;
    }
  }

  private async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const message of queue) {
      try {
        this.ws.send({
          type: 'message',
          data: message,
        });
        
        // Mark as delivered
        setTimeout(() => {
          useChatStore.getState().markAsDelivered(message.id);
        }, 1000);
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.offlineQueue.push(message);
      }
    }

    await this.saveOfflineMessages();
  }

  private async saveOfflineMessages() {
    try {
      await AsyncStorage.setItem(
        'offline_messages',
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to save offline messages:', error);
    }
  }

  private async loadOfflineMessages() {
    try {
      const stored = await AsyncStorage.getItem('offline_messages');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline messages:', error);
    }
  }

  private checkForTwintuition(message: ChatMessage) {
    // Simple twintuition detection based on common keywords/phrases
    const twintuitionKeywords = [
      'thinking the same',
      'was just about to say',
      'exactly what I was thinking',
      'read my mind',
      'telepathy',
      'intuition',
      'feeling the same',
    ];

    const messageText = message.text.toLowerCase();
    const hasTwintuitionKeyword = twintuitionKeywords.some(keyword =>
      messageText.includes(keyword)
    );

    if (hasTwintuitionKeyword) {
      const chatStore = useChatStore.getState();
      chatStore.addTwintuitionMoment({
        message: 'Twin telepathy moment detected! 🔮',
        type: 'intuition',
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      });

      // Send twintuition notification
      this.sendTwintuitionNotification();
    }
  }

  private async sendPushNotification(message: ChatMessage) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${message.senderName} sent a message`,
          body: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
          data: { messageId: message.id, screen: 'TwinTalk' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private async sendTwintuitionNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Twintuition Alert! 🔮',
          body: 'You and your twin are having a psychic moment!',
          data: { type: 'twintuition', screen: 'Twintuition' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send twintuition notification:', error);
    }
  }

  // Voice message support
  async sendVoiceMessage(uri: string, duration: number) {
    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile) return;

    await this.sendMessage({
      text: `🎵 Voice message (${Math.floor(duration)}s)`,
      senderId: userProfile.id,
      senderName: userProfile.name,
      type: 'text', // In a real app, you'd have a 'voice' type
      accentColor: userProfile.accentColor,
    });
  }

  // Quick response
  async sendQuickResponse(responseText: string) {
    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile) return;

    await this.sendMessage({
      text: responseText,
      senderId: userProfile.id,
      senderName: userProfile.name,
      type: 'text',
      accentColor: userProfile.accentColor,
    });
  }

  // Handle auto-responses from test twin
  private handleTestTwinAutoResponse(userMessage: ChatMessage) {
    const { twinProfile } = useTwinStore.getState();
    
    // Only respond if paired with test twin and user sent the message
    if (!twinProfile || !twinProfile.id.startsWith('test-twin-')) return;
    if (userMessage.senderId === twinProfile.id) return; // Don't respond to twin's own messages
    
    // Generate random response after 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    setTimeout(() => {
      this.sendTestTwinResponse(userMessage);
    }, delay);
  }

  private sendTestTwinResponse(userMessage: ChatMessage) {
    const { twinProfile } = useTwinStore.getState();
    if (!twinProfile) return;

    const responses = [
      "I was just thinking about that! 🤯",
      "Wow, we're so in sync right now! ✨",
      "I literally felt that message before you sent it 😱",
      "This is exactly what I needed to hear today 💫",
      "I'm getting such strong twintuition vibes! ⚡",
      "Our connection is unreal sometimes 🌟",
      "I was about to text you the same thing! 😂",
      "The twin telepathy is strong today 🧠➡️🧠",
      "I love how we always understand each other 💜",
      "This is why we're twins! 👯‍♀️",
      "I'm feeling that twin energy! 🔮",
      "We're like two minds, one soul ❤️",
      "I can't believe how connected we are! 🌙",
      "That gave me chills! In the best way ⭐",
      "You always know exactly what to say 😊"
    ];

    // Pick a response based on message content and add some intelligence
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // More specific responses based on keywords
    const messageText = userMessage.text.toLowerCase();
    if (messageText.includes('hi') || messageText.includes('hello') || messageText.includes('hey')) {
      const greetings = [
        `Hey twin! I just felt you were about to message me! 😊`,
        `Hi! I was literally thinking about you right now! 💫`,
        `Hello beautiful soul! The twintuition is strong today ✨`
      ];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (messageText.includes('love') || messageText.includes('miss')) {
      const loveResponses = [
        `I love you too, twin! Our bond is unbreakable 💕`,
        `I miss you so much! Can't wait to see you again 🥰`,
        `Sending you all my twin love right back! ❤️✨`
      ];
      response = loveResponses[Math.floor(Math.random() * loveResponses.length)];
    } else if (messageText.includes('test') || messageText.includes('working')) {
      const testResponses = [
        `Yes! This test twin feature is working perfectly! 🎉`,
        `I'm your virtual twin and ready to chat! 🤖✨`,
        `Test twin mode activated! I'm here for you! 👯‍♀️`
      ];
      response = testResponses[Math.floor(Math.random() * testResponses.length)];
    }

    // Simulate typing indicator first
    useChatStore.getState().setTypingIndicator({
      userId: twinProfile.id,
      userName: twinProfile.name,
      timestamp: new Date().toISOString(),
    });

    // Send response after typing delay
    setTimeout(() => {
      useChatStore.getState().setTypingIndicator(null);
      
      const testTwinMessage: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        text: response,
        senderId: twinProfile.id,
        senderName: twinProfile.name,
        timestamp: new Date().toISOString(),
        type: 'text',
        isDelivered: true,
        isRead: false,
        reactions: [],
      };

      useChatStore.getState().addMessage(testTwinMessage);
    }, 1000 + Math.random() * 2000); // 1-3 seconds typing time
  }

  // Mark all messages as read
  markAllAsRead() {
    const chatStore = useChatStore.getState();
    const unreadMessages = chatStore.getUnreadMessages();
    
    unreadMessages.forEach(message => {
      chatStore.markAsRead(message.id);
      
      // Notify twin that messages were read
      if (this.ws.connected) {
        this.ws.send({
          type: 'message_read',
          messageId: message.id,
        });
      }
    });
    
    chatStore.resetUnreadCount();
  }
}

// Singleton instance
export const chatService = new ChatService();

// Auto-connect when app starts
chatService.connect();
