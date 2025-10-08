import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import { JWTPayload } from '../types/auth';
import { redisManager, RedisConfig, RedisAdapterConfig } from '../config/redis.config';
import { rateLimiter } from './rateLimitService';
import { typingIndicatorService } from './typingIndicatorService';

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
  private redisConnected = false;
  private redisHealthCheckInterval?: NodeJS.Timeout;

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

    // Setup Redis adapter asynchronously (non-blocking)
    this.setupRedisAdapter().catch((error) => {
      logger.error('Redis adapter initialization failed:', error);
    });

    logger.info('Socket.io service initialized');
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  private async setupRedisAdapter() {
    try {
      // Check if Redis is enabled
      const redisEnabled = process.env.REDIS_ENABLED !== 'false' &&
                          (process.env.REDIS_URL || process.env.REDIS_HOST);

      if (!redisEnabled) {
        logger.info('Redis adapter disabled - running in single-server mode');
        return;
      }

      logger.info('Initializing Redis adapter for horizontal scaling...');

      // Initialize Redis clients
      const { pubClient, subClient } = await redisManager.initializeClients();
      const adapterConfig = redisManager.getAdapterConfig();

      // Create and attach Redis adapter
      const adapter = createAdapter(pubClient, subClient, {
        key: adapterConfig.key,
        requestsTimeout: adapterConfig.requestsTimeout,
      });

      this.io.adapter(adapter);
      this.redisConnected = true;

      logger.info('Redis adapter successfully configured', {
        key: adapterConfig.key,
        requestsTimeout: adapterConfig.requestsTimeout,
      });

      // Start health check monitoring
      this.startRedisHealthCheck();

      // Handle Redis connection events
      pubClient.on('error', (error) => {
        logger.error('Redis pub client error:', error);
        this.redisConnected = false;
      });

      subClient.on('error', (error) => {
        logger.error('Redis sub client error:', error);
        this.redisConnected = false;
      });

      pubClient.on('connect', () => {
        logger.info('Redis pub client reconnected');
        this.redisConnected = true;
      });

      subClient.on('connect', () => {
        logger.info('Redis sub client reconnected');
        this.redisConnected = true;
      });

    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error);
      logger.warn('Continuing in single-server mode without Redis adapter');
      this.redisConnected = false;
    }
  }

  /**
   * Start Redis health check monitoring
   */
  private startRedisHealthCheck() {
    // Clear any existing health check
    if (this.redisHealthCheckInterval) {
      clearInterval(this.redisHealthCheckInterval);
    }

    // Health check every 30 seconds
    this.redisHealthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await redisManager.healthCheck();

        if (!isHealthy && this.redisConnected) {
          logger.warn('Redis health check failed - connection may be unstable');
          this.redisConnected = false;
        } else if (isHealthy && !this.redisConnected) {
          logger.info('Redis health check passed - connection restored');
          this.redisConnected = true;
        }
      } catch (error) {
        logger.error('Redis health check error:', error);
        this.redisConnected = false;
      }
    }, 30000);

    logger.info('Redis health check monitoring started (30s interval)');
  }

  /**
   * Get Redis adapter metrics
   */
  public async getRedisMetrics() {
    try {
      if (!this.redisConnected) {
        return { connected: false, metrics: null };
      }

      const metrics = await redisManager.getMetrics();
      const status = redisManager.getStatus();

      return {
        connected: this.redisConnected,
        status,
        metrics,
        adapter: {
          rooms: this.io.sockets.adapter.rooms.size,
          sockets: this.io.sockets.adapter.sids.size,
        },
      };
    } catch (error) {
      logger.error('Failed to get Redis metrics:', error);
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
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

    // Enhanced rate limiting middleware with token bucket algorithm
    this.io.use((socket: AuthenticatedSocket, next) => {
      // Check general rate limit for socket connection
      if (socket.userId) {
        const result = rateLimiter.checkLimit(socket.userId, 'general', 1);

        if (!result.allowed) {
          logger.warn(`Rate limit exceeded for socket ${socket.id} (user: ${socket.userId}), backoff: ${result.backoffTime}s`);

          // Send rate limit info to client
          const error: any = new Error('Rate limit exceeded');
          error.data = {
            retryAfter: result.resetIn,
            backoffTime: result.backoffTime,
          };
          return next(error);
        }

        // Store rate limit info in socket data for later use
        socket.data.rateLimitInfo = result;
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
   * Handle sending messages with enhanced rate limiting
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: { twinPairId: string; message: ChatMessage }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // Check rate limit for messages
      const rateLimit = rateLimiter.checkLimit(socket.userId, 'message', 1);

      if (!rateLimit.allowed) {
        socket.emit('rate_limited', {
          event: 'message',
          remaining: rateLimit.remaining,
          resetIn: rateLimit.resetIn,
          backoffTime: rateLimit.backoffTime,
          message: `Message rate limit exceeded. Please wait ${rateLimit.resetIn} seconds.`,
        });

        // Add rate limit headers to socket data
        const headers = rateLimiter.getRateLimitHeaders(socket.userId, 'message');
        socket.emit('rate_limit_headers', headers);

        return;
      }

      // TODO: Store message in database here
      // For now, we'll just relay the message

      // Broadcast message to twin pair room
      socket.to(`twin_pair_${data.twinPairId}`).emit('message', {
        type: 'message',
        data: data.message,
      });

      // Send delivery confirmation with rate limit info
      socket.emit('message_delivered', {
        messageId: data.message.id,
        timestamp: new Date().toISOString(),
        rateLimit: {
          remaining: rateLimit.remaining,
          resetIn: rateLimit.resetIn,
        },
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
   * Handle typing indicators with enhanced debouncing and rate limiting
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: { twinPairId: string; userId: string; userName: string }) {
    if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
      return;
    }

    // Check rate limit for typing events
    const rateLimit = rateLimiter.checkLimit(socket.userId, 'typing', 1);

    if (!rateLimit.allowed) {
      socket.emit('rate_limited', {
        event: 'typing',
        remaining: rateLimit.remaining,
        resetIn: rateLimit.resetIn,
        backoffTime: rateLimit.backoffTime,
        message: `Typing indicator rate limit exceeded. Please wait ${rateLimit.resetIn} seconds.`,
      });
      return;
    }

    // Handle typing with debouncing through the typing indicator service
    const result = typingIndicatorService.handleTypingStart(
      data.twinPairId,
      data.userId,
      data.userName,
      (event, eventData) => {
        // Emit to twin pair room
        if (event === 'typing_indicator') {
          socket.to(`twin_pair_${data.twinPairId}`).emit('typing', {
            userId: eventData.userId,
            userName: eventData.userName,
            isTyping: eventData.isTyping,
            timestamp: eventData.timestamp,
          });
        }
      }
    );

    // Log debounce status
    if (result.debounced) {
      logger.debug(`Typing indicator debounced for user ${data.userId} in room ${data.twinPairId}`);
    }
  }

  /**
   * Handle stop typing with enhanced service
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: { twinPairId: string; userId: string }) {
    if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
      return;
    }

    // Handle typing stop through the service
    typingIndicatorService.handleTypingStop(
      data.twinPairId,
      data.userId,
      (event, eventData) => {
        // Emit to twin pair room
        if (event === 'typing_indicator') {
          socket.to(`twin_pair_${data.twinPairId}`).emit('stop_typing', {
            userId: eventData.userId,
            timestamp: eventData.timestamp,
          });
        }
      }
    );
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
   * Handle message reactions with rate limiting
   */
  private async handleSendReaction(socket: AuthenticatedSocket, data: { twinPairId: string; messageId: string; emoji: string; userId: string; userName: string }) {
    try {
      if (!socket.userId || !socket.twinPairId || socket.twinPairId !== data.twinPairId) {
        socket.emit('error', { message: 'Invalid twin pair access' });
        return;
      }

      // Check rate limit for reactions
      const rateLimit = rateLimiter.checkLimit(socket.userId, 'reaction', 1);

      if (!rateLimit.allowed) {
        socket.emit('rate_limited', {
          event: 'reaction',
          remaining: rateLimit.remaining,
          resetIn: rateLimit.resetIn,
          backoffTime: rateLimit.backoffTime,
          message: `Reaction rate limit exceeded. Please wait ${rateLimit.resetIn} seconds.`,
        });
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

      // Clear typing indicators for this user across all rooms
      typingIndicatorService.clearUserFromAllRooms(
        socket.userId,
        (roomId, event, data) => {
          socket.to(`twin_pair_${roomId}`).emit(event, data);
        }
      );

      // Remove from twin pairs
      if (socket.twinPairId) {
        const pairUsers = this.twinPairs.get(socket.twinPairId);
        if (pairUsers) {
          pairUsers.delete(socket.userId);
          if (pairUsers.size === 0) {
            this.twinPairs.delete(socket.twinPairId);
          }
        }

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
   * Get connection statistics with enhanced metrics
   */
  public async getStats() {
    const baseStats = {
      connectedUsers: this.connectedUsers.size,
      activeTwinPairs: this.twinPairs.size,
      totalRooms: this.io.sockets.adapter.rooms.size,
      totalSockets: this.io.sockets.sockets.size,
      redisEnabled: this.redisConnected,
      typingIndicators: typingIndicatorService.getStats(),
      rateLimits: rateLimiter.getStats(),
    };

    // Add Redis metrics if connected
    if (this.redisConnected) {
      try {
        const redisMetrics = await this.getRedisMetrics();
        return {
          ...baseStats,
          redis: redisMetrics,
        };
      } catch (error) {
        return {
          ...baseStats,
          redis: { error: 'Failed to get Redis metrics' },
        };
      }
    }

    return baseStats;
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

  /**
   * Graceful shutdown with Redis cleanup
   */
  public async shutdown(): Promise<void> {
    logger.info('Starting SocketIO service shutdown...');

    try {
      // Stop Redis health check
      if (this.redisHealthCheckInterval) {
        clearInterval(this.redisHealthCheckInterval);
        this.redisHealthCheckInterval = undefined;
      }

      // Shutdown typing indicator service
      typingIndicatorService.shutdown();

      // Clear typing timeouts (legacy - now handled by service)
      for (const [twinPairId, userTimeouts] of this.typingUsers) {
        for (const [userId, timeout] of userTimeouts) {
          clearTimeout(timeout);
        }
      }
      this.typingUsers.clear();

      // Disconnect all sockets
      this.io.sockets.disconnectSockets(true);

      // Cleanup Redis connections
      if (this.redisConnected) {
        await redisManager.cleanup();
        this.redisConnected = false;
      }

      // Clear local state
      this.connectedUsers.clear();
      this.twinPairs.clear();

      logger.info('SocketIO service shutdown completed');
    } catch (error) {
      logger.error('Error during SocketIO service shutdown:', error);
      // Force cleanup if graceful fails
      await redisManager.forceDisconnect();
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