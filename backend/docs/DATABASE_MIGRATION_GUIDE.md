# Twinship Database Migration System

## Overview

Complete production-ready database migration system with:
- ✅ SQLite development environment
- ✅ PostgreSQL production/staging support
- ✅ Comprehensive seed data (dev/staging/production)
- ✅ Automated backup and rollback procedures
- ✅ Zero-downtime migration strategies
- ✅ pgBouncer connection pooling
- ✅ Migration runbook documentation

## Quick Start

### Development (SQLite)

```bash
# Run migrations
npm run prisma:migrate

# Seed development data (includes 4 test users)
npm run prisma:seed

# View database in GUI
npm run prisma:studio
```

**Test Accounts Available:**
- Jordan: `jordan@twinship.test` / `password123`
- Alex: `alex@twinship.test` / `password123`
- Sam: `sam@twinship.test` / `password123`
- Chris: `chris@twinship.test` / `password123`

### Production/Staging (PostgreSQL)

```bash
# 1. Set environment
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@host:5432/twinship_db"

# 2. Run migration with automatic backup
./scripts/migrate-production.sh

# 3. Seed minimal production data (event types only)
npm run prisma:seed:production
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Development schema (SQLite)
│   ├── schema.production.prisma   # Production schema (PostgreSQL)
│   ├── seed.ts                    # Comprehensive seed script
│   ├── migrations/                # Migration files
│   │   ├── 20251002163159_initial_twin_schema/
│   │   └── 20251002185839_replace_stories_with_twincidences/
│   └── dev.db                     # SQLite development database
├── scripts/
│   ├── migrate-production.sh      # Production migration with backup
│   ├── rollback-migration.sh      # Database rollback script
│   └── setup-pgbouncer.sh         # pgBouncer setup helper
├── config/
│   ├── pgbouncer.ini.example      # pgBouncer configuration template
│   └── userlist.txt.example       # pgBouncer authentication template
└── docs/
    ├── MIGRATION_RUNBOOK.md       # Complete migration procedures
    └── DATABASE_MIGRATION_GUIDE.md # This file
```

## Features

### 1. Multi-Environment Support

**Development (SQLite)**
- Fast local development
- No external database required
- Automatic migrations
- Rich seed data with test accounts

**Staging (PostgreSQL)**
- Production-like environment
- Full seed data for testing
- Migration testing before production

**Production (PostgreSQL)**
- Robust PostgreSQL database
- Minimal seed data (configuration only)
- Automatic backups before migration
- Zero-downtime migration support

### 2. Seed Data System

The seed script (`prisma/seed.ts`) provides environment-specific data:

**Development Seed Includes:**
- 4 test user accounts (2 twin pairs)
- Sample messages and conversations
- Game results and assessments
- Twincidences (twin moments)
- Event type catalog
- User consents and permissions

**Staging Seed:**
- Same as development (production-like test data)

**Production Seed:**
- Event type catalog only
- No test users
- Minimal configuration data

### 3. Migration Scripts

#### `migrate-production.sh`

Safely deploys migrations to production with:
- Pre-flight database checks
- Automatic timestamped backups
- Migration status verification
- Health checks post-migration
- Multiple confirmation prompts
- Colored output for clarity

#### `rollback-migration.sh`

Restores database from backup:
- Lists all available backups
- Interactive backup selection
- Confirmation required
- Complete database restoration
- Post-restore verification

### 4. pgBouncer Connection Pooling

#### Why pgBouncer?

- Reduces database connection overhead
- Handles connection spikes gracefully
- Improves application scalability
- Reduces latency for connection acquisition

#### Setup Helper

```bash
./scripts/setup-pgbouncer.sh
```

This script helps you:
1. Generate MD5 password hashes
2. Create userlist.txt entries
3. View complete setup instructions

#### Configuration Files

**`config/pgbouncer.ini.example`**
- Complete pgBouncer configuration
- Optimized for Twinship workload
- Transaction pooling mode
- Detailed comments explaining each setting

**`config/userlist.txt.example`**
- User authentication format
- Examples for MD5 hashed passwords

### 5. Zero-Downtime Migrations

The migration runbook (`docs/MIGRATION_RUNBOOK.md`) documents:

**Expand-Contract Pattern:**
1. **Expand**: Add new schema elements (keep old ones)
2. **Deploy**: Application supports both old and new
3. **Migrate Data**: Background job to copy data
4. **Contract**: Remove old schema elements

**Safe Operations:**
- Adding tables
- Adding nullable columns
- Adding indexes (`CONCURRENTLY` in PostgreSQL)
- Adding constraints with validation

**Risky Operations (require expand-contract):**
- Dropping columns
- Renaming columns
- Changing data types
- Adding NOT NULL to existing columns

## Database Schema

### Core Models

**User Management:**
- `User` - Core user accounts with authentication
- `RefreshToken` - JWT refresh tokens
- `PasswordReset` - Password reset tokens
- `LoginHistory` - Security audit trail

**Twin Features:**
- `TwinPair` - Twin connections and pairing
- `TwinProfile` - Extended user profiles
- `UserPresence` - Online/offline status

**Communication:**
- `Message` - Chat messages
- `MessageReaction` - Emoji reactions
- `MessageQueue` - Offline message queue

**Twin Experiences:**
- `Twincidence` - Twin synchronicity moments
- `TwincidenceConsent` - Granular consent per event type
- `EventTypeCatalog` - Configurable event detection

**Engagement:**
- `GameResult` - Psychic game results
- `Assessment` - Connection assessments
- `TwintuitionAlert` - Twintuition notifications

**Platform:**
- `Invitation` - User invitation system
- `ResearchParticipation` - Research consent tracking

### Indexes

All models include strategic indexes on:
- Foreign keys
- Query-heavy fields (email, status, timestamps)
- Composite indexes for common queries

## npm Scripts Reference

```json
{
  "prisma:generate": "Generate Prisma Client",
  "prisma:migrate": "Run migrations (development)",
  "prisma:migrate:deploy": "Deploy migrations (production)",
  "prisma:migrate:status": "Check migration status",
  "prisma:studio": "Open Prisma Studio GUI",
  "prisma:seed": "Seed development data",
  "prisma:seed:staging": "Seed staging data",
  "prisma:seed:production": "Seed production data"
}
```

## Environment Variables

### Required

```bash
# Database connection
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Environment
NODE_ENV=production
```

### Optional (Connection Pooling)

```bash
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

## Testing the Migration System

### 1. Test Development Migrations

```bash
# Start fresh
npm run prisma:migrate reset

# Run migrations
npm run prisma:migrate

# Seed data
npm run prisma:seed

# Verify
npm run prisma:studio
```

### 2. Test Production Scripts (Staging)

```bash
# Set staging environment
export NODE_ENV=staging
export DATABASE_URL="postgresql://user:pass@staging:5432/db"

# Run migration script
./scripts/migrate-production.sh

# Check backup was created
ls -lh backups/

# Test rollback
./scripts/rollback-migration.sh
```

### 3. Test pgBouncer Setup

```bash
# Generate password hash
./scripts/setup-pgbouncer.sh
# Select option 1, enter credentials

# Copy config files
sudo cp config/pgbouncer.ini.example /etc/pgbouncer/pgbouncer.ini
sudo cp config/userlist.txt.example /etc/pgbouncer/userlist.txt

# Edit with your settings
sudo nano /etc/pgbouncer/pgbouncer.ini
sudo nano /etc/pgbouncer/userlist.txt

# Start pgBouncer
sudo systemctl start pgbouncer

# Test connection
psql -h localhost -p 6432 -U your_user -d twinship_db
```

## Troubleshooting

See `docs/MIGRATION_RUNBOOK.md` for comprehensive troubleshooting guide covering:
- Migration failures
- Connection issues
- Backup problems
- Migration hangs
- Post-migration verification

## Best Practices

### Before Every Production Migration:

1. ✅ Test on staging first
2. ✅ Review all migration SQL
3. ✅ Verify backup system works
4. ✅ Plan downtime window (if needed)
5. ✅ Prepare rollback procedure
6. ✅ Notify team and stakeholders
7. ✅ Have monitoring ready

### During Migration:

1. ✅ Run automated migration script
2. ✅ Monitor logs for errors
3. ✅ Verify backup was created
4. ✅ Check migration status
5. ✅ Run health checks

### After Migration:

1. ✅ Verify application functionality
2. ✅ Check database connectivity
3. ✅ Monitor error rates
4. ✅ Review performance metrics
5. ✅ Confirm backup integrity

## Migration Workflow

```mermaid
graph TD
    A[Create Migration] --> B[Test Locally]
    B --> C[Commit Migration Files]
    C --> D[Deploy to Staging]
    D --> E{Staging OK?}
    E -->|No| F[Fix Issues]
    F --> B
    E -->|Yes| G[Schedule Production Deploy]
    G --> H[Run migrate-production.sh]
    H --> I[Automatic Backup]
    I --> J[Apply Migration]
    J --> K{Success?}
    K -->|No| L[Run rollback-migration.sh]
    L --> M[Restore from Backup]
    K -->|Yes| N[Health Checks]
    N --> O{Healthy?}
    O -->|No| L
    O -->|Yes| P[Monitor & Verify]
```

## Security Considerations

1. **Backup Encryption**: Ensure backups are encrypted at rest
2. **Access Control**: Limit who can run production migrations
3. **Audit Logging**: All migrations are logged with timestamps
4. **Password Management**: Never commit real passwords or tokens
5. **Connection Security**: Use TLS for database connections
6. **pgBouncer Auth**: Use MD5 or SCRAM-SHA-256, never plain text

## Performance Optimization

### Index Strategy

- All foreign keys are indexed
- Common query patterns have composite indexes
- Use `EXPLAIN ANALYZE` to verify index usage

### Connection Pooling

- pgBouncer reduces connection overhead
- Transaction-level pooling for best balance
- Configure pool sizes based on load

### Migration Performance

- Use `CONCURRENTLY` for index creation
- Batch large data migrations
- Monitor long-running queries during migration

## Support & Documentation

- **Migration Runbook**: `docs/MIGRATION_RUNBOOK.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **pgBouncer Docs**: https://www.pgbouncer.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Version History

- **v1.0** (2025-10-02): Initial production migration system
  - SQLite + PostgreSQL support
  - Comprehensive seed data
  - Automated backup/rollback
  - pgBouncer configuration
  - Zero-downtime migration patterns
  - Complete documentation

---

**Maintained By**: Backend Team
**Last Updated**: 2025-10-02
