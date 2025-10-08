const { io } = require('socket.io-client');

/**
 * Redis Horizontal Scaling Test
 * This script tests Socket.io Redis adapter by connecting to multiple server instances
 */

class RedisScalingTest {
  constructor() {
    this.servers = [
      'http://localhost:3001',
      'http://localhost:3002',
    ];
    this.clients = [];
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.testDuration = 30000; // 30 seconds
  }

  /**
   * Create Socket.io clients for different servers
   */
  async createClients() {
    console.log('🔌 Creating Socket.io clients...');

    for (let i = 0; i < this.servers.length; i++) {
      const serverUrl = this.servers[i];
      const client = io(serverUrl, {
        auth: {
          token: 'test_jwt_token_here', // Replace with valid JWT
        },
        transports: ['websocket'],
      });

      client.serverUrl = serverUrl;
      client.clientId = `client-${i + 1}`;

      // Connection events
      client.on('connect', () => {
        console.log(`✅ ${client.clientId} connected to ${serverUrl}`);
      });

      client.on('disconnect', (reason) => {
        console.log(`❌ ${client.clientId} disconnected: ${reason}`);
      });

      client.on('error', (error) => {
        console.error(`🚨 ${client.clientId} error:`, error);
      });

      // Join test room
      client.emit('join_twin_room', { twinPairId: 'test-scaling-room' });

      // Listen for messages from other clients
      client.on('message', (data) => {
        this.messagesReceived++;
        console.log(`📨 ${client.clientId} received message from ${data.senderName}: ${data.text}`);
      });

      this.clients.push(client);
    }

    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Start cross-server message test
   */
  startMessageTest() {
    console.log('🚀 Starting cross-server message test...');

    const interval = setInterval(() => {
      // Pick random client to send message
      const randomClient = this.clients[Math.floor(Math.random() * this.clients.length)];
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const message = {
        id: messageId,
        text: `Test message from ${randomClient.clientId} - ${this.messagesSent + 1}`,
        senderId: randomClient.clientId,
        senderName: randomClient.clientId,
        timestamp: new Date().toISOString(),
        type: 'text',
        accentColor: '#00ff00',
        isDelivered: false,
        isRead: false,
        reactions: [],
      };

      randomClient.emit('send_message', {
        twinPairId: 'test-scaling-room',
        message: message,
      });

      this.messagesSent++;
      console.log(`📤 Sent message ${this.messagesSent} from ${randomClient.clientId}`);

    }, 1000); // Send message every second

    // Stop test after duration
    setTimeout(() => {
      clearInterval(interval);
      this.stopTest();
    }, this.testDuration);
  }

  /**
   * Test Redis adapter metrics
   */
  async testMetrics() {
    console.log('📊 Testing Redis adapter metrics...');

    for (const server of this.servers) {
      try {
        const response = await fetch(`${server}/admin/redis-metrics`);
        const metrics = await response.json();
        console.log(`📈 Metrics from ${server}:`, JSON.stringify(metrics, null, 2));
      } catch (error) {
        console.error(`❌ Failed to get metrics from ${server}:`, error.message);
      }
    }
  }

  /**
   * Stop test and cleanup
   */
  async stopTest() {
    console.log('🛑 Stopping test...');

    // Disconnect all clients
    this.clients.forEach((client, index) => {
      client.disconnect();
      console.log(`🔌 Disconnected ${client.clientId}`);
    });

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Print results
    console.log('\n📊 Test Results:');
    console.log(`Messages Sent: ${this.messagesSent}`);
    console.log(`Messages Received: ${this.messagesReceived}`);
    console.log(`Success Rate: ${((this.messagesReceived / (this.messagesSent * (this.clients.length - 1))) * 100).toFixed(2)}%`);

    if (this.messagesReceived > 0) {
      console.log('✅ Cross-server communication working! Redis adapter is functioning.');
    } else {
      console.log('❌ No cross-server communication detected. Check Redis adapter configuration.');
    }

    // Get final metrics
    await this.testMetrics();

    process.exit(0);
  }

  /**
   * Run the complete test suite
   */
  async run() {
    try {
      console.log('🧪 Starting Redis Horizontal Scaling Test\n');

      await this.createClients();
      await this.testMetrics();
      this.startMessageTest();

    } catch (error) {
      console.error('💥 Test failed:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(0);
});

// Run test if called directly
if (require.main === module) {
  const test = new RedisScalingTest();
  test.run();
}

module.exports = RedisScalingTest;