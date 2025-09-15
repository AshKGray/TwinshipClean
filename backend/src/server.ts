// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import { logger } from './utils/logger';
import { initializeSocketIO, getSocketIOService } from './services/socketio';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/auth', rateLimiter);

// Health check endpoint with Socket.io stats
app.get('/health', (req, res) => {
  const socketService = getSocketIOService();
  const socketStats = socketService ? socketService.getStats() : null;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    socketio: socketStats,
  });
});

// Routes
app.use('/auth', authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Close Socket.io connections
  const socketService = getSocketIOService();
  if (socketService) {
    socketService.broadcastToAll('Server is shutting down for maintenance', 'info');
  }

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Socket.io
    const socketService = initializeSocketIO(httpServer);
    logger.info('Socket.io service initialized');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`Socket.io available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();