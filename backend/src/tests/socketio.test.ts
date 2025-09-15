import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { createServer } from 'http';
import { initializeSocketIO } from '../services/socketio';
import jwt from 'jsonwebtoken';

describe('Socket.io Server', () => {
  let httpServer: any;
  let socketService: any;
  let clientSocket: any;

  beforeAll((done) => {
    // Create test HTTP server
    httpServer = createServer();
    socketService = initializeSocketIO(httpServer);

    httpServer.listen(() => {
      const port = httpServer.address()?.port;

      // Create test JWT token
      const testToken = jwt.sign(
        {
          sub: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        process.env.JWT_SECRET || 'test-secret'
      );

      // Connect client with auth token
      clientSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: testToken,
        },
      });

      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    socketService?.io?.close();
    httpServer?.close();
  });

  afterEach(() => {
    clientSocket?.removeAllListeners();
  });

  test('should connect to server', (done) => {
    clientSocket.on('connected', (data: any) => {
      expect(data.message).toContain('Successfully connected');
      done();
    });
  });

  test('should handle authentication errors', (done) => {
    // Create client without token
    const unauthorizedClient = Client(`http://localhost:${httpServer.address()?.port}`);

    unauthorizedClient.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication');
      unauthorizedClient.disconnect();
      done();
    });
  });

  test('should handle chat namespace connection', (done) => {
    const chatClient = Client(`http://localhost:${httpServer.address()?.port}/chat`, {
      auth: {
        token: jwt.sign(
          {
            sub: 'test-user-id',
            email: 'test@example.com',
            emailVerified: true,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          process.env.JWT_SECRET || 'test-secret'
        ),
      },
    });

    chatClient.on('connect', () => {
      expect(chatClient.connected).toBe(true);
      chatClient.disconnect();
      done();
    });
  });

  test('should handle twintuition namespace connection', (done) => {
    const twintuitionClient = Client(`http://localhost:${httpServer.address()?.port}/twintuition`, {
      auth: {
        token: jwt.sign(
          {
            sub: 'test-user-id',
            email: 'test@example.com',
            emailVerified: true,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          process.env.JWT_SECRET || 'test-secret'
        ),
      },
    });

    twintuitionClient.on('connect', () => {
      expect(twintuitionClient.connected).toBe(true);
      twintuitionClient.disconnect();
      done();
    });
  });

  test('should provide server stats', () => {
    const stats = socketService.getStats();
    expect(stats).toHaveProperty('connectedUsers');
    expect(stats).toHaveProperty('activeTwinPairs');
    expect(stats).toHaveProperty('totalRooms');
    expect(stats).toHaveProperty('totalSockets');
  });
});