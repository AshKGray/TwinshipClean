# Authentication Database Schema Design

## Overview
This document defines the database schema for the Twinship authentication system, including user management, session handling, and security features.

## Database Models

### 1. User Model

Primary table for storing user authentication and profile data.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_normalized VARCHAR(255) UNIQUE NOT NULL, -- Lowercase for case-insensitive lookups
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    
    -- Profile fields (extend as needed)
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    
    -- Security fields
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete support
);

-- Indexes
CREATE INDEX idx_users_email_normalized ON users(email_normalized);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### 2. RefreshToken Model

Manages refresh tokens for JWT authentication flow.

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token metadata
    device_id VARCHAR(255), -- Optional device fingerprint
    user_agent TEXT,
    ip_address INET,
    
    -- Security
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(100), -- logout, security, expired, replaced
    replaced_by_token VARCHAR(500), -- For token rotation
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at) WHERE revoked_at IS NULL;
```

### 3. PasswordReset Model

Handles password reset tokens and flow.

```sql
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    
    -- Security
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```
### 4. LoginHistory Model (Optional - for security auditing)

Tracks login attempts and security events.

```sql
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL, -- Keep email even if user deleted
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- login_success, login_failed, logout, locked, unlocked
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100), -- invalid_password, account_locked, email_not_verified
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_email ON login_history(email);
CREATE INDEX idx_login_history_created_at ON login_history(created_at);
CREATE INDEX idx_login_history_event_type ON login_history(event_type);
```

## Security Considerations

### Password Storage
- Use bcrypt with cost factor of 12 (adjustable based on server capacity)
- Never store plain text passwords
- Implement password strength requirements

### Token Security
- Generate cryptographically secure random tokens
- Use sufficient entropy (minimum 32 bytes)
- Implement token rotation for refresh tokens
- Set appropriate expiration times:
  - Access tokens: 15 minutes
  - Refresh tokens: 7 days (configurable)
  - Email verification: 24 hours
  - Password reset: 1 hour

### Rate Limiting
- Implement account lockout after 5 failed attempts
- Progressive delays between attempts
- Track by both user_id and IP address

### Data Protection
- Use UUID v4 for all IDs (prevents enumeration attacks)
- Normalize emails for case-insensitive lookups
- Support soft deletes for compliance (GDPR)
- Encrypt sensitive data at rest

## Database Migrations

### Initial Migration (001_create_auth_tables.sql)

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables in order
-- Users table
CREATE TABLE users (...);

-- Refresh tokens table
CREATE TABLE refresh_tokens (...);

-- Password resets table
CREATE TABLE password_resets (...);

-- Login history table
CREATE TABLE login_history (...);

-- Create all indexes
CREATE INDEX ...;
```

### Rollback Migration

```sql
-- Drop tables in reverse order due to foreign keys
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Integration with Twin Features

### Extending for Twin-Specific Features

```sql
-- Additional table for twin pairing
CREATE TABLE twin_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pairing details
    pairing_code VARCHAR(20),
    paired_at TIMESTAMP,
    pair_type VARCHAR(50), -- identical, fraternal, other
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique pairing
    CONSTRAINT unique_twin_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Indexes for twin features
CREATE INDEX idx_twin_pairs_user1_id ON twin_pairs(user1_id);
CREATE INDEX idx_twin_pairs_user2_id ON twin_pairs(user2_id);
CREATE INDEX idx_twin_pairs_pairing_code ON twin_pairs(pairing_code);
CREATE INDEX idx_twin_pairs_status ON twin_pairs(status);
```

## Environment Variables

Required environment variables for authentication:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/twinship

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Email Service (for verification/reset)
EMAIL_FROM=noreply@twinship.app
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-key

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=30m
```

## Next Steps

1. Choose database system (PostgreSQL recommended for UUID support and JSONB)
2. Set up database connection in backend
3. Implement database models using ORM (Prisma, TypeORM, or Sequelize)
4. Create migration scripts
5. Implement authentication service layer
6. Add validation and error handling
7. Set up automated testing for auth flows