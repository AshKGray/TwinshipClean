# Database Migration Runbook

## Overview

This runbook provides step-by-step procedures for safely deploying database schema changes to the Twinship backend in production environments.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Procedures](#migration-procedures)
3. [Zero-Downtime Migration Strategy](#zero-downtime-migration-strategy)
4. [Rollback Procedures](#rollback-procedures)
5. [Connection Pooling Configuration](#connection-pooling-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Post-Migration Verification](#post-migration-verification)

---

## Pre-Migration Checklist

### Before Every Production Migration:

- [ ] **Review Migration Files**: Examine all pending migration SQL in `prisma/migrations/`
- [ ] **Test on Staging**: Successfully run migration on staging environment
- [ ] **Database Backup**: Automated backup will be created, but verify backup system is working
- [ ] **Downtime Window**: Confirm if migration requires maintenance window
- [ ] **Rollback Plan**: Review rollback procedures and ensure backup restoration is tested
- [ ] **Team Notification**: Notify team of upcoming migration
- [ ] **Monitor Setup**: Ensure monitoring/alerting is active
- [ ] **Connection Pool**: Verify pgBouncer is configured and healthy

### Environment Variables Required:

```bash
DATABASE_URL=postgresql://username:password@host:5432/twinship_db
NODE_ENV=production
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

---

## Migration Procedures

### Development Environment

```bash
# SQLite development database
npm run prisma:migrate
npm run prisma:seed
```

### Staging Environment

```bash
# PostgreSQL staging database
export NODE_ENV=staging
export DATABASE_URL="postgresql://user:pass@staging-host:5432/twinship_staging"

# Run migration
./scripts/migrate-production.sh

# Seed with staging data
npm run prisma:seed:staging
```

### Production Environment

```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@prod-host:5432/twinship_prod"

# Run migration script (includes automatic backup)
./scripts/migrate-production.sh
```

#### What the Migration Script Does:

1. **Pre-flight Checks**
   - Validates DATABASE_URL is set
   - Checks database connectivity

2. **Automatic Backup**
   - Creates timestamped backup directory
   - Uses `pg_dump` to backup entire database
   - Stores in `./backups/YYYYMMDD_HHMMSS/`

3. **Migration Status Check**
   - Shows pending migrations
   - Displays current schema version

4. **Apply Migrations**
   - Uses `prisma migrate deploy` (production-safe)
   - Never resets or seeds database automatically

5. **Verification**
   - Checks migration was applied correctly
   - Runs health checks
   - Verifies database connectivity

6. **Confirmation Prompts**
   - Requires explicit confirmation before proceeding
   - Shows what will be changed
   - Allows abort at any stage

---

## Zero-Downtime Migration Strategy

### Expand-Contract Pattern

For schema changes that could break existing code, use the expand-contract pattern:

#### Phase 1: Expand (Deploy with Compatibility)

1. **Add New Column/Table** (Don't remove old ones yet)
   ```sql
   -- Example: Adding new column while keeping old one
   ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
   ```

2. **Deploy Application Code** (V1.5 - Supports both old and new schema)
   - Write to both old and new columns
   - Read from new column, fallback to old if null
   - Test thoroughly

3. **Data Migration** (Background job if large dataset)
   ```sql
   -- Copy data from old to new column
   UPDATE users SET display_name = name WHERE display_name IS NULL;
   ```

#### Phase 2: Contract (Remove Old Schema)

4. **Deploy Application Code** (V2.0 - Uses only new schema)
   - Remove code reading/writing to old column
   - Monitor for errors

5. **Remove Old Column** (After verification)
   ```sql
   ALTER TABLE users DROP COLUMN name;
   ```

### Additive-Only Migrations (Preferred)

For zero-downtime deployments:

- ✅ **Safe Operations** (No downtime):
  - Adding new tables
  - Adding nullable columns
  - Adding indexes (use `CONCURRENTLY` in PostgreSQL)
  - Adding check constraints (with `NOT VALID`, then validate)

- ⚠️ **Risky Operations** (Require expand-contract):
  - Dropping columns
  - Renaming columns
  - Changing column types
  - Adding NOT NULL constraints to existing columns

### Example: Adding Index Without Blocking

```sql
-- PostgreSQL: Create index without locking table
CREATE INDEX CONCURRENTLY idx_users_email ON users(email_normalized);
```

---

## Rollback Procedures

### Automatic Rollback

If migration fails, the script will alert you. Database state is preserved in backup.

### Manual Rollback

```bash
# List available backups
./scripts/rollback-migration.sh

# Follow prompts to select backup and confirm restoration
```

#### Rollback Process:

1. **List Backups**: Shows all available backups with timestamps
2. **Select Backup**: Choose which backup to restore
3. **Confirmation**: Requires typing 'RESTORE' to proceed
4. **Drop & Recreate**: Drops existing database and recreates from backup
5. **Verification**: Tests database connectivity

⚠️ **WARNING**: Rollback will lose all data created after the backup timestamp.

### Partial Rollback (Advanced)

For selective rollback without full database restoration:

```bash
# Prisma doesn't support automatic down migrations
# You must manually write and execute inverse SQL

# Example: Rollback last migration manually
psql $DATABASE_URL -c "
  -- Drop newly added table
  DROP TABLE IF EXISTS new_feature_table;

  -- Remove migration record
  DELETE FROM _prisma_migrations
  WHERE migration_name = '20241002_add_new_feature';
"
```

---

## Connection Pooling Configuration

### pgBouncer Setup (Production)

pgBouncer provides connection pooling to reduce database load.

#### Install pgBouncer

```bash
# Ubuntu/Debian
sudo apt-get install pgbouncer

# macOS
brew install pgbouncer
```

#### Configure pgBouncer

**`/etc/pgbouncer/pgbouncer.ini`:**

```ini
[databases]
twinship_prod = host=localhost port=5432 dbname=twinship_prod

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 50
max_user_connections = 50
server_idle_timeout = 600
```

**`/etc/pgbouncer/userlist.txt`:**

```
"twinship_user" "md5<hashed_password>"
```

#### Update DATABASE_URL

```bash
# Before (direct PostgreSQL connection)
DATABASE_URL="postgresql://user:pass@localhost:5432/twinship_prod"

# After (through pgBouncer)
DATABASE_URL="postgresql://user:pass@localhost:6432/twinship_prod?pgbouncer=true"
```

#### Start pgBouncer

```bash
sudo systemctl start pgbouncer
sudo systemctl enable pgbouncer
sudo systemctl status pgbouncer
```

---

## Troubleshooting

### Common Issues

#### 1. Migration Fails with "Database out of sync"

**Cause**: Local schema doesn't match database state

**Solution**:
```bash
# Reset migration state (STAGING ONLY!)
npx prisma migrate reset --schema=./prisma/schema.production.prisma

# Or manually fix migration tracking
npx prisma migrate resolve --applied 20241002_migration_name --schema=./prisma/schema.production.prisma
```

#### 2. "Cannot connect to database"

**Cause**: DATABASE_URL incorrect or database unreachable

**Solution**:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check environment variable
echo $DATABASE_URL

# Verify network/firewall rules
telnet db-host 5432
```

#### 3. Backup Fails

**Cause**: Insufficient disk space or permissions

**Solution**:
```bash
# Check disk space
df -h

# Check pg_dump is installed
which pg_dump

# Verify database permissions
psql $DATABASE_URL -c "\du"
```

#### 4. Migration Hangs

**Cause**: Table locks from long-running queries

**Solution**:
```sql
-- Check for blocking queries
SELECT pid, usename, state, query
FROM pg_stat_activity
WHERE state = 'active';

-- Kill blocking query (if safe)
SELECT pg_terminate_backend(pid);
```

---

## Post-Migration Verification

### Checklist

After every production migration:

- [ ] **Health Checks Pass**
  ```bash
  curl https://api.twinship.app/health
  ```

- [ ] **Migration Status Clean**
  ```bash
  npx prisma migrate status --schema=./prisma/schema.production.prisma
  ```

- [ ] **Database Connectivity**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
  ```

- [ ] **Application Logs Clean**
  - Check for database errors
  - Verify no connection issues
  - Monitor error rates

- [ ] **Key Metrics Normal**
  - Response times
  - Error rates
  - Database query performance

- [ ] **Backup Verified**
  ```bash
  ls -lh backups/
  # Verify backup file size is reasonable
  ```

### Monitoring Queries

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Emergency Contacts

- **Database Admin**: [Contact Info]
- **DevOps Lead**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

## Incident Response

If migration causes production issues:

1. **Assess Impact**: Check error rates, user impact
2. **Decide**: Fix forward or rollback?
3. **Communicate**: Notify team and stakeholders
4. **Act**: Either rollback or hotfix
5. **Post-Mortem**: Document what happened and how to prevent

---

## Quick Reference

### Common Commands

```bash
# Development
npm run prisma:migrate           # Dev migration
npm run prisma:seed              # Seed dev data
npm run prisma:studio            # GUI database browser

# Production
./scripts/migrate-production.sh  # Production migration with backup
./scripts/rollback-migration.sh  # Rollback to previous backup

# Status & Info
npx prisma migrate status        # Check migration status
npx prisma db push               # Sync schema without migration (dev only)
npx prisma migrate resolve       # Mark migration as applied/rolled-back

# Seed
npm run prisma:seed:staging      # Seed staging environment
npm run prisma:seed:production   # Seed production (minimal data only)
```

---

**Last Updated**: 2025-10-02
**Version**: 1.0
**Maintained By**: Backend Team
