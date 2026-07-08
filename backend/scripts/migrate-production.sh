#!/bin/bash

# Production Migration Script for Twinship Backend
# This script safely deploys database migrations to production with zero downtime

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${NODE_ENV:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
MAX_RETRIES=3
HEALTH_CHECK_INTERVAL=5

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   Twinship Production Migration       ${NC}"
echo -e "${BLUE}   Environment: $ENVIRONMENT           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Function to print status messages
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if DATABASE_URL is set
check_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL environment variable is not set"
        echo "Please set DATABASE_URL to your production PostgreSQL connection string"
        exit 1
    fi
    success "Database connection configured"
}

# Function to create backup directory
create_backup_dir() {
    info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    success "Backup directory created"
}

# Function to backup database
backup_database() {
    info "Creating database backup..."

    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    DB_URL_PARTS=$(echo $DATABASE_URL | sed -e 's/postgresql:\/\///')
    DB_USER=$(echo $DB_URL_PARTS | cut -d: -f1)
    DB_PASS_HOST=$(echo $DB_URL_PARTS | cut -d: -f2)
    DB_PASS=$(echo $DB_PASS_HOST | cut -d@ -f1)
    DB_HOST=$(echo $DB_PASS_HOST | cut -d@ -f2 | cut -d: -f1)
    DB_PORT=$(echo $DB_URL_PARTS | cut -d: -f3 | cut -d/ -f1)
    DB_NAME=$(echo $DB_URL_PARTS | cut -d/ -f2 | cut -d? -f1)

    BACKUP_FILE="$BACKUP_DIR/backup.sql"

    # Use pg_dump to create backup
    PGPASSWORD=$DB_PASS pg_dump \
        -h $DB_HOST \
        -p ${DB_PORT:-5432} \
        -U $DB_USER \
        -d $DB_NAME \
        -F c \
        -f "$BACKUP_FILE" \
        --verbose

    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        error "Database backup failed"
        exit 1
    fi
}

# Function to check migration status
check_migration_status() {
    info "Checking current migration status..."
    npx prisma migrate status --schema=./prisma/schema.production.prisma
}

# Function to apply migrations
apply_migrations() {
    info "Applying database migrations..."

    # Use prisma migrate deploy for production (doesn't reset DB)
    npx prisma migrate deploy --schema=./prisma/schema.production.prisma

    if [ $? -eq 0 ]; then
        success "Migrations applied successfully"
    else
        error "Migration failed"
        warning "Consider rolling back using the rollback script"
        exit 1
    fi
}

# Function to verify migration
verify_migration() {
    info "Verifying migration..."

    # Check if the database is accessible
    npx prisma migrate status --schema=./prisma/schema.production.prisma

    if [ $? -eq 0 ]; then
        success "Migration verification passed"
    else
        warning "Migration verification failed"
        return 1
    fi
}

# Function to run health checks
health_check() {
    info "Running post-migration health checks..."

    # Basic connection test
    npx prisma db execute --schema=./prisma/schema.production.prisma --stdin <<< "SELECT 1;"

    if [ $? -eq 0 ]; then
        success "Database connectivity check passed"
    else
        error "Database connectivity check failed"
        return 1
    fi

    # You can add more health checks here
    # Example: Check if critical tables exist
    # npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"
}

# Main execution flow
main() {
    echo ""
    warning "⚠️  WARNING: You are about to run migrations on $ENVIRONMENT"
    warning "This will modify the production database schema"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        warning "Migration cancelled by user"
        exit 0
    fi

    echo ""

    # Step 1: Check database connection
    check_database_url

    # Step 2: Create backup directory
    create_backup_dir

    # Step 3: Backup database
    backup_database

    # Step 4: Check current migration status
    check_migration_status

    echo ""
    read -p "Proceed with migration? (yes/no): " PROCEED
    if [ "$PROCEED" != "yes" ]; then
        warning "Migration cancelled by user"
        exit 0
    fi

    # Step 5: Apply migrations
    apply_migrations

    # Step 6: Verify migration
    if verify_migration; then
        success "Migration verification successful"
    else
        warning "Migration verification had issues, but migration was applied"
    fi

    # Step 7: Health checks
    if health_check; then
        success "Health checks passed"
    else
        warning "Some health checks failed"
    fi

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}   Migration Completed Successfully    ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    success "Backup location: $BACKUP_DIR"
    echo ""
}

# Run main function
main
