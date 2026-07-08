# Backend Setup Complete - Next Steps

## ✅ Completed Tasks

### 1. Database Schema Extended
- **Location**: `/backend/prisma/schema.prisma`
- **Added Models**:
  - `TwinProfile` - Extended user profiles with twin-specific data
  - `GameResult` - Game scores and insights storage
  - `Story` - Collaborative storytelling
  - `Assessment` - Assessment responses and results
  - `TwintuitionAlert` - Twin telepathy moments
  - `ResearchParticipation` - Research consent tracking
  - `Invitation` - Twin pairing invitation system

### 2. Database Migration Completed
- ✅ Prisma client generated
- ✅ Initial migration created: `20251002163159_initial_twin_schema`
- ✅ SQLite database created at `/backend/prisma/dev.db`
- ✅ All tables created successfully

### 3. Twin Profile API Implemented
- **Service**: `/backend/src/services/twin-profile.service.ts`
- **Routes**: `/backend/src/routes/twin-profile.routes.ts`
- **Endpoints**:
  - `POST /api/twin-profile/create` - Create twin profile
  - `GET /api/twin-profile/:userId` - Get profile by user ID
  - `PUT /api/twin-profile/:userId` - Update profile
  - `DELETE /api/twin-profile/:userId` - Delete profile
  - `GET /api/twin-profile/twin/:twinPairId` - Get twin's profile

## 🔧 Immediate Next Steps

### Step 1: Register Routes in Server
Add the new routes to your server file:

**File**: `/backend/src/server.ts`

```typescript
// Add this import at the top
import { twinProfileRoutes } from './routes/twin-profile.routes';

// Add this route registration (after other routes)
app.use('/api/twin-profile', twinProfileRoutes);
```

### Step 2: Start the Backend Server
```bash
cd /Users/ashleygray/AshApps/TwinshipClean/backend
npm run dev
```

Expected output:
```
✅ Database connected successfully
✅ Message cleanup service started
🚀 Server running on port 3000
📡 Socket.io server ready for connections
```

### Step 3: Test the API Endpoints

#### Test Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T...",
  "uptime": 1.234,
  "environment": "development"
}
```

#### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword123!",
    "displayName": "Your Name"
  }'
```

You should get back:
```json
{
  "user": {
    "id": "uuid-here",
    "email": "your-email@example.com",
    "displayName": "Your Name"
  },
  "tokens": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

#### Test Create Twin Profile
```bash
# Save the accessToken from above
TOKEN="your-access-token-here"
USER_ID="your-user-id-here"

curl -X POST http://localhost:3000/api/twin-profile/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'$USER_ID'",
    "name": "Ashley",
    "age": 25,
    "gender": "female",
    "twinType": "identical",
    "birthDate": "1999-01-01",
    "zodiacSign": "Capricorn",
    "accentColor": "neon-purple"
  }'
```

## 📝 Remaining Backend Routes to Implement

I've created a detailed plan, but here's a quick checklist of what still needs to be built:

### High Priority (For Basic Functionality):
1. **Pairing Routes** (`/backend/src/routes/pairing.routes.ts`)
   - Create invitation
   - Accept invitation
   - Get pairing status
   - Unpair

2. **Frontend Configuration** (`/src/config/env.ts`)
   - API URL configuration
   - WebSocket URL configuration

3. **Frontend Auth Service** (`/src/services/authService.ts`)
   - Replace mock with real API calls
   - Token management with expo-secure-store

### Medium Priority (For Full Features):
4. **Game Routes** (`/backend/src/routes/games.routes.ts`)
   - Save game results
   - Get game statistics
   - Calculate sync score

5. **Story Routes** (`/backend/src/routes/stories.routes.ts`)
   - CRUD operations for stories
   - Photo upload handling

6. **Assessment Routes** (`/backend/src/routes/assessments.routes.ts`)
   - Start assessment
   - Save responses
   - Calculate results

### Low Priority (Can Wait):
7. **Twintuition Routes** - Can use client-side for now
8. **Research Routes** - Feature not critical for initial testing

## 🎯 Recommended Development Flow

### Today:
1. ✅ Add twin-profile routes to server.ts
2. ✅ Start backend server
3. ✅ Test registration and profile creation via curl/Postman
4. ⏳ Implement pairing routes (most important for your use case)
5. ⏳ Create frontend env.ts configuration

### Tomorrow:
1. Update frontend authService to use real backend
2. Test registration flow in the app
3. Test profile creation in the app
4. Implement pairing flow in the app

### This Week:
1. Complete all backend routes
2. Update all frontend services
3. Remove TEST/TESTTWIN codes
4. Full end-to-end testing with you and your sister

## 🚀 Quick Reference: Using Your Backend

### Starting Development
```bash
# Terminal 1: Backend
cd /Users/ashleygray/AshApps/TwinshipClean/backend
npm run dev

# Terminal 2: Frontend
cd /Users/ashleygray/AshApps/TwinshipClean
npm start
# Then press 'i' for iOS simulator
```

### Viewing the Database
```bash
cd /Users/ashleygray/AshApps/TwinshipClean/backend
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

### Checking Logs
Backend logs will appear in the terminal where you ran `npm run dev`.
Look for:
- ✅ Success messages (green checkmarks)
- ❌ Error messages (red X marks)
- Database queries (if you want to see them)

### Common Issues & Solutions

#### Issue: "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill
```

#### Issue: "Database connection error"
```bash
cd backend
rm -f prisma/dev.db
npm run prisma:migrate
```

#### Issue: "Prisma Client not found"
```bash
cd backend
npm run prisma:generate
```

## 📋 Environment Variables Checklist

Make sure your `/backend/.env` file has these values:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3000
NODE_ENV=development

# JWT (MUST BE CHANGED IN PRODUCTION!)
JWT_SECRET="your-secret-key-min-32-chars-replace-in-production-please-use-a-real-secret"
JWT_ACCESS_TOKEN_EXPIRES="15m"
JWT_REFRESH_TOKEN_EXPIRES="7d"

# Email (optional for now, required for email verification)
EMAIL_FROM="noreply@twinship.app"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY=""  # Leave empty for now if you don't have one

# CORS (allows your React Native app to connect)
ALLOWED_ORIGINS="http://localhost:8081,exp://localhost:8081"
```

## 📱 Frontend Integration Preview

Once you implement the frontend integration, here's how it will work:

### 1. User Registration Flow
```
App Opens → RegisterScreen →
  POST /api/auth/register →
  Store JWT tokens →
  Navigate to Onboarding
```

### 2. Profile Creation Flow
```
Onboarding Screens →
  Collect user data →
  POST /api/twin-profile/create →
  Profile created →
  Navigate to PairScreen
```

### 3. Twin Pairing Flow
```
PairScreen →
  Generate Code: POST /api/pairing/create-invitation →
  Send code to twin →
  Twin accepts: POST /api/pairing/accept-invitation →
  Both users paired →
  Navigate to TwinTalk
```

### 4. Real-time Chat
```
Socket.io connection with JWT →
  send_message event →
  Backend receives and broadcasts →
  Twin receives message →
  UI updates in real-time
```

## 🎉 What You Can Do Now

1. **Register a real account** using your actual email
2. **Create your twin profile** with your real information
3. **Test the backend APIs** with Postman or curl
4. **View your data** in Prisma Studio

## 📚 Additional Resources

- **Detailed Implementation Plan**: `/docs/backend-implementation-plan.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **Express.js Guide**: https://expressjs.com/
- **Socket.io Docs**: https://socket.io/docs/

## 🤔 Questions?

If you run into any issues:
1. Check the backend terminal for error messages
2. Check Prisma Studio to see if data is being saved
3. Use curl or Postman to test API endpoints directly
4. Check the browser/app console for frontend errors

## Next Implementation Session

When you're ready to continue, we'll implement:
1. **Pairing service and routes** - So you can actually pair with your sister
2. **Frontend authService** - To connect the app to the backend
3. **WebSocket integration** - For real-time chat
4. **Remove test codes** - Clean up PairScreen and use real pairing flow

---

**You've made great progress!** The foundation is solid. Backend is ready, database is set up, and you have a clear path forward for implementation.
