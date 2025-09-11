# Twinship Backend API

## Overview
Backend API service for the Twinship mobile application, providing authentication, real-time communication, and data management for twin pairs.

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (RS256) with refresh tokens
- **Security**: bcrypt, helmet, rate limiting
- **Validation**: express-validator

## Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register
- **POST** `/auth/register`
- Body: `{ email, password, displayName? }`
- Returns: User object and tokens

#### Login
- **POST** `/auth/login`
- Body: `{ email, password, deviceId? }`
- Returns: User object and tokens

#### Logout
- **POST** `/auth/logout`
- Body: `{ refreshToken }`
- Returns: Success message

## Security Features

- **Password Security**: bcrypt with 12 salt rounds
- **Token Management**: Short-lived access tokens (15m) and refresh tokens (7d)
- **Rate Limiting**: Protects against brute force attacks
- **Account Lockout**: After 5 failed login attempts
- **Email Verification**: Required for account activation
- **Audit Logging**: All authentication events logged

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

### Database Management
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio GUI

## Project Structure
```
backend/
├── src/
│   ├── server.ts           # Express app setup
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript types
│   └── tests/              # Test files
├── prisma/
│   └── schema.prisma       # Database schema
├── logs/                   # Application logs
└── dist/                   # Compiled JavaScript
```

## Environment Variables

Key configuration in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

See `.env.example` for full list.

## Testing

Tests use Jest with TypeScript support:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Run migrations:
```bash
npm run prisma:migrate deploy
```

4. Start server:
```bash
npm start
```

## License
Proprietary - Twinship App