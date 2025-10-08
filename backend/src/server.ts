import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { messageRoutes } from './routes/messageRoutes';
import { twinProfileRoutes } from './routes/twin-profile.routes';
import { twincidencesRoutes } from './routes/twincidences.routes';
import stripeRoutes from './routes/stripe.routes';
import { initializeSocketService } from './services/socketService';
import { cleanupService } from './services/cleanupService';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'exp://localhost:19000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
}));

app.use(morgan('combined'));

// Stripe webhook route needs raw body - must come BEFORE express.json()
app.use('/api/stripe/webhook', stripeRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/messages', messageRoutes);
app.use('/api/twin-profile', twinProfileRoutes);
app.use('/api/twincidences', twincidencesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/subscriptions', stripeRoutes);

// Socket.io setup
const socketService = initializeSocketService(httpServer);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start cleanup service
    if (process.env.ENABLE_MESSAGE_CLEANUP !== 'false') {
      cleanupService.start();
      console.log('✅ Message cleanup service started');
    }

    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io server ready for connections`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

      if (socketService) {
        console.log('📊 Socket.io stats:', socketService.getStats());
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    httpServer.close(async (err) => {
      if (err) {
        console.error('❌ Error closing HTTP server:', err);
      } else {
        console.log('✅ HTTP server closed');
      }

      try {
        // Stop cleanup service
        cleanupService.stop();
        console.log('✅ Cleanup service stopped');

        // Close database connection
        await prisma.$disconnect();
        console.log('✅ Database disconnected');

        console.log('🎯 Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);

  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { app, httpServer, socketService };