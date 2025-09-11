# Twinship Backend - Project Implementation Guide

## Quick Start Commands

```bash
# Create new backend project directory
mkdir twinship-backend
cd twinship-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors helmet morgan compression
npm install jsonwebtoken bcryptjs joi
npm install @prisma/client prisma
npm install socket.io redis ioredis
npm install nodemailer twilio aws-sdk

# Install TypeScript dependencies
npm install -D typescript @types/node @types/express 
npm install -D @types/jsonwebtoken @types/bcryptjs
npm install -D @types/cors @types/morgan
npm install -D ts-node nodemon jest @types/jest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier

# Setup TypeScript
npx tsc --init

# Setup Prisma
npx prisma init
```

## Essential Package.json Scripts

```json
{
  "name": "twinship-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:migrate": "npx prisma migrate dev",
    "db:generate": "npx prisma generate",
    "db:studio": "npx prisma studio",
    "db:seed": "ts-node prisma/seed.ts",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
  }
}
```

## Core Implementation Files

### 1. Main Application Entry Point

**src/app.ts**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { logger } from './utils/logger';

class TwinshipServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: { origin: config.cors.origin }
    });
    this.prisma = new PrismaClient();
    this.redis = new Redis(config.redis.url);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // General middleware
    this.app.use(compression());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'healthy', // Add actual health checks
          redis: 'healthy',
          websocket: 'healthy'
        }
      });
    });
  }

  private setupRoutes(): void {
    setupRoutes(this.app, this.prisma, this.redis);
  }

  private setupWebSocket(): void {
    setupWebSocket(this.io, this.prisma, this.redis);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.prisma.$connect();
      logger.info('Database connected');

      // Test Redis connection
      await this.redis.ping();
      logger.info('Redis connected');

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Twinship API server running on port ${config.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
    this.server.close();
  }
}

// Start server
const server = new TwinshipServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', () => server.stop());
process.on('SIGINT', () => server.stop());

export default server;
```

### 2. Environment Configuration

**src/config/environment.ts**
```typescript
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '1h',
    refreshExpiresIn: '30d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
  },
  
  email: {
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.FROM_EMAIL || 'noreply@twinship.app'
  },
  
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    fromNumber: process.env.TWILIO_FROM_NUMBER!
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET_NAME!
  },
  
  revenueCat: {
    secretKey: process.env.REVENUECAT_SECRET_KEY!,
    publicKey: process.env.REVENUECAT_PUBLIC_KEY!
  }
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 3. Routes Setup

**src/routes/index.ts**
```typescript
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import authRoutes from './auth';
import userRoutes from './users';
import twinRoutes from './twins';
import messageRoutes from './messages';
import assessmentRoutes from './assessments';
import researchRoutes from './research';
import subscriptionRoutes from './subscriptions';

import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';

export function setupRoutes(app: Express, prisma: PrismaClient, redis: Redis): void {
  const apiRouter = express.Router();
  
  // Rate limiting
  const generalLimiter = createRateLimiter(60 * 1000, 100); // 100 per minute
  const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 per 15 minutes
  const inviteLimiter = createRateLimiter(60 * 60 * 1000, 5); // 5 per hour
  
  // Mount routes
  apiRouter.use('/auth', authLimiter, authRoutes(prisma, redis));
  apiRouter.use('/users', authenticate, userRoutes(prisma, redis));
  apiRouter.use('/twins', authenticate, inviteLimiter, twinRoutes(prisma, redis));
  apiRouter.use('/messages', authenticate, generalLimiter, messageRoutes(prisma, redis));
  apiRouter.use('/assessments', authenticate, assessmentRoutes(prisma, redis));
  apiRouter.use('/research', authenticate, researchRoutes(prisma, redis));
  apiRouter.use('/subscriptions', authenticate, subscriptionRoutes(prisma, redis));
  
  // Mount API router
  app.use('/api/v1', apiRouter);
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found'
      }
    });
  });
}
```

### 4. Authentication Middleware

**src/middleware/auth.ts**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/environment';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header'
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      
      // Verify user still exists
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true }
      });
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account no longer exists'
          }
        });
        return;
      }
      
      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Authentication error'
      }
    });
  }
}
```

### 5. Example Route Implementation

**src/routes/auth.ts**
```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { config } from '../config/environment';
import { validateRequest } from '../middleware/validation';

export default function authRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();

  // Validation schemas
  const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(1).max(100).required(),
    age: Joi.number().integer().min(1).max(120).required(),
    gender: Joi.string().optional(),
    birthDate: Joi.date().required(),
    twinType: Joi.string().valid('identical', 'fraternal', 'other').required(),
    accentColor: Joi.string().valid(
      'neon-pink', 'neon-blue', 'neon-green', 'neon-yellow',
      'neon-purple', 'neon-orange', 'neon-cyan', 'neon-red'
    ).required()
  });

  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  });

  // Register endpoint
  router.post('/register', validateRequest(registerSchema), async (req, res) => {
    try {
      const { email, password, ...profileData } = req.body;

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists'
          }
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Calculate zodiac sign
      const birthDate = new Date(profileData.birthDate);
      const zodiacSign = calculateZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());

      // Create user
      const user = await prisma.users.create({
        data: {
          email,
          passwordHash,
          zodiacSign,
          ...profileData
        },
        select: {
          id: true,
          email: true,
          name: true,
          accentColor: true,
          twinType: true,
          createdAt: true
        }
      });

      // Generate tokens
      const tokens = generateTokens(user.id);

      // Store refresh token in Redis
      await redis.setex(
        `refresh_token:${user.id}`,
        30 * 24 * 60 * 60, // 30 days
        tokens.refreshToken
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
        tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to create user account'
        }
      });
    }
  });

  // Login endpoint
  router.post('/login', validateRequest(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          accentColor: true,
          twinType: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Generate tokens
      const tokens = generateTokens(user.id);

      // Store refresh token in Redis
      await redis.setex(
        `refresh_token:${user.id}`,
        30 * 24 * 60 * 60,
        tokens.refreshToken
      );

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      res.json({
        success: true,
        user: userResponse,
        tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed'
        }
      });
    }
  });

  return router;
}

// Helper functions
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    tokenType: 'Bearer'
  };
}

function calculateZodiacSign(month: number, day: number): string {
  const signs = [
    'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
    'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'
  ];
  
  const dates = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
  
  if (day <= dates[month - 1]) {
    return signs[month - 1];
  } else {
    return signs[month % 12];
  }
}
```

### 6. WebSocket Setup

**src/websocket/index.ts**
```typescript
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { setupChatHandlers } from './handlers/chatHandler';
import { setupPresenceHandlers } from './handlers/presenceHandler';

export function setupWebSocket(io: SocketIOServer, prisma: PrismaClient, redis: Redis): void {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, accentColor: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userName = user.name;
      socket.userColor = user.accentColor;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Set up handlers
    setupChatHandlers(socket, io, prisma, redis);
    setupPresenceHandlers(socket, io, prisma, redis);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
```

## Development Workflow

### 1. Database Setup
```bash
# Setup Prisma schema (copy from docs/database-schema.sql)
npx prisma migrate dev --name initial
npx prisma generate
```

### 2. Environment Variables
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/twinship"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate with openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:19006"

# External Services
SENDGRID_API_KEY="your-sendgrid-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
REVENUECAT_SECRET_KEY="your-revenuecat-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET_NAME="twinship-media"
```

### 3. Development Commands
```bash
# Start development server
npm run dev

# Run database migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Run tests
npm test

# Check code quality
npm run lint
npm run format
```

This structure provides a solid foundation for implementing the Twinship backend API with all the features defined in the OpenAPI specification and database schema.