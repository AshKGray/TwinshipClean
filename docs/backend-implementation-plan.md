# Backend Implementation Plan for Twinship

## Current Status Analysis

### ✅ Already Implemented
- **Backend infrastructure**: Express server with TypeScript
- **Authentication system**: JWT-based auth with refresh tokens, email verification, password reset
- **Database**: Prisma with SQLite (can upgrade to PostgreSQL for production)
- **Real-time messaging**: Socket.io infrastructure with Redis support
- **Message queue**: Offline message support with retry logic
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **Logging**: Winston logger with error handling

### 📋 Just Added
- **Extended Prisma Schema** with models for:
  - `TwinProfile` - Extended user profiles with twin-specific data
  - `GameResult` - Storage for game scores and insights
  - `Story` - Collaborative storytelling content
  - `Assessment` - Assessment responses and results
  - `TwintuitionAlert` - Twin telepathy moments
  - `ResearchParticipation` - Research consent and participation tracking
  - `Invitation` - Twin pairing invitation system

### 🔧 Needs Implementation

#### 1. **Database Migration**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

#### 2. **Backend API Routes** (Needed)
- [ ] `/api/twin-profile` - Create/update/get twin profile
- [ ] `/api/pairing` - Twin pairing and invitation management
- [ ] `/api/games` - Game result storage and retrieval
- [ ] `/api/stories` - Story CRUD operations
- [ ] `/api/assessments` - Assessment management
- [ ] `/api/twintuition` - Twintuition alerts
- [ ] `/api/research` - Research participation management

#### 3. **Frontend Services** (Needs Update)
- [ ] `authService.ts` - Connect to backend auth instead of mock
- [ ] `websocketService.ts` - Already exists but needs backend URL config
- [ ] `twinPairingService.ts` - New service for pairing logic
- [ ] `profileService.ts` - New service for profile management
- [ ] `gameService.ts` - New service for game data sync
- [ ] `storyService.ts` - New service for story management

#### 4. **Environment Configuration**
- [ ] Backend `.env` file setup
- [ ] Frontend environment configuration for API URLs
- [ ] Socket.io connection configuration

## Implementation Steps

### Phase 1: Database Setup (Priority: HIGH)

1. **Generate Prisma Client**
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Create Initial Migration**
   ```bash
   npm run prisma:migrate
   # When prompted, name it: "initial_twin_schema"
   ```

3. **Verify Database**
   ```bash
   npm run prisma:studio
   # Opens Prisma Studio to view database
   ```

### Phase 2: Backend API Implementation (Priority: HIGH)

#### A. Twin Profile Management
Create `/backend/src/routes/twin-profile.routes.ts`:
- `POST /api/twin-profile/create` - Create twin profile during onboarding
- `PUT /api/twin-profile/update` - Update existing profile
- `GET /api/twin-profile/:userId` - Get twin profile
- `POST /api/twin-profile/upload-photo` - Upload profile picture

#### B. Twin Pairing System
Create `/backend/src/routes/pairing.routes.ts`:
- `POST /api/pairing/create-invitation` - Generate invitation code
- `POST /api/pairing/accept-invitation` - Accept pairing with code
- `GET /api/pairing/status` - Check pairing status
- `DELETE /api/pairing/unpair` - Remove twin connection

#### C. Game Results
Create `/backend/src/routes/games.routes.ts`:
- `POST /api/games/result` - Save game result
- `GET /api/games/results/:userId` - Get all game results
- `GET /api/games/stats/:userId` - Get game statistics
- `GET /api/games/sync-score/:twinPairId` - Calculate twin sync score

#### D. Twincidences (Twin Moments)
Create `/backend/src/routes/twincidences.routes.ts`:
- `POST /api/twincidences/create` - Create manual twincidence
- `PUT /api/twincidences/:id` - Update twincidence
- `GET /api/twincidences/:twinPairId` - Get all twincidences for twin pair
- `DELETE /api/twincidences/:id` - Delete (soft delete) twincidence
- `POST /api/twincidences/detect/twintuition` - Record twintuition button press
- `POST /api/twincidences/detect/check-simultaneous` - Check for simultaneous event

Create `/backend/src/routes/consent.routes.ts`:
- `GET /api/twincidences/consent/:userId` - Get all consent preferences
- `POST /api/twincidences/consent` - Set consent for event type
- `PUT /api/twincidences/consent/:eventType` - Update consent
- `DELETE /api/twincidences/consent/:eventType` - Revoke consent

Create `/backend/src/routes/event-types.routes.ts`:
- `GET /api/twincidences/event-types` - Get all available event types
- `GET /api/twincidences/event-types/:eventType` - Get specific event type config

#### E. Assessments
Create `/backend/src/routes/assessments.routes.ts`:
- `POST /api/assessments/start` - Start new assessment
- `PUT /api/assessments/:assessmentId/response` - Save responses
- `POST /api/assessments/:assessmentId/complete` - Complete and calculate results
- `GET /api/assessments/:userId` - Get assessment history

### Phase 3: Frontend Integration (Priority: HIGH)

#### A. Create Environment Configuration
Create `/src/config/env.ts`:
```typescript
const ENV = {
  API_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.twinship.app',
  WS_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.twinship.app',
};

export default ENV;
```

#### B. Update authService
Replace mock authentication in `/src/services/authService.ts` with real API calls:
- Connect to `/api/auth/register`
- Connect to `/api/auth/login`
- Store JWT tokens securely with expo-secure-store
- Implement token refresh logic

#### C. Update websocketService
Update `/src/services/websocketService.ts`:
- Replace mock WebSocket with Socket.io client
- Add authentication with JWT token
- Implement reconnection logic
- Handle real-time events

#### D. Remove Test Data
Files to update:
- `/src/screens/PairScreen.tsx` - Remove TEST/TESTTWIN codes
- Replace with real invitation code input
- Connect to backend pairing API

### Phase 4: Testing & Validation (Priority: MEDIUM)

#### Test Scenarios:
1. **Registration Flow**
   - Register with your email
   - Verify email (if enabled)
   - Complete onboarding
   - Create twin profile

2. **Pairing Flow**
   - Generate invitation code
   - Send to twin (your sister)
   - Twin accepts invitation
   - Verify twin pair creation

3. **Chat Flow**
   - Send message
   - Receive message
   - Typing indicators
   - Message reactions
   - Offline queue

4. **Game Flow**
   - Play game
   - Save result
   - View sync score
   - Check insights

5. **Story Flow**
   - Create story
   - Add photos
   - Share with twin
   - View shared stories

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend

# Install dependencies (if not already done)
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your settings
# For development, SQLite is fine:
# DATABASE_URL="file:./dev.db"

# Generate Prisma client
npm run prisma:generate

# Run migration
npm run prisma:migrate

# Start backend server
npm run dev

# Server should start on http://localhost:3000
```

### 2. Frontend Configuration
```bash
cd /Users/ashleygray/AshApps/TwinshipClean

# Create .env file in root
cat > .env << 'EOF'
API_URL=http://localhost:3000
WS_URL=http://localhost:3000
EOF

# For iOS simulator, you might need:
# API_URL=http://localhost:3000
# For Android emulator:
# API_URL=http://10.0.2.2:3000
```

### 3. Start Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd /Users/ashleygray/AshApps/TwinshipClean
npm start

# Then press 'i' for iOS or 'a' for Android
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Messages (Already Implemented)
- `POST /api/messages/send` - Send message
- `GET /api/messages/:twinPairId` - Get messages
- `PUT /api/messages/:messageId/read` - Mark as read
- `POST /api/messages/:messageId/react` - Add reaction

### Twin Profile (TO IMPLEMENT)
- `POST /api/twin-profile/create`
- `PUT /api/twin-profile/update`
- `GET /api/twin-profile/:userId`
- `POST /api/twin-profile/upload-photo`

### Pairing (TO IMPLEMENT)
- `POST /api/pairing/create-invitation`
- `POST /api/pairing/accept-invitation`
- `GET /api/pairing/status`
- `DELETE /api/pairing/unpair`

### Games (TO IMPLEMENT)
- `POST /api/games/result`
- `GET /api/games/results/:userId`
- `GET /api/games/stats/:userId`
- `GET /api/games/sync-score/:twinPairId`

### Twincidences (TO IMPLEMENT)
- `POST /api/twincidences/create` - Create manual twincidence
- `PUT /api/twincidences/:id` - Update twincidence
- `GET /api/twincidences/:twinPairId` - Get all twincidences
- `DELETE /api/twincidences/:id` - Delete twincidence
- `POST /api/twincidences/detect/twintuition` - Twintuition button press
- `POST /api/twincidences/detect/check-simultaneous` - Check simultaneous event
- `GET /api/twincidences/consent/:userId` - Get consent preferences
- `POST /api/twincidences/consent` - Set event consent
- `GET /api/twincidences/event-types` - Get event type catalog

### Assessments (TO IMPLEMENT)
- `POST /api/assessments/start`
- `PUT /api/assessments/:assessmentId/response`
- `POST /api/assessments/:assessmentId/complete`
- `GET /api/assessments/:userId`

## Socket.io Events (Real-time)

### Client → Server
- `authenticate` - Authenticate WebSocket connection
- `send_message` - Send chat message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `mark_read` - Mark messages as read
- `add_reaction` - Add emoji reaction

### Server → Client
- `authenticated` - Authentication successful
- `new_message` - New message received
- `message_delivered` - Message delivered to twin
- `message_read` - Message read by twin
- `typing` - Twin is typing
- `reaction_added` - Reaction added to message
- `twin_online` - Twin came online
- `twin_offline` - Twin went offline
- `twintuition_moment` - Twin telepathy detected

## Next Steps

### Immediate Actions (Today):
1. ✅ Run database migration to create tables
2. ⏳ Create twin profile API routes
3. ⏳ Create pairing API routes
4. ⏳ Update frontend authService
5. ⏳ Test registration and profile creation flow

### This Week:
1. Implement all backend API routes
2. Update all frontend services to use real APIs
3. Remove test codes from PairScreen
4. Test complete user flow end-to-end
5. Set up file upload for profile pictures

### Before Launch:
1. Switch from SQLite to PostgreSQL
2. Set up production environment
3. Configure SendGrid for email
4. Deploy backend to cloud (Railway/Render/AWS)
5. Update frontend with production API URLs
6. Final testing with real data

## File Structure Reference

### Backend Files Created/Modified:
```
backend/
├── prisma/
│   └── schema.prisma (✅ Updated with all models)
├── src/
│   ├── routes/
│   │   ├── twin-profile.routes.ts (TODO)
│   │   ├── pairing.routes.ts (TODO)
│   │   ├── games.routes.ts (TODO)
│   │   ├── stories.routes.ts (TODO)
│   │   └── assessments.routes.ts (TODO)
│   ├── services/
│   │   ├── auth.service.ts (✅ Already exists)
│   │   ├── twin-profile.service.ts (TODO)
│   │   ├── pairing.service.ts (TODO)
│   │   ├── games.service.ts (TODO)
│   │   └── stories.service.ts (TODO)
│   └── server.ts (✅ Already configured)
└── .env (✅ Configure your values)
```

### Frontend Files to Update:
```
src/
├── config/
│   └── env.ts (TODO - Create)
├── services/
│   ├── authService.ts (TODO - Update)
│   ├── websocketService.ts (✅ Exists, needs config)
│   ├── twinPairingService.ts (TODO - Create)
│   ├── profileService.ts (TODO - Create)
│   └── gameService.ts (TODO - Create)
└── screens/
    └── PairScreen.tsx (TODO - Remove test codes)
```

## Notes

- **Database**: Currently using SQLite for development. Migrate to PostgreSQL for production.
- **File Storage**: Profile pictures need cloud storage (AWS S3, Cloudinary, etc.)
- **Email**: SendGrid configured in .env but needs API key
- **Real-time**: Socket.io server ready, frontend needs Socket.io client
- **Testing**: Use Postman/Thunder Client to test APIs before frontend integration
- **Security**: JWT tokens, HTTPS in production, rate limiting enabled

---

**Questions or Issues?**
- Check backend logs: `cd backend && npm run dev`
- Check Prisma Studio: `cd backend && npm run prisma:studio`
- Test API health: `curl http://localhost:3000/health`
