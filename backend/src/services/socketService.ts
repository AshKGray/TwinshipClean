import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { messageService } from './messageService';
import { messageQueueService } from './messageQueueService';
import { ChatMessage, TypingIndicator, TwintuitionMoment, MessageType } from '../types/message';

// Extended Socket interface with authenticated user data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  twinPairId?: string;
}

// Socket.io message types
interface SocketMessage {
  type: 'send_message' | 'typing_start' | 'typing_stop' | 'send_reaction' | 'mark_read' | 'join_twin_room';
  data: any;
}

export class SocketService {
  private io: Server;
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private twinPairs = new Map<string, Set<string>>(); // twinPairId -> Set of userIds
  private typingUsers = new Map<string, Map<string, NodeJS.Timeout>>(); // twinPairId -> userId -> timeout

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'exp://localhost:19000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Connection timeout and ping settings
      pingTimeout: 60000,
      pingInterval: 25000,
      // Connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();

    console.log('Socket.io service initialized');
  }

  /**
   * Setup JWT authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          console.warn(`Socket connection rejected: No token provided from ${socket.handshake.address}`);
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // TODO: In production, verify user exists in database
        socket.userId = decoded.userId || decoded.sub;
        socket.email = decoded.email;

        console.log(`Socket authenticated for user: ${socket.email} (${socket.userId})`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
          return next(new Error('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
          return next(new Error('Token expired'));
        }
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      // Simple rate limiting: max 100 events per minute per socket
      const now = Date.now();
      if (!socket.data.rateLimitWindow) {
        socket.data.rateLimitWindow = now;
        socket.data.eventCount = 0;
      }

      // Reset window every minute
      if (now - socket.data.rateLimitWindow > 60000) {
        socket.data.rateLimitWindow = now;
        socket.data.eventCount = 0;
      }

      socket.data.eventCount++;

      if (socket.data.eventCount > 100) {
        console.warn(`Rate limit exceeded for socket ${socket.id} (user: ${(socket as AuthenticatedSocket).userId})`);
        return next(new Error('Rate limit exceeded'));
      }

      next();
    });
  }

  /**
   * Setup connection handlers
   */
  private setupConnectionHandlers() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

      if (socket.userId) {
        // Store connected user
        this.connectedUsers.set(socket.userId, socket);

        // Process offline message queue when user connects
        try {
          const queueStats = await messageQueueService.processQueueForUser(socket.userId);
          if (queueStats.processedCount > 0) {
            console.log(`Delivered ${queueStats.processedCount} offline messages to user ${socket.userId}`);
          }
        } catch (error) {
          console.error('Error processing offline queue:', error);
        }
      }

      // Handle twin room joining
      socket.on('join_twin_room', async (data: { twinPairId: string }) => {
        await this.handleJoinTwinRoom(socket, data.twinPairId);
      });

      // Handle message sending
      socket.on('send_message', async (data: { twinPairId: string; message: ChatMessage }) => {
        await this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { twinPairId: string; userId: string; userName: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: { twinPairId: string; userId: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Handle message reactions
      socket.on('send_reaction', async (data: { twinPairId: string; messageId: string; emoji: string; userId: string; userName: string }) => {
        await this.handleSendReaction(socket, data);
      });

      // Handle mark as read
      socket.on('mark_read', async (data: { twinPairId: string; messageId: string }) => {
        await this.handleMarkRead(socket, data);
      });

      // Handle message history requests
      socket.on('get_message_history', async (data: { twinPairId: string; limit?: number; before?: string }) => {
        await this.handleGetMessageHistory(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });

      // Emit connection confirmation
      socket.emit('connected', {
        message: 'Successfully connected to Twinship server',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Handle joining twin room
   */
  private async handleJoinTwinRoom(socket: AuthenticatedSocket, twinPairId: string) {
    try {
      if (!socket.userId) return;

      // TODO: In production, verify user has access to this twin pair via database

      // Join the room
      socket.join(`twin_pair_${twinPairId}`);
      socket.twinPairId = twinPairId;

      // Track twin pair connections
      if (!this.twinPairs.has(twinPairId)) {
        this.twinPairs.set(twinPairId, new Set());
      }
      this.twinPairs.get(twinPairId)!.add(socket.userId);

      console.log(`User ${socket.userId} joined twin room: ${twinPairId}`);

      // Notify twin of connection
      socket.to(`twin_pair_${twinPairId}`).emit('twin_connected', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      // Confirm room join
      socket.emit('twin_room_joined', {
        twinPairId,
        timestamp: new Date().toISOString(),
      });

      // Send any undelivered messages for this twin pair
      try {
        const undeliveredMessages = await messageService.getUndeliveredMessages(socket.userId, twinPairId);
        if (undeliveredMessages.length > 0) {
          socket.emit('undelivered_messages', {
            messages: undeliveredMessages,
            count: undeliveredMessages.length,
          });
        }
      } catch (error) {
        console.error('Error retrieving undelivered messages:', error);
      }
    } catch (error) {
      console.error('Error joining twin room:', error);
      socket.emit('error', { message: 'Failed to join twin room' });
    }
  }

  /**
   * Handle sending messages with persistence
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: { twinPairId: string; message: ChatMessage }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // Get recipient ID (the other user in the twin pair)
      const pairUsers = this.twinPairs.get(data.twinPairId);
      const recipientId = Array.from(pairUsers || []).find(userId => userId !== socket.userId);

      if (!recipientId) {
        socket.emit('error', { message: 'Twin not found' });
        return;
      }

      // Save message to database
      const savedMessage = await messageService.saveMessage({
        twinPairId: data.twinPairId,
        senderId: socket.userId,
        recipientId,
        content: data.message.text,
        messageType: data.message.type as MessageType,
        accentColor: data.message.accentColor,
        originalMessageId: data.message.originalMessageId,
      });

      // Check if recipient is online
      const recipientSocket = this.connectedUsers.get(recipientId);

      if (recipientSocket && recipientSocket.twinPairId === data.twinPairId) {
        // Recipient is online and in the same room - deliver immediately
        recipientSocket.emit('message', {
          type: 'message',
          data: savedMessage,
        });

        // Mark as delivered immediately
        await messageService.markAsDelivered(savedMessage.id);
      } else {
        // Recipient is offline - queue message for later delivery
        await messageQueueService.queueMessage({
          twinPairId: data.twinPairId,
          senderId: socket.userId,
          recipientId,
          messageData: savedMessage,
          messageType: 'send_message',
        });
      }

      // Send delivery confirmation to sender
      socket.emit('message_delivered', {
        messageId: savedMessage.id,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message sent in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error handling send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: { twinPairId: string; userId: string; userName: string }) {
    if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
      return;
    }

    // Clear any existing typing timeout
    this.clearTypingTimeout(data.twinPairId, data.userId);

    // Broadcast typing indicator to twin
    socket.to(`twin_pair_${data.twinPairId}`).emit('typing', {
      userId: data.userId,
      userName: data.userName,
      timestamp: new Date().toISOString(),
    });

    // Set timeout to auto-clear typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      this.handleTypingStop(socket, { twinPairId: data.twinPairId, userId: data.userId });
    }, 3000);

    // Store timeout
    if (!this.typingUsers.has(data.twinPairId)) {
      this.typingUsers.set(data.twinPairId, new Map());
    }
    this.typingUsers.get(data.twinPairId)!.set(data.userId, timeout);
  }

  /**
   * Handle stop typing
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: { twinPairId: string; userId: string }) {
    if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
      return;
    }

    // Clear typing timeout
    this.clearTypingTimeout(data.twinPairId, data.userId);

    // Broadcast stop typing to twin
    socket.to(`twin_pair_${data.twinPairId}`).emit('stop_typing', {
      userId: data.userId,
    });
  }

  /**
   * Handle message reactions with persistence
   */
  private async handleSendReaction(socket: AuthenticatedSocket, data: { twinPairId: string; messageId: string; emoji: string; userId: string; userName: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // Save reaction to database
      await messageService.addReaction(data.messageId, data.userId, data.emoji);

      // Broadcast reaction to twin pair room
      socket.to(`twin_pair_${data.twinPairId}`).emit('reaction', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date().toISOString(),
      });

      console.log(`Reaction sent in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error handling send reaction:', error);
      socket.emit('error', { message: 'Failed to send reaction' });
    }
  }

  /**
   * Handle mark as read with persistence
   */
  private async handleMarkRead(socket: AuthenticatedSocket, data: { twinPairId: string; messageId: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // Update message read status in database
      await messageService.markAsRead(data.messageId);

      // Notify sender that message was read
      socket.to(`twin_pair_${data.twinPairId}`).emit('message_read', {
        messageId: data.messageId,
        readBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message marked as read in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error handling mark read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  /**
   * Handle message history requests
   */
  private async handleGetMessageHistory(socket: AuthenticatedSocket, data: { twinPairId: string; limit?: number; before?: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      const history = await messageService.getMessageHistory({
        twinPairId: data.twinPairId,
        limit: data.limit,
        before: data.before ? new Date(data.before) : undefined,
      });

      socket.emit('message_history', {
        messages: history.messages,
        hasMore: history.hasMore,
        totalCount: history.totalCount,
      });
    } catch (error) {
      console.error('Error getting message history:', error);
      socket.emit('error', { message: 'Failed to retrieve message history' });
    }
  }

  /**
   * Clear typing timeout
   */
  private clearTypingTimeout(twinPairId: string, userId: string) {
    const pairTyping = this.typingUsers.get(twinPairId);
    if (pairTyping && pairTyping.has(userId)) {
      clearTimeout(pairTyping.get(userId)!);
      pairTyping.delete(userId);
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string) {
    console.log(`Socket disconnected: ${socket.id} (user: ${socket.userId}) - Reason: ${reason}`);

    if (socket.userId) {
      // Remove from connected users
      this.connectedUsers.delete(socket.userId);

      // Remove from twin pairs
      if (socket.twinPairId) {
        const pairUsers = this.twinPairs.get(socket.twinPairId);
        if (pairUsers) {
          pairUsers.delete(socket.userId);
          if (pairUsers.size === 0) {
            this.twinPairs.delete(socket.twinPairId);
          }
        }

        // Clear any typing indicators
        this.clearTypingTimeout(socket.twinPairId, socket.userId);

        // Notify twin of disconnection
        socket.to(`twin_pair_${socket.twinPairId}`).emit('twin_disconnected', {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeTwinPairs: this.twinPairs.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      totalSockets: this.io.sockets.sockets.size,
    };
  }

  /**
   * Broadcast message to all connected users (admin function)
   */
  public broadcastToAll(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.io.emit('system_message', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
    console.log(`System message broadcasted: ${message}`);
  }
}

export let socketService: SocketService | null = null;

export const initializeSocketService = (httpServer: HttpServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};