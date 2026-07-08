#!/bin/bash

# Database Migration Rollback Script
# Restores database from a backup created during migration

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}═══════════════════════════════════════${NC}"
echo -e "${RED}   Database Migration Rollback        ${NC}"
echo -e "${RED}   ⚠️  CAUTION: This will restore DB  ${NC}"
echo -e "${RED}═══════════════════════════════════════${NC}\n"

# Functions
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

# List available backups
list_backups() {
    info "Available backups:"
    echo ""

    if [ ! -d "./backups" ]; then
        error "No backups directory found"
        exit 1
    fi

    BACKUPS=($(ls -1dt ./backups/*/))

    if [ ${#BACKUPS[@]} -eq 0 ]; then
        error "No backups found"
        exit 1
    fi

    for i in "${!BACKUPS[@]}"; do
        BACKUP_DIR=${BACKUPS[$i]}
        BACKUP_DATE=$(basename $BACKUP_DIR)
        BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
        echo "  [$i] $BACKUP_DATE ($BACKUP_SIZE)"
    done

    echo ""
}

# Select backup
select_backup() {
    read -p "Enter backup number to restore (or 'q' to quit): " SELECTION

    if [ "$SELECTION" == "q" ]; then
        warning "Rollback cancelled"
        exit 0
    fi

    if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -ge "${#BACKUPS[@]}" ]; then
        error "Invalid selection"
        exit 1
    fi

    SELECTED_BACKUP="${BACKUPS[$SELECTION]}"
    BACKUP_FILE="$SELECTED_BACKUP/backup.sql"

    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    success "Selected backup: $SELECTED_BACKUP"
    return 0
}

# Restore database
restore_database() {
    warning "⚠️  This will COMPLETELY REPLACE your current database"
    warning "All data created after the backup will be LOST"
    echo ""
    read -p "Type 'RESTORE' to confirm: " CONFIRM

    if [ "$CONFIRM" != "RESTORE" ]; then
        warning "Rollback cancelled"
        exit 0
    fi

    info "Restoring database from backup..."

    # Extract connection details
    DB_URL_PARTS=$(echo $DATABASE_URL | sed -e 's/postgresql:\/\///')
    DB_USER=$(echo $DB_URL_PARTS | cut -d: -f1)
    DB_PASS_HOST=$(echo $DB_URL_PARTS | cut -d: -f2)
    DB_PASS=$(echo $DB_PASS_HOST | cut -d@ -f1)
    DB_HOST=$(echo $DB_PASS_HOST | cut -d@ -f2 | cut -d: -f1)
    DB_PORT=$(echo $DB_URL_PARTS | cut -d: -f3 | cut -d/ -f1)
    DB_NAME=$(echo $DB_URL_PARTS | cut -d/ -f2 | cut -d? -f1)

    # Drop existing database (DANGEROUS!)
    warning "Dropping existing database..."
    PGPASSWORD=$DB_PASS psql \
        -h $DB_HOST \
        -p ${DB_PORT:-5432} \
        -U $DB_USER \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $DB_NAME;"

    # Create fresh database
    info "Creating fresh database..."
    PGPASSWORD=$DB_PASS psql \
        -h $DB_HOST \
        -p ${DB_PORT:-5432} \
        -U $DB_USER \
        -d postgres \
        -c "CREATE DATABASE $DB_NAME;"

    # Restore from backup
    info "Restoring data from backup..."
    PGPASSWORD=$DB_PASS pg_restore \
        -h $DB_HOST \
        -p ${DB_PORT:-5432} \
        -U $DB_USER \
        -d $DB_NAME \
        -v \
        "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        success "Database restored successfully"
    else
        error "Database restoration failed"
        exit 1
    fi
}

# Verify restoration
verify_restoration() {
    info "Verifying database restoration..."

    npx prisma db execute --schema=./prisma/schema.production.prisma --stdin <<< "SELECT 1;"

    if [ $? -eq 0 ]; then
        success "Database connection verified"
    else
        error "Database verification failed"
        return 1
    fi
}

# Main execution
main() {
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL is not set"
        exit 1
    fi

    list_backups
    select_backup
    restore_database
    verify_restoration

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}   Rollback Completed Successfully    ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
}

main
