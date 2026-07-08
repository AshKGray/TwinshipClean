# Redis Horizontal Scaling Deployment Guide

## Overview

This guide covers deploying Twinship's Socket.io service with Redis adapter for horizontal scaling across multiple server instances.

## Environment Configuration

### Required Environment Variables

```bash
# Redis Connection
REDIS_URL=redis://user:password@host:port/database
# OR individual components:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_USERNAME=your_redis_username

# Redis Security (Production)
REDIS_TLS=true
REDIS_TLS_CERT=/path/to/client.crt
REDIS_TLS_KEY=/path/to/client.key
REDIS_TLS_CA=/path/to/ca.crt
REDIS_TLS_REJECT_UNAUTHORIZED=true

# Redis Adapter Configuration
REDIS_ENABLED=true
REDIS_ADAPTER_KEY=socket.io
REDIS_REQUESTS_TIMEOUT=5000

# Optional Development Settings
REDIS_TLS_REJECT_UNAUTHORIZED=false  # Only for development
```

### Production Environment Setup

#### 1. Redis Infrastructure

**AWS ElastiCache (Redis):**
```bash
REDIS_URL=rediss://username:password@your-cluster.xxxxx.cache.amazonaws.com:6379
REDIS_TLS=true
REDIS_TLS_REJECT_UNAUTHORIZED=true
```

**Google Cloud Memorystore:**
```bash
REDIS_HOST=10.x.x.x
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
```

**Azure Cache for Redis:**
```bash
REDIS_URL=rediss://your-cache.redis.cache.windows.net:6380
REDIS_TLS=true
REDIS_PASSWORD=your_access_key
```

#### 2. Load Balancer Configuration

### Nginx Load Balancer (Recommended)

```nginx
upstream twinship_backend {
    # IP Hash for sticky sessions
    ip_hash;

    server backend1.twinship.com:3000;
    server backend2.twinship.com:3000;
    server backend3.twinship.com:3000;

    # Health checks
    keepalive 32;
}

server {
    listen 80;
    server_name api.twinship.com;

    # WebSocket upgrade headers
    location / {
        proxy_pass http://twinship_backend;
        proxy_http_version 1.1;

        # WebSocket specific headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Session affinity using IP hash
        proxy_set_header X-Client-IP $remote_addr;

        # Timeout settings for long-lived connections
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_connect_timeout 60s;

        # Buffering settings
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### AWS Application Load Balancer

```yaml
# ALB Target Group Configuration
TargetGroup:
  Protocol: HTTP
  Port: 3000
  HealthCheck:
    Path: /health
    Interval: 30
    Timeout: 5
    HealthyThreshold: 2
    UnhealthyThreshold: 3
  Attributes:
    # Enable sticky sessions
    stickiness.enabled: true
    stickiness.type: lb_cookie
    stickiness.lb_cookie.duration_seconds: 86400

# Listener Rules for WebSocket
ListenerRule:
  Conditions:
    - Field: http-header
      HttpHeaderConfig:
        HttpHeaderName: Upgrade
        Values: ["websocket"]
  Actions:
    - Type: forward
      TargetGroupArn: !Ref TargetGroup
```

### HAProxy Configuration

```haproxy
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend twinship_frontend
    bind *:80
    # WebSocket detection
    acl is_websocket hdr(Upgrade) -i websocket
    use_backend twinship_websocket if is_websocket
    default_backend twinship_http

backend twinship_websocket
    balance source  # Source IP hashing for sticky sessions
    server backend1 backend1:3000 check
    server backend2 backend2:3000 check
    server backend3 backend3:3000 check

backend twinship_http
    balance roundrobin
    server backend1 backend1:3000 check
    server backend2 backend2:3000 check
    server backend3 backend3:3000 check
```

## Deployment Architecture

### Multi-Server Deployment

```
┌─────────────────┐
│  Load Balancer  │
│   (Nginx/ALB)   │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│Server1│   │Server2│   │Server3│
│:3000  │   │:3000  │   │:3000  │
└───┬───┘   └───┬───┘   └───┬───┘
    │           │           │
    └───────────┼───────────┘
                │
        ┌───────▼───────┐
        │ Redis Cluster │
        │   (Pub/Sub)   │
        └───────────────┘
```

### Container Deployment (Docker)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    environment:
      - REDIS_PASSWORD=secure_password
    command: redis-server --requirepass secure_password
    volumes:
      - redis_data:/data

  backend1:
    build: .
    ports:
      - "3001:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=secure_password
      - SERVER_ID=backend1
    depends_on:
      - redis

  backend2:
    build: .
    ports:
      - "3002:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=secure_password
      - SERVER_ID=backend2
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend1
      - backend2

volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twinship-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: twinship-backend
  template:
    metadata:
      labels:
        app: twinship-backend
    spec:
      containers:
      - name: backend
        image: twinship/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_HOST
          value: "redis"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password

---
apiVersion: v1
kind: Service
metadata:
  name: twinship-service
spec:
  selector:
    app: twinship-backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
  sessionAffinity: ClientIP  # Sticky sessions
```

## Testing Horizontal Scaling

### 1. Local Testing Setup

```bash
# Terminal 1: Start Redis
docker run -d --name redis -p 6379:6379 redis:7 redis-server --requirepass test123

# Terminal 2: Start first backend instance
export REDIS_HOST=localhost
export REDIS_PASSWORD=test123
export SERVER_PORT=3001
npm run dev

# Terminal 3: Start second backend instance
export REDIS_HOST=localhost
export REDIS_PASSWORD=test123
export SERVER_PORT=3002
npm run dev
```

### 2. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test script
cat > load-test.yml << EOF
config:
  target: 'http://localhost'
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ['websocket']

scenarios:
  - name: "Socket.io connection test"
    weight: 100
    engine: socketio
    flow:
      - emit:
          channel: "join_twin_room"
          data:
            twinPairId: "test-pair-{{ \$randomString() }}"
      - think: 5
      - emit:
          channel: "send_message"
          data:
            message: "Test message {{ \$randomString() }}"
EOF

# Run load test
artillery run load-test.yml
```

### 3. Redis Scaling Verification

```bash
# Monitor Redis connections
redis-cli -h localhost -p 6379 -a test123 INFO clients

# Monitor pub/sub channels
redis-cli -h localhost -p 6379 -a test123 PUBSUB CHANNELS

# Check Socket.io adapter metrics via API
curl http://localhost:3001/admin/stats
curl http://localhost:3002/admin/stats
```

## Monitoring & Observability

### Health Check Endpoint

Add to your Express app:

```typescript
app.get('/health', async (req, res) => {
  const socketStats = await socketIOService.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    redis: socketStats.redis?.connected || false,
    connections: socketStats.connectedUsers,
    rooms: socketStats.totalRooms,
  });
});

app.get('/admin/redis-metrics', async (req, res) => {
  const metrics = await socketIOService.getRedisMetrics();
  res.json(metrics);
});
```

### Prometheus Metrics (Optional)

```typescript
import client from 'prom-client';

// Create metrics
const socketConnections = new client.Gauge({
  name: 'socketio_connections_total',
  help: 'Total number of Socket.io connections'
});

const redisLatency = new client.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Redis operation latency in seconds'
});

// Update metrics in your service
setInterval(async () => {
  const stats = await socketIOService.getStats();
  socketConnections.set(stats.connectedUsers);
}, 30000);
```

## Security Considerations

### Production Security Checklist

- [ ] Enable Redis AUTH with strong password
- [ ] Use TLS/SSL for Redis connections
- [ ] Configure Redis to bind to private network interfaces only
- [ ] Enable Redis protected mode
- [ ] Set up Redis ACL for granular permissions
- [ ] Use VPC/private subnets for Redis access
- [ ] Configure firewall rules to restrict Redis port access
- [ ] Enable Redis persistence encryption
- [ ] Regular Redis security updates
- [ ] Monitor Redis logs for suspicious activity

### Network Security

```bash
# Redis configuration for production
# /etc/redis/redis.conf

# Bind to private network only
bind 10.0.1.100

# Enable protected mode
protected-mode yes

# Require authentication
requirepass your_very_secure_password_here

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Enable TLS
tls-port 6380
tls-cert-file /etc/redis/tls/redis.crt
tls-key-file /etc/redis/tls/redis.key
tls-ca-cert-file /etc/redis/tls/ca.crt
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failures**
   ```bash
   # Check Redis connectivity
   redis-cli -h your-redis-host -p 6379 ping

   # Verify TLS connection
   redis-cli -h your-redis-host -p 6380 --tls ping
   ```

2. **Socket.io Cross-Server Communication**
   ```bash
   # Monitor Redis pub/sub activity
   redis-cli -h your-redis-host -p 6379 monitor

   # Check adapter key usage
   redis-cli -h your-redis-host -p 6379 keys "socket.io*"
   ```

3. **Load Balancer Session Affinity**
   ```bash
   # Test sticky sessions
   for i in {1..10}; do
     curl -H "Cookie: sessionid=test123" http://your-lb-endpoint/health
   done
   ```

### Debugging Tools

```typescript
// Add to your SocketIOService for debugging
public debugInfo() {
  return {
    localConnections: this.connectedUsers.size,
    localTwinPairs: this.twinPairs.size,
    redisStatus: this.redisConnected,
    adapterRooms: this.io.sockets.adapter.rooms.size,
    serverID: process.env.SERVER_ID || 'unknown',
  };
}
```

This deployment guide ensures robust, scalable, and secure Redis-based horizontal scaling for the Twinship real-time chat infrastructure.