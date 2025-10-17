#!/bin/bash

# GPS Tracker Backup Script
# Run this script to create a complete backup

BACKUP_DIR=~/gps-tracker-backups
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting GPS Tracker backup..."

# Backup database
echo "Backing up database..."
docker compose exec -T db pg_dump -U gpsadmin gps_tracker > $BACKUP_DIR/database_$DATE.sql

# Backup configuration files
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  .env \
  docker-compose.yml \
  backend-proxy.conf \
  ssl/ \
  backend/app/ \
  frontend/src/ \
  mobile/

# List backups
echo ""
echo "Backup completed!"
echo "Database: $BACKUP_DIR/database_$DATE.sql"
echo "Config: $BACKUP_DIR/config_$DATE.tar.gz"
echo ""
echo "All backups:"
ls -lh $BACKUP_DIR/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo ""
echo "Old backups cleaned (kept last 30 days)"
