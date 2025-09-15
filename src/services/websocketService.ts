import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getWebSocketConfig, getSocketOptions } from '../config/websocket';
import { ChatMessage, TypingIndicator, TwintuitionMoment } from '../types/chat';
import { useChatStore } from '../state/chatStore';
import { useTwinStore } from '../state/twinStore';
import { conditionallyEncryptMessage, conditionallyDecryptMessage } from '../utils/messageEncryption';

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'message_delivered' | 'message_read' | 'reaction' | 'presence';
  data: any;
}

export interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  lastConnected?: string;
  error?: string;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  deviceId?: string;
  connectionCount?: number;
}

export interface RoomInfo {
  twinPairId: string;
  members: PresenceData[];
  createdAt: string;
  lastActivity: string;
}

class ProductionWebSocketService {
  private socket: Socket | null = null;
  private offlineQueue: ChatMessage[] = [];
  private typingTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isInitialized = false;
  private userId: string | null = null;
  private twinPairId: string | null = null;

  // Room management and presence tracking
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private presenceData: PresenceData | null = null;
  private roomInfo: RoomInfo | null = null;
  private deviceId: string;
  private connectionTimestamp: string | null = null;
  private gracePeriodTimeout: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly GRACE_PERIOD = 30000; // 30 seconds
  private multiDeviceConnections = new Map<string, { lastSeen: string; deviceId: string }>();

  constructor() {
    this.loadOfflineMessages();
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Generate unique device ID for multi-device connection tracking
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize WebSocket connection with user authentication
   */
  async initialize(userId: string, twinPairId?: string) {
    if (this.isInitialized && this.userId === userId) {
      return; // Already initialized for this user
    }

    this.userId = userId;
    this.twinPairId = twinPairId || null;

    await this.disconnect(); // Clean up any existing connection

    const config = getWebSocketConfig();
    const options = getSocketOptions(userId);

    try {
      this.socket = io(config.url, options);
      this.setupEventListeners();
      this.isInitialized = true;

      console.log('WebSocket service initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.handleConnectionError('Failed to initialize WebSocket');
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect() {
    if (!this.socket || !this.userId) {
      console.warn('WebSocket not initialized. Call initialize() first.');
      return;
    }

    useChatStore.getState().setConnection({ status: 'connecting' });

    try {
      this.socket.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleConnectionError('Connection failed');
    }
  }

  /**
   * Disconnect from WebSocket server with cleanup
   */
  async disconnect() {
    // Clean up heartbeat and grace period timers
    this.stopHeartbeat();
    this.clearGracePeriod();

    // Leave room with presence update
    if (this.socket && this.twinPairId && this.userId) {
      this.socket.emit('leave_twin_room', {
        twinPairId: this.twinPairId,
        userId: this.userId,
        deviceId: this.deviceId
      });
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    // Reset state
    this.isInitialized = false;
    this.userId = null;
    this.twinPairId = null;
    this.presenceData = null;
    this.roomInfo = null;
    this.connectionTimestamp = null;
    this.multiDeviceConnections.clear();

    useChatStore.getState().setConnection({ status: 'disconnected' });
  }

  /**
   * Setup Socket.io event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      useChatStore.getState().setConnection({
        status: 'connected',
        lastConnected: new Date().toISOString()
      });

      // Join twin pair room if available
      if (this.twinPairId) {
        this.joinTwinRoom(this.twinPairId);
      }

      // Process offline message queue
      this.processOfflineQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      useChatStore.getState().setConnection({ status: 'disconnected' });

      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error.message);
      this.handleReconnection();
    });

    // Message events
    this.socket.on('message', (data: WebSocketMessage) => {
      this.handleIncomingMessage(data);
    });

    this.socket.on('typing', (data: TypingIndicator) => {
      this.handleTypingIndicator(data);
    });

    this.socket.on('stop_typing', (data: { userId: string }) => {
      useChatStore.getState().setTypingIndicator(null);
    });

    this.socket.on('message_delivered', (data: { messageId: string }) => {
      useChatStore.getState().markAsDelivered(data.messageId);
    });

    this.socket.on('message_read', (data: { messageId: string }) => {
      useChatStore.getState().markAsRead(data.messageId);
    });

    this.socket.on('reaction', (data: any) => {
      useChatStore.getState().addReaction(
        data.messageId,
        data.emoji,
        data.userId,
        data.userName
      );
    });

    this.socket.on('presence', (data: { userId: string; status: 'online' | 'offline' | 'away'; lastSeen?: string; deviceId?: string; connectionCount?: number }) => {
      this.handlePresenceUpdate(data);
    });

    // Enhanced room management events
    this.socket.on('room_joined', (data: { roomInfo: RoomInfo }) => {
      this.handleRoomJoined(data.roomInfo);
    });

    this.socket.on('room_member_joined', (data: { member: PresenceData }) => {
      this.handleRoomMemberJoined(data.member);
    });

    this.socket.on('room_member_left', (data: { userId: string; gracePeriod?: boolean }) => {
      this.handleRoomMemberLeft(data.userId, data.gracePeriod);
    });

    this.socket.on('heartbeat_response', () => {
      // Server acknowledged heartbeat - connection is healthy
      console.log('Heartbeat acknowledged');
    });

    this.socket.on('twintuition_detected', (data: TwintuitionMoment) => {
      useChatStore.getState().addTwintuitionMoment(data);
      this.sendTwintuitionNotification();
    });
  }

  /**
   * Enhanced twin pair room joining with presence data
   */
  private joinTwinRoom(twinPairId: string) {
    if (!this.socket || !this.userId) return;

    this.connectionTimestamp = new Date().toISOString();
    this.presenceData = {
      userId: this.userId,
      status: 'online',
      lastSeen: this.connectionTimestamp,
      deviceId: this.deviceId,
      connectionCount: 1
    };

    this.socket.emit('join_twin_room', {
      twinPairId,
      presenceData: this.presenceData,
      deviceId: this.deviceId
    });

    this.twinPairId = twinPairId;
    this.startHeartbeat();
    console.log('Joined twin room with presence:', twinPairId, this.presenceData);
  }

  // ========================
  // ROOM MANAGEMENT & PRESENCE TRACKING
  // ========================

  /**
   * Start heartbeat mechanism to maintain presence
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected && this.userId && this.twinPairId) {
        const heartbeatData = {
          userId: this.userId,
          twinPairId: this.twinPairId,
          deviceId: this.deviceId,
          timestamp: new Date().toISOString(),
          status: 'online'
        };

        this.socket.emit('heartbeat', heartbeatData);
        console.log('Heartbeat sent:', heartbeatData);
      }
    }, this.HEARTBEAT_INTERVAL);

    console.log(`Heartbeat started with ${this.HEARTBEAT_INTERVAL}ms interval`);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('Heartbeat stopped');
    }
  }

  /**
   * Handle presence updates from other twin
   */
  private handlePresenceUpdate(data: {
    userId: string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: string;
    deviceId?: string;
    connectionCount?: number;
  }) {
    console.log('Presence update received:', data);

    // Update multi-device connection tracking
    if (data.deviceId) {
      if (data.status === 'offline') {
        this.multiDeviceConnections.delete(data.deviceId);
      } else {
        this.multiDeviceConnections.set(data.deviceId, {
          lastSeen: data.lastSeen || new Date().toISOString(),
          deviceId: data.deviceId
        });
      }
    }

    // Update room info if available
    if (this.roomInfo) {
      const memberIndex = this.roomInfo.members.findIndex(m => m.userId === data.userId);
      if (memberIndex >= 0) {
        this.roomInfo.members[memberIndex] = {
          ...this.roomInfo.members[memberIndex],
          status: data.status,
          lastSeen: data.lastSeen || new Date().toISOString(),
          deviceId: data.deviceId,
          connectionCount: data.connectionCount
        };
      }
    }

    // Update twin store with connection status
    const twinStore = useTwinStore.getState();
    if (twinStore.twinProfile && twinStore.twinProfile.id === data.userId) {
      twinStore.setTwinProfile({
        ...twinStore.twinProfile,
        isConnected: data.status === 'online',
        lastSeen: data.lastSeen
      });
    }
  }

  /**
   * Handle successful room joining
   */
  private handleRoomJoined(roomInfo: RoomInfo) {
    this.roomInfo = roomInfo;
    console.log('Successfully joined room:', roomInfo);

    // Update chat store with room information
    useChatStore.getState().setConnection({
      status: 'connected',
      lastConnected: new Date().toISOString(),
      roomId: roomInfo.twinPairId
    });
  }

  /**
   * Handle new member joining the room
   */
  private handleRoomMemberJoined(member: PresenceData) {
    console.log('Room member joined:', member);

    if (this.roomInfo) {
      // Add or update member in room info
      const existingIndex = this.roomInfo.members.findIndex(m => m.userId === member.userId);
      if (existingIndex >= 0) {
        this.roomInfo.members[existingIndex] = member;
      } else {
        this.roomInfo.members.push(member);
      }

      this.roomInfo.lastActivity = new Date().toISOString();
    }

    // Track multi-device connections
    if (member.deviceId) {
      this.multiDeviceConnections.set(member.deviceId, {
        lastSeen: member.lastSeen,
        deviceId: member.deviceId
      });
    }
  }

  /**
   * Handle member leaving the room with grace period
   */
  private handleRoomMemberLeft(userId: string, gracePeriod: boolean = false) {
    console.log('Room member left:', userId, 'Grace period:', gracePeriod);

    if (gracePeriod) {
      // Start grace period timer
      this.startGracePeriod(userId);
    } else {
      // Immediately mark as offline
      this.markMemberOffline(userId);
    }
  }

  /**
   * Start grace period for reconnection
   */
  private startGracePeriod(userId: string) {
    if (this.gracePeriodTimeout) {
      clearTimeout(this.gracePeriodTimeout);
    }

    this.gracePeriodTimeout = setTimeout(() => {
      this.markMemberOffline(userId);
      console.log(`Grace period expired for user: ${userId}`);
    }, this.GRACE_PERIOD);

    console.log(`Grace period started for user: ${userId} (${this.GRACE_PERIOD}ms)`);
  }

  /**
   * Clear grace period timer
   */
  private clearGracePeriod() {
    if (this.gracePeriodTimeout) {
      clearTimeout(this.gracePeriodTimeout);
      this.gracePeriodTimeout = null;
    }
  }

  /**
   * Mark member as offline
   */
  private markMemberOffline(userId: string) {
    if (this.roomInfo) {
      const memberIndex = this.roomInfo.members.findIndex(m => m.userId === userId);
      if (memberIndex >= 0) {
        this.roomInfo.members[memberIndex] = {
          ...this.roomInfo.members[memberIndex],
          status: 'offline',
          lastSeen: new Date().toISOString()
        };
      }
    }

    // Update twin store
    const twinStore = useTwinStore.getState();
    if (twinStore.twinProfile && twinStore.twinProfile.id === userId) {
      twinStore.setTwinProfile({
        ...twinStore.twinProfile,
        isConnected: false,
        lastSeen: new Date().toISOString()
      });
    }
  }

  /**
   * Send a chat message
   */
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
    chatStore.addMessage(newMessage);

    try {
      if (this.socket?.connected && this.twinPairId) {
        // Encrypt message if encryption is enabled
        const messageToSend = { ...newMessage };
        if (this.twinPairId) {
          messageToSend.text = await conditionallyEncryptMessage(message.text, this.twinPairId) as string;
        }

        this.socket.emit('send_message', {
          twinPairId: this.twinPairId,
          message: messageToSend,
        });
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
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean) {
    if (!this.socket?.connected || !this.userId || !this.twinPairId) return;

    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile) return;

    if (isTyping) {
      this.socket.emit('typing_start', {
        twinPairId: this.twinPairId,
        userId: this.userId,
        userName: userProfile.name,
      });
    } else {
      this.socket.emit('typing_stop', {
        twinPairId: this.twinPairId,
        userId: this.userId,
      });
    }
  }

  /**
   * Send message reaction
   */
  async sendReaction(messageId: string, emoji: string) {
    const userProfile = useTwinStore.getState().userProfile;
    if (!userProfile || !this.socket?.connected || !this.twinPairId) return;

    const chatStore = useChatStore.getState();
    chatStore.addReaction(messageId, emoji, userProfile.id, userProfile.name);

    this.socket.emit('send_reaction', {
      twinPairId: this.twinPairId,
      messageId,
      emoji,
      userId: userProfile.id,
      userName: userProfile.name,
    });
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(messageIds: string[]) {
    if (!this.socket?.connected || !this.twinPairId) return;

    const chatStore = useChatStore.getState();

    messageIds.forEach(messageId => {
      chatStore.markAsRead(messageId);

      this.socket!.emit('mark_read', {
        twinPairId: this.twinPairId,
        messageId,
      });
    });

    chatStore.resetUnreadCount();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleIncomingMessage(data: WebSocketMessage) {
    const chatStore = useChatStore.getState();

    switch (data.type) {
      case 'message':
        // Decrypt message if encrypted
        const message = { ...data.data };
        if (this.twinPairId) {
          message.text = await conditionallyDecryptMessage(message.text, this.twinPairId);
        }

        chatStore.addMessage(message);
        this.sendPushNotification(message);
        chatStore.incrementUnreadCount();
        break;

      case 'message_delivered':
        chatStore.markAsDelivered(data.data.messageId);
        break;

      case 'message_read':
        chatStore.markAsRead(data.data.messageId);
        break;

      case 'reaction':
        chatStore.addReaction(
          data.data.messageId,
          data.data.emoji,
          data.data.userId,
          data.data.userName
        );
        break;

      case 'presence':
        // Handle presence updates
        console.log('Presence update:', data.data);
        break;
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(data: TypingIndicator) {
    useChatStore.getState().setTypingIndicator(data);

    // Clear typing indicator after 3 seconds
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      useChatStore.getState().setTypingIndicator(null);
    }, 3000);
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(errorMessage: string) {
    useChatStore.getState().setConnection({
      status: 'disconnected'
    });
    console.error('WebSocket connection error:', errorMessage);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleConnectionError('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    useChatStore.getState().setConnection({ status: 'reconnecting' });

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Process offline message queue
   */
  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const message of queue) {
      try {
        if (this.socket?.connected) {
          this.socket.emit('send_message', {
            twinPairId: this.twinPairId,
            message,
          });
        } else {
          // Re-queue if connection lost
          this.offlineQueue.push(message);
        }
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.offlineQueue.push(message);
      }
    }

    await this.saveOfflineMessages();
  }

  /**
   * Save offline messages to AsyncStorage
   */
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

  /**
   * Load offline messages from AsyncStorage
   */
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

  /**
   * Send push notification for new message
   */
  private async sendPushNotification(message: ChatMessage) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${message.senderName} sent a message`,
          body: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
          data: { messageId: message.id, screen: 'TwinTalk' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send twintuition notification
   */
  private async sendTwintuitionNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Twintuition Alert! 🔮',
          body: 'You and your twin are having an intuitive moment!',
          data: { type: 'twintuition', screen: 'Twintuition' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send twintuition notification:', error);
    }
  }

  // ========================
  // PUBLIC API METHODS
  // ========================

  /**
   * Get current room information
   */
  getRoomInfo(): RoomInfo | null {
    return this.roomInfo;
  }

  /**
   * Get presence data for current user
   */
  getPresenceData(): PresenceData | null {
    return this.presenceData;
  }

  /**
   * Get multi-device connection count
   */
  getDeviceConnectionCount(): number {
    return this.multiDeviceConnections.size;
  }

  /**
   * Get all connected devices for current session
   */
  getConnectedDevices(): Array<{ lastSeen: string; deviceId: string }> {
    return Array.from(this.multiDeviceConnections.values());
  }

  /**
   * Manually update presence status
   */
  updatePresenceStatus(status: 'online' | 'offline' | 'away') {
    if (!this.socket?.connected || !this.userId || !this.twinPairId) {
      console.warn('Cannot update presence: not connected or missing required data');
      return;
    }

    this.presenceData = {
      ...this.presenceData!,
      status,
      lastSeen: new Date().toISOString()
    };

    this.socket.emit('update_presence', {
      twinPairId: this.twinPairId,
      presenceData: this.presenceData
    });

    console.log('Presence updated:', this.presenceData);
  }

  /**
   * Force rejoin room (useful for reconnection scenarios)
   */
  rejoinRoom() {
    if (this.twinPairId && this.socket?.connected) {
      console.log('Rejoining room:', this.twinPairId);
      this.joinTwinRoom(this.twinPairId);
    } else {
      console.warn('Cannot rejoin room: missing twinPairId or not connected');
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    if (!this.socket) {
      return { status: 'disconnected' };
    }

    const chatStore = useChatStore.getState();
    return chatStore.connection;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get offline queue length
   */
  getOfflineQueueLength(): number {
    return this.offlineQueue.length;
  }

  /**
   * Get heartbeat status
   */
  isHeartbeatActive(): boolean {
    return this.heartbeatInterval !== null;
  }

  /**
   * Get device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }
}

// Singleton instance
export const websocketService = new ProductionWebSocketService();