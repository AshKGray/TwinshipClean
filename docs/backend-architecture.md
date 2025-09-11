# Twinship Backend Architecture

## Technology Stack Decision

### Core Framework: Node.js + Express + TypeScript
**Rationale:**
- **Shared Language**: TypeScript across frontend/backend reduces context switching
- **Rapid Development**: Express.js ecosystem enables fast prototyping and iteration
- **Real-time Capabilities**: Built-in WebSocket support via Socket.io
- **Package Ecosystem**: Rich npm ecosystem for features like JWT, validation, file upload
- **Team Consistency**: Leverages existing JavaScript/TypeScript expertise
- **JSON-First**: Native JSON handling aligns with mobile app data needs

### Database Strategy: PostgreSQL with Redis
**PostgreSQL (Primary Database):**
- **ACID Compliance**: Critical for user data, subscriptions, and research consent
- **Relational Structure**: Twin relationships, assessments, and research data benefit from relational modeling
- **JSON Support**: Native JSONB for flexible assessment results and telemetry data
- **Full-text Search**: Built-in search for messages and research studies
- **Mature Ecosystem**: Excellent TypeScript support via Prisma ORM

**Redis (Cache & Sessions):**
- **Session Storage**: JWT refresh tokens and user sessions
- **Real-time Features**: WebSocket connection management and presence
- **Rate Limiting**: API throttling and invitation rate limits
- **Message Queuing**: Offline message storage and delivery
- **Caching**: Frequently accessed data (user profiles, assessment items)

### Authentication: JWT with RS256
**JWT Implementation:**
- **Access Tokens**: Short-lived (1 hour) with user claims
- **Refresh Tokens**: Longer-lived (30 days) stored in Redis
- **RS256 Algorithm**: Asymmetric signing for better security
- **Token Rotation**: Automatic refresh token rotation on use
- **Device Tracking**: Multiple device support with separate tokens

### Real-time Communication: Socket.io
**WebSocket Features:**
- **Twin Pairing**: Real-time pairing notifications
- **Chat Messages**: Instant message delivery with typing indicators
- **Presence Status**: Online/offline status and last seen
- **Twintuition Alerts**: Real-time psychic moment notifications
- **Assessment Sync**: Live assessment completion status

### File Storage: AWS S3 or Cloudinary
**Media Management:**
- **Profile Pictures**: Optimized image storage and CDN delivery
- **Voice Messages**: Audio file storage with streaming
- **Assessment Media**: Images used in psychological assessments
- **Story Photos**: User-uploaded photos for shared stories
- **Backup Strategy**: Automated backups and versioning

### Email/SMS: SendGrid + Twilio
**Communication Services:**
- **SendGrid**: Transactional emails (invitations, research updates)
- **Twilio**: SMS invitations and verification
- **Templates**: HTML email templates with twin branding
- **Analytics**: Delivery tracking and engagement metrics

### Development Tools & Deployment
**Development Stack:**
- **TypeScript**: Strict typing with shared type definitions
- **Prisma**: Type-safe database ORM with migrations
- **Jest**: Unit and integration testing
- **Docker**: Containerized development and deployment
- **pnpm**: Fast package management
- **ESLint + Prettier**: Code quality and formatting

**Deployment Strategy:**
- **Railway/Vercel**: Easy deployment with environment management
- **Database**: Railway PostgreSQL or Supabase
- **Redis**: Railway Redis or Upstash
- **CDN**: Cloudflare for static assets and caching
- **Monitoring**: DataDog or LogRocket for production monitoring

## Project Structure

```
twinship-backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── twins.ts
│   │   │   ├── messages.ts
│   │   │   ├── assessments.ts
│   │   │   ├── research.ts
│   │   │   └── subscriptions.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   └── validators/
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── twinService.ts
│   │   ├── messageService.ts
│   │   ├── assessmentService.ts
│   │   ├── researchService.ts
│   │   ├── subscriptionService.ts
│   │   ├── emailService.ts
│   │   └── smsService.ts
│   ├── database/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seeds/
│   ├── websocket/
│   │   ├── handlers/
│   │   │   ├── chatHandler.ts
│   │   │   ├── presenceHandler.ts
│   │   │   └── twintuitionHandler.ts
│   │   └── middleware/
│   ├── types/
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── websocket.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   ├── validation.ts
│   │   ├── logger.ts
│   │   └── constants.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── jwt.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── docker/
├── scripts/
└── package.json
```

## API Architecture Patterns

### Controller-Service-Repository Pattern
```typescript
// Route Handler (Controller)
app.post('/api/v1/messages', authenticateUser, async (req, res) => {
  const result = await messageService.sendMessage(req.user.id, req.body);
  res.json(result);
});

// Business Logic (Service)
class MessageService {
  async sendMessage(senderId: string, messageData: CreateMessageRequest) {
    // Validation and business logic
    const message = await messageRepository.create({...});
    await websocketService.broadcast(message);
    return message;
  }
}

// Data Access (Repository)
class MessageRepository {
  async create(data: MessageData) {
    return await prisma.message.create({ data });
  }
}
```

### Middleware Pipeline
```typescript
app.use('/api/v1', [
  helmet(),                    // Security headers
  cors(corsOptions),          // CORS configuration
  rateLimiter,                // Rate limiting
  requestLogger,              // Request logging
  authenticate,               // JWT validation
  authorize,                  // Permission checks
  validateRequest,            // Input validation
]);
```

### Error Handling Strategy
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error:', error);
  
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      }
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

## WebSocket Architecture

### Connection Management
```typescript
// WebSocket authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await authService.verifyToken(token);
  socket.userId = user.id;
  next();
});

// Channel subscription
socket.on('join_twin_room', (twinPairId) => {
  socket.join(`twin_pair_${twinPairId}`);
  socket.to(`twin_pair_${twinPairId}`).emit('twin_online', socket.userId);
});
```

### Message Broadcasting
```typescript
// Real-time message delivery
io.to(`twin_pair_${twinPairId}`).emit('new_message', {
  id: message.id,
  text: message.text,
  senderId: message.senderId,
  timestamp: message.timestamp
});

// Typing indicators
socket.on('typing_start', () => {
  socket.to(`twin_pair_${twinPairId}`).emit('twin_typing', {
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });
});
```

## Security Implementation

### Input Validation with Joi
```typescript
const createMessageSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
  type: Joi.string().valid('text', 'image', 'emoji').default('text'),
  replyTo: Joi.string().uuid().optional()
});

// Middleware
const validateMessage = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createMessageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  next();
};
```

### Rate Limiting
```typescript
const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Apply different limits to different endpoints
app.use('/api/v1/auth/login', createRateLimiter(15 * 60 * 1000, 5)); // 5 per 15 minutes
app.use('/api/v1/messages', createRateLimiter(60 * 1000, 100)); // 100 per minute
app.use('/api/v1/twins/invite', createRateLimiter(60 * 60 * 1000, 5)); // 5 per hour
```

## Database Schema Design

### Core Tables
- **users**: User profiles and authentication data
- **twin_pairs**: Twin relationship mapping
- **messages**: Chat messages with full history
- **assessments**: Assessment sessions and responses
- **research_studies**: Available research studies
- **research_consent**: User consent records
- **subscriptions**: Premium subscription status
- **invitations**: Twin invitation tracking

### Performance Optimizations
- **Indexes**: Compound indexes on frequently queried fields
- **Partitioning**: Message table partitioned by date
- **Caching**: Redis caching for hot data paths
- **Read Replicas**: Separate read/write database connections

## Deployment Strategy

### Environment Configuration
```typescript
// config/environment.ts
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
  },
  redis: {
    url: process.env.REDIS_URL!
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '1h',
    refreshExpiresIn: '30d'
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET_NAME!
  }
};
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Development Workflow

### Getting Started
```bash
# Clone and setup
git clone <repo-url> twinship-backend
cd twinship-backend
pnpm install

# Database setup
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# Start development server
pnpm dev
```

### Testing Strategy
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

This architecture provides a robust, scalable foundation for the Twinship backend that can support real-time communication, research data collection, and premium subscriptions while maintaining excellent developer experience through TypeScript and modern tooling.