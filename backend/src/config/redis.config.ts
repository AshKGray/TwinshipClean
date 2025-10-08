import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Redis client type
type RedisClient = ReturnType<typeof createClient>;

// Redis connection configuration interface
export interface RedisConfig {
  url: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  tls?: boolean;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  retryConnect?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
}

// Redis adapter configuration for Socket.io
export interface RedisAdapterConfig {
  key?: string;
  requestsTimeout?: number;
}

/**
 * Redis configuration factory with environment-based setup
 */
export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private pubClient: RedisClient | null = null;
  private subClient: RedisClient | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 10;
  private baseRetryDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  /**
   * Get Redis configuration from environment variables
   */
  private getRedisConfig(): RedisConfig {
    const config: RedisConfig = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      tls: process.env.REDIS_TLS === 'true',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      retryConnect: this.maxRetries,
      lazyConnect: false,
      keepAlive: 30000, // 30 seconds
      family: 4, // IPv4
    };

    // Use URL if provided, otherwise use individual config
    if (process.env.REDIS_URL) {
      // Extract components from URL for additional configuration
      try {
        const url = new URL(config.url);
        config.host = url.hostname;
        config.port = parseInt(url.port || '6379', 10);
        if (url.username) config.username = url.username;
        if (url.password) config.password = url.password;
        config.tls = url.protocol === 'rediss:';
      } catch (error) {
        logger.warn('Invalid REDIS_URL format, falling back to individual config');
      }
    }

    return config;
  }

  /**
   * Create Redis client options with advanced configuration
   */
  private createClientOptions(config: RedisConfig) {
    const socketOptions: any = {
      host: config.host,
      port: config.port,
      connectTimeout: 10000,
      reconnectStrategy: (retries: number) => {
        if (retries >= this.maxRetries) {
          logger.error(`Redis connection failed after ${this.maxRetries} attempts`);
          return new Error('Redis connection retry limit exceeded');
        }

        const delay = Math.min(this.baseRetryDelay * Math.pow(2, retries), 30000);
        logger.info(`Redis connection retry ${retries + 1}/${this.maxRetries} in ${delay}ms`);
        return delay;
      },
    };

    // Add TLS configuration if enabled
    if (config.tls) {
      socketOptions.tls = true;
      if (process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'false') {
        socketOptions.rejectUnauthorized = false;
      }
    }

    const clientOptions: any = {
      socket: socketOptions,
      username: config.username,
      password: config.password,
    };

    return clientOptions;
  }

  /**
   * Initialize Redis clients for pub/sub with connection management
   */
  public async initializeClients(): Promise<{ pubClient: RedisClient; subClient: RedisClient }> {
    try {
      const config = this.getRedisConfig();
      const clientOptions = this.createClientOptions(config);

      // Create publisher client
      this.pubClient = createClient(clientOptions);

      // Create subscriber client (must be separate for Socket.io adapter)
      this.subClient = createClient(clientOptions);

      // Set up error handlers
      this.setupErrorHandlers(this.pubClient, 'Publisher');
      this.setupErrorHandlers(this.subClient, 'Subscriber');

      // Set up connection event handlers
      this.setupConnectionHandlers(this.pubClient, 'Publisher');
      this.setupConnectionHandlers(this.subClient, 'Subscriber');

      // Connect both clients
      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Redis clients connected successfully', {
        host: config.host,
        port: config.port,
        tls: config.tls,
        username: config.username ? '[REDACTED]' : undefined,
      });

      // Perform health check
      await this.healthCheck();

      return {
        pubClient: this.pubClient,
        subClient: this.subClient,
      };

    } catch (error) {
      this.connectionAttempts++;
      logger.error(`Redis connection failed (attempt ${this.connectionAttempts}):`, error);

      // Cleanup on failure
      await this.cleanup();

      throw new Error(`Failed to initialize Redis clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up error handlers for Redis clients
   */
  private setupErrorHandlers(client: RedisClient, clientType: string) {
    client.on('error', (error) => {
      logger.error(`Redis ${clientType} error:`, error);
      this.isConnected = false;
    });

    client.on('connect', () => {
      logger.info(`Redis ${clientType} connected`);
    });

    client.on('ready', () => {
      logger.info(`Redis ${clientType} ready`);
      this.isConnected = true;
    });

    client.on('end', () => {
      logger.warn(`Redis ${clientType} connection ended`);
      this.isConnected = false;
    });

    client.on('reconnecting', () => {
      logger.info(`Redis ${clientType} reconnecting...`);
      this.isConnected = false;
    });
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(client: RedisClient, clientType: string) {
    client.on('connect', () => {
      logger.info(`Redis ${clientType} socket connected`);
    });

    client.on('disconnect', () => {
      logger.warn(`Redis ${clientType} socket disconnected`);
      this.isConnected = false;
    });
  }

  /**
   * Perform Redis health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.pubClient || !this.isConnected) {
        return false;
      }

      const startTime = Date.now();
      const result = await this.pubClient.ping();
      const latency = Date.now() - startTime;

      if (result === 'PONG') {
        logger.debug(`Redis health check passed (${latency}ms)`);
        return true;
      }

      logger.warn('Redis health check failed: unexpected response');
      return false;

    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): { connected: boolean; attempts: number; pubReady: boolean; subReady: boolean } {
    return {
      connected: this.isConnected,
      attempts: this.connectionAttempts,
      pubReady: this.pubClient?.isReady ?? false,
      subReady: this.subClient?.isReady ?? false,
    };
  }

  /**
   * Get Redis adapter configuration for Socket.io
   */
  public getAdapterConfig(): RedisAdapterConfig {
    return {
      key: process.env.REDIS_ADAPTER_KEY || 'socket.io',
      requestsTimeout: parseInt(process.env.REDIS_REQUESTS_TIMEOUT || '5000', 10),
    };
  }

  /**
   * Get performance metrics
   */
  public async getMetrics(): Promise<{
    memory: { used: string; peak: string };
    connections: { clients: number; blocked: number };
    stats: { commands: number; keyspace: number };
    latency: number;
  } | null> {
    try {
      if (!this.pubClient || !this.isConnected) {
        return null;
      }

      const startTime = Date.now();

      const [clients, stats, keyspace] = await Promise.all([
        this.pubClient.sendCommand(['CLIENT', 'LIST']),
        this.pubClient.sendCommand(['INFO', 'stats']),
        this.pubClient.sendCommand(['INFO', 'keyspace']),
      ]);

      const latency = Date.now() - startTime;

      // Parse client list to count connections
      const clientLines = String(clients).split('\n').filter((line: string) => line.trim());
      const clientCount = clientLines.length;
      const blockedClients = clientLines.filter((line: string) => line.includes('flags=b')).length;

      // Parse stats for command count
      const commandsMatch = String(stats).match(/total_commands_processed:(\d+)/);
      const commandCount = commandsMatch ? parseInt(commandsMatch[1], 10) : 0;

      // Parse keyspace for key count
      const keyspaceMatch = String(keyspace).match(/keys=(\d+)/);
      const keyCount = keyspaceMatch ? parseInt(keyspaceMatch[1], 10) : 0;

      return {
        memory: {
          used: 'N/A', // Memory usage would need different command
          peak: 'N/A',
        },
        connections: {
          clients: clientCount,
          blocked: blockedClients,
        },
        stats: {
          commands: commandCount,
          keyspace: keyCount,
        },
        latency,
      };

    } catch (error) {
      logger.error('Failed to get Redis metrics:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      const disconnectPromises = [];

      if (this.pubClient) {
        disconnectPromises.push(this.pubClient.quit().catch(() => {}));
      }

      if (this.subClient) {
        disconnectPromises.push(this.subClient.quit().catch(() => {}));
      }

      await Promise.all(disconnectPromises);

      this.pubClient = null;
      this.subClient = null;
      this.isConnected = false;

      logger.info('Redis clients disconnected and cleaned up');
    } catch (error) {
      logger.error('Error during Redis cleanup:', error);
    }
  }

  /**
   * Force disconnect (emergency cleanup)
   */
  public async forceDisconnect(): Promise<void> {
    try {
      if (this.pubClient) {
        this.pubClient.disconnect();
      }
      if (this.subClient) {
        this.subClient.disconnect();
      }

      this.pubClient = null;
      this.subClient = null;
      this.isConnected = false;

      logger.warn('Redis clients force disconnected');
    } catch (error) {
      logger.error('Error during force disconnect:', error);
    }
  }
}

// Export singleton instance
export const redisManager = RedisConnectionManager.getInstance();