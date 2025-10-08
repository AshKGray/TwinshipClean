#!/bin/bash

# PgBouncer Setup Helper Script
# Generates MD5 password hashes and helps configure pgBouncer

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   PgBouncer Setup Helper              ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Function to generate MD5 hash for pgBouncer
generate_md5_hash() {
    local username=$1
    local password=$2

    # MD5 format for pgBouncer: "md5" + md5(password + username)
    local hash=$(echo -n "${password}${username}" | md5sum | awk '{print $1}')
    echo "md5${hash}"
}

# Interactive mode
interactive_setup() {
    echo -e "${BLUE}Enter database username:${NC}"
    read -p "> " USERNAME

    echo -e "${BLUE}Enter password:${NC}"
    read -s -p "> " PASSWORD
    echo ""

    HASH=$(generate_md5_hash "$USERNAME" "$PASSWORD")

    echo ""
    echo -e "${GREEN}✓ Generated hash for user: $USERNAME${NC}"
    echo -e "${YELLOW}Add this line to /etc/pgbouncer/userlist.txt:${NC}"
    echo "\"$USERNAME\" \"$HASH\""
    echo ""
}

# Batch mode from file
batch_setup() {
    echo -e "${BLUE}Enter path to credentials file (format: username:password per line):${NC}"
    read -p "> " CREDS_FILE

    if [ ! -f "$CREDS_FILE" ]; then
        echo "File not found: $CREDS_FILE"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}Generated userlist.txt entries:${NC}"
    echo "---"

    while IFS=':' read -r username password; do
        if [ -n "$username" ] && [ -n "$password" ]; then
            hash=$(generate_md5_hash "$username" "$password")
            echo "\"$username\" \"$hash\""
        fi
    done < "$CREDS_FILE"

    echo "---"
    echo ""
}

# Main menu
main() {
    echo "What would you like to do?"
    echo "  1) Generate single user hash (interactive)"
    echo "  2) Generate multiple hashes from file"
    echo "  3) Show pgBouncer setup instructions"
    echo "  4) Exit"
    echo ""
    read -p "Select option [1-4]: " OPTION

    case $OPTION in
        1)
            interactive_setup
            ;;
        2)
            batch_setup
            ;;
        3)
            show_instructions
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
}

# Show setup instructions
show_instructions() {
    cat << 'EOF'

═══════════════════════════════════════════════════════════════
                    PgBouncer Setup Instructions
═══════════════════════════════════════════════════════════════

1. INSTALL PGBOUNCER
   ─────────────────
   Ubuntu/Debian:
     sudo apt-get update
     sudo apt-get install pgbouncer

   macOS:
     brew install pgbouncer

   RedHat/CentOS:
     sudo yum install pgbouncer

2. CONFIGURE PGBOUNCER
   ───────────────────
   Copy configuration template:
     sudo cp config/pgbouncer.ini.example /etc/pgbouncer/pgbouncer.ini

   Edit configuration:
     sudo nano /etc/pgbouncer/pgbouncer.ini

   Update these sections:
     - [databases]: Set your database connection details
     - [pgbouncer]: Review pool settings
     - listen_addr: Set to specific IP in production (not 0.0.0.0)

3. CREATE USER AUTHENTICATION FILE
   ────────────────────────────────
   Generate password hashes using this script (option 1 or 2)

   Create userlist.txt:
     sudo nano /etc/pgbouncer/userlist.txt

   Add generated entries:
     "username" "md5hashgoeshere"

   Set permissions:
     sudo chmod 600 /etc/pgbouncer/userlist.txt
     sudo chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt

4. CREATE LOG DIRECTORY
   ────────────────────
   sudo mkdir -p /var/log/pgbouncer
   sudo chown pgbouncer:pgbouncer /var/log/pgbouncer

5. START PGBOUNCER
   ───────────────
   sudo systemctl start pgbouncer
   sudo systemctl enable pgbouncer
   sudo systemctl status pgbouncer

6. TEST CONNECTION
   ───────────────
   Test through pgBouncer (port 6432):
     psql -h localhost -p 6432 -U twinship_user -d twinship_prod

7. UPDATE APPLICATION
   ──────────────────
   Update DATABASE_URL in .env:
     Before: postgresql://user:pass@localhost:5432/twinship_prod
     After:  postgresql://user:pass@localhost:6432/twinship_prod?pgbouncer=true

8. MONITOR PGBOUNCER
   ─────────────────
   Connect to admin console:
     psql -h localhost -p 6432 -U pgbouncer pgbouncer

   Show pools:
     SHOW POOLS;

   Show stats:
     SHOW STATS;

   Show databases:
     SHOW DATABASES;

9. LOGS
   ────
   View logs:
     sudo tail -f /var/log/pgbouncer/pgbouncer.log

   Check for errors:
     sudo journalctl -u pgbouncer -n 50

═══════════════════════════════════════════════════════════════

EOF
}

# Run main menu
main
