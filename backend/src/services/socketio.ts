import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import { JWTPayload } from '../types/auth';

// Extended Socket interface with authenticated user data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  emailVerified?: boolean;
  twinPairId?: string;
}

// Socket.io message types
interface SocketMessage {
  type: 'send_message' | 'typing_start' | 'typing_stop' | 'send_reaction' | 'mark_read' | 'join_twin_room';
  data: any;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  accentColor: string;
  isDelivered: boolean;
  isRead: boolean;
  reactions: any[];
}

interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: string;
}

interface TwintuitionMoment {
  message: string;
  type: 'intuition' | 'synchronicity' | 'connection';
  confidence: number;
  timestamp?: string;
}

export class SocketIOService {
  private io: Server;
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private twinPairs = new Map<string, Set<string>>(); // twinPairId -> Set of userIds
  private typingUsers = new Map<string, Map<string, NodeJS.Timeout>>(); // twinPairId -> userId -> timeout

  constructor(httpServer: HttpServer) {
    // Initialize Socket.io with CORS configuration
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
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
    this.setupNamespaces();
    this.setupConnectionHandlers();

    logger.info('Socket.io service initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    // JWT Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          logger.warn(`Socket connection rejected: No token provided from ${socket.handshake.address}`);
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            accountLockedUntil: true,
          },
        });

        if (!user) {
          logger.warn(`Socket connection rejected: User not found for token ${decoded.sub}`);
          return next(new Error('User not found'));
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          logger.warn(`Socket connection rejected: Account locked for user ${user.id}`);
          return next(new Error('Account is locked'));
        }

        // Attach user data to socket
        socket.userId = user.id;
        socket.email = user.email;
        socket.emailVerified = user.emailVerified;

        logger.info(`Socket authenticated for user: ${user.email} (${user.id})`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
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
      // Simple rate limiting: max 1000 events per minute per socket
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

      if (socket.data.eventCount > 1000) {
        logger.warn(`Rate limit exceeded for socket ${socket.id} (user: ${(socket as AuthenticatedSocket).userId})`);
        return next(new Error('Rate limit exceeded'));
      }

      next();
    });
  }

  /**
   * Setup namespaces for different types of communication
   */
  private setupNamespaces() {
    // Main chat namespace
    const chatNamespace = this.io.of('/chat');

    // Apply middleware to chat namespace
    chatNamespace.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { id: true, email: true, emailVerified: true, accountLockedUntil: true },
        });
        if (!user) {
          return next(new Error('User not found'));
        }
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          return next(new Error('Account is locked'));
        }
        socket.userId = user.id;
        socket.email = user.email;
        socket.emailVerified = user.emailVerified;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
      this.handleChatConnection(socket);
    });

    // Twintuition namespace for real-time synchronicity events
    const twintuitionNamespace = this.io.of('/twintuition');

    // Apply middleware to twintuition namespace
    twintuitionNamespace.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { id: true, email: true, emailVerified: true, accountLockedUntil: true },
        });
        if (!user) {
          return next(new Error('User not found'));
        }
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          return next(new Error('Account is locked'));
        }
        socket.userId = user.id;
        socket.email = user.email;
        socket.emailVerified = user.emailVerified;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    twintuitionNamespace.on('connection', (socket: AuthenticatedSocket) => {
      this.handleTwintuitionConnection(socket);
    });

    logger.info('Socket.io namespaces configured: /chat, /twintuition');
  }

  /**
   * Setup main connection handlers
   */
  private setupConnectionHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

      // Store connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        this.updateUserPresence(socket.userId, 'online');
      }

      // Handle general events
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });

      // Emit connection confirmation
      socket.emit('connected', {
        message: 'Successfully connected to Twinship server',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Handle chat namespace connections
   */
  private handleChatConnection(socket: AuthenticatedSocket) {
    logger.info(`Chat connection established: ${socket.id} (user: ${socket.userId})`);

    // Join twin room
    socket.on('join_twin_room', async (data: { twinPairId: string }) => {
      await this.joinTwinRoom(socket, data.twinPairId);
    });

    // Send message
    socket.on('send_message', async (data: { twinPairId: string; message: ChatMessage }) => {
      await this.handleSendMessage(socket, data);
    });

    // Typing indicators
    socket.on('typing_start', (data: { twinPairId: string; userId: string; userName: string }) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data: { twinPairId: string; userId: string }) => {
      this.handleTypingStop(socket, data);
    });

    // Message reactions
    socket.on('send_reaction', async (data: { twinPairId: string; messageId: string; emoji: string; userId: string; userName: string }) => {
      await this.handleSendReaction(socket, data);
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { twinPairId: string; messageId: string }) => {
      await this.handleMarkRead(socket, data);
    });
  }

  /**
   * Handle twintuition namespace connections
   */
  private handleTwintuitionConnection(socket: AuthenticatedSocket) {
    logger.info(`Twintuition connection established: ${socket.id} (user: ${socket.userId})`);

    // Handle twintuition events
    socket.on('twintuition_moment', async (data: { twinPairId: string; moment: TwintuitionMoment }) => {
      await this.handleTwintuitionMoment(socket, data);
    });

    // Handle synchronicity detection
    socket.on('synchronicity_detected', async (data: { twinPairId: string; event: any }) => {
      await this.handleSynchronicityDetection(socket, data);
    });
  }

  /**
   * Join twin room for private messaging
   */
  private async joinTwinRoom(socket: AuthenticatedSocket, twinPairId: string) {
    try {
      if (!socket.userId) return;

      // Verify user has access to this twin pair
      const twinPair = await prisma.twinPair.findFirst({
        where: {
          id: twinPairId,
          OR: [
            { user1Id: socket.userId },
            { user2Id: socket.userId },
          ],
        },
      });

      if (!twinPair) {
        socket.emit('error', { message: 'Access denied to twin pair' });
        return;
      }

      // Join the room
      socket.join(`twin_pair_${twinPairId}`);
      socket.twinPairId = twinPairId;

      // Track twin pair connections
      if (!this.twinPairs.has(twinPairId)) {
        this.twinPairs.set(twinPairId, new Set());
      }
      this.twinPairs.get(twinPairId)!.add(socket.userId);

      logger.info(`User ${socket.userId} joined twin room: ${twinPairId}`);

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
    } catch (error) {
      logger.error('Error joining twin room:', error);
      socket.emit('error', { message: 'Failed to join twin room' });
    }
  }

  /**
   * Handle sending messages
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: { twinPairId: string; message: ChatMessage }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // TODO: Store message in database here
      // For now, we'll just relay the message

      // Broadcast message to twin pair room
      socket.to(`twin_pair_${data.twinPairId}`).emit('message', {
        type: 'message',
        data: data.message,
      });

      // Send delivery confirmation to sender
      socket.emit('message_delivered', {
        messageId: data.message.id,
        timestamp: new Date().toISOString(),
      });

      // Check for twintuition moments
      this.detectTwintuitionMoments(data.twinPairId, data.message);

      logger.info(`Message sent in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error handling send message:', error);
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
   * Handle message reactions
   */
  private async handleSendReaction(socket: AuthenticatedSocket, data: { twinPairId: string; messageId: string; emoji: string; userId: string; userName: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // TODO: Store reaction in database here

      // Broadcast reaction to twin pair room
      socket.to(`twin_pair_${data.twinPairId}`).emit('reaction', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Reaction sent in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error handling send reaction:', error);
      socket.emit('error', { message: 'Failed to send reaction' });
    }
  }

  /**
   * Handle mark as read
   */
  private async handleMarkRead(socket: AuthenticatedSocket, data: { twinPairId: string; messageId: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // TODO: Update message read status in database here

      // Notify sender that message was read
      socket.to(`twin_pair_${data.twinPairId}`).emit('message_read', {
        messageId: data.messageId,
        readBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Message marked as read in twin pair ${data.twinPairId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error handling mark read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  /**
   * Handle twintuition moments
   */
  private async handleTwintuitionMoment(socket: AuthenticatedSocket, data: { twinPairId: string; moment: TwintuitionMoment }) {
    try {
      if (!socket.userId) return;

      // TODO: Store twintuition moment in database here

      // Broadcast to twin pair
      this.io.to(`twin_pair_${data.twinPairId}`).emit('twintuition_detected', {
        ...data.moment,
        triggeredBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Twintuition moment detected in twin pair ${data.twinPairId}`);
    } catch (error) {
      logger.error('Error handling twintuition moment:', error);
    }
  }

  /**
   * Handle synchronicity detection
   */
  private async handleSynchronicityDetection(socket: AuthenticatedSocket, data: { twinPairId: string; event: any }) {
    try {
      if (!socket.userId) return;

      // TODO: Process synchronicity event and store in database

      // Broadcast to twin pair
      this.io.to(`twin_pair_${data.twinPairId}`).emit('synchronicity_event', {
        ...data.event,
        detectedBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Synchronicity detected in twin pair ${data.twinPairId}`);
    } catch (error) {
      logger.error('Error handling synchronicity detection:', error);
    }
  }

  /**
   * Detect twintuition moments from messages
   */
  private detectTwintuitionMoments(twinPairId: string, message: ChatMessage) {
    // Simple keyword-based detection
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
      const moment: TwintuitionMoment = {
        message: 'Twin telepathy moment detected! 🔮',
        type: 'intuition',
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        timestamp: new Date().toISOString(),
      };

      // Broadcast twintuition moment
      this.io.to(`twin_pair_${twinPairId}`).emit('twintuition_detected', {
        ...moment,
        triggeredBy: message.senderId,
      });
    }
  }

  /**
   * Update user presence
   */
  private async updateUserPresence(userId: string, status: 'online' | 'offline') {
    try {
      // TODO: Update user presence in database

      // Notify twin pairs about presence change
      const userTwinPairs = Array.from(this.twinPairs.entries())
        .filter(([_, users]) => users.has(userId))
        .map(([twinPairId, _]) => twinPairId);

      userTwinPairs.forEach(twinPairId => {
        this.io.to(`twin_pair_${twinPairId}`).emit('presence', {
          userId,
          status,
          timestamp: new Date().toISOString(),
        });
      });

      logger.info(`User ${userId} presence updated to: ${status}`);
    } catch (error) {
      logger.error('Error updating user presence:', error);
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string) {
    logger.info(`Socket disconnected: ${socket.id} (user: ${socket.userId}) - Reason: ${reason}`);

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

      // Update presence to offline
      this.updateUserPresence(socket.userId, 'offline');
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
    logger.info(`System message broadcasted: ${message}`);
  }

  /**
   * Disconnect user from all sockets (admin function)
   */
  public disconnectUser(userId: string, reason: string = 'Admin action') {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.disconnect(true);
      logger.info(`User ${userId} forcibly disconnected: ${reason}`);
    }
  }
}

// Export singleton instance factory
let socketIOService: SocketIOService | null = null;

export const initializeSocketIO = (httpServer: HttpServer): SocketIOService => {
  if (!socketIOService) {
    socketIOService = new SocketIOService(httpServer);
  }
  return socketIOService;
};

export const getSocketIOService = (): SocketIOService | null => {
  return socketIOService;
};