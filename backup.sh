#!/bin/bash

# GPS Tracker Backup Script
# Creates complete backup of database and configuration files
# Run this script regularly (recommended: daily via cron)

BACKUP_DIR=~/gps-tracker-backups
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "================================================"
echo "GPS Tracker Backup - $(date)"
echo "================================================"
echo ""

# Backup database (includes all users, vehicles, locations, POI)
echo "📦 Backing up database..."
docker compose exec -T db pg_dump -U gpsadmin gps_tracker > $BACKUP_DIR/database_$DATE.sql

if [ $? -eq 0 ]; then
    echo "✅ Database backed up successfully"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Backup configuration files
echo "📦 Backing up configuration files..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  .env \
  docker-compose.yml \
  backend-proxy.conf \
  ssl/ \
  backend/app/ \
  frontend/src/ \
  mobile/ 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Configuration backed up successfully"
else
    echo "❌ Configuration backup failed!"
    exit 1
fi

# List all backups
echo ""
echo "================================================"
echo "Backup Completed Successfully!"
echo "================================================"
echo ""
echo "📁 Database backup: $BACKUP_DIR/database_$DATE.sql"
echo "📁 Config backup:   $BACKUP_DIR/config_$DATE.tar.gz"
echo ""
echo "All backups in $BACKUP_DIR:"
echo "------------------------------------------------"
ls -lh $BACKUP_DIR/ | tail -n +2
echo ""

# Delete backups older than 30 days
DELETED=$(find $BACKUP_DIR -name "*.sql" -mtime +30 -delete -print | wc -l)
DELETED_TAR=$(find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete -print | wc -l)

if [ $DELETED -gt 0 ] || [ $DELETED_TAR -gt 0 ]; then
    echo "🗑️  Cleaned $(($DELETED + $DELETED_TAR)) old backups (>30 days)"
fi

echo ""
echo "💡 Tip: Download backups to another location for safety!"
echo "   scp user@server:$BACKUP_DIR/*.sql ~/local-backups/"
echo ""
