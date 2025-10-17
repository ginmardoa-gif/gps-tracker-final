#!/bin/bash

# GPS Tracker Restore Script

BACKUP_DIR=~/gps-tracker-backups

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh YYYYMMDD_HHMMSS"
    echo ""
    echo "Available backups:"
    ls -1 $BACKUP_DIR/database_*.sql | sed 's/.*database_//' | sed 's/.sql//'
    exit 1
fi

DATE=$1
DB_BACKUP="$BACKUP_DIR/database_$DATE.sql"
CONFIG_BACKUP="$BACKUP_DIR/config_$DATE.tar.gz"

if [ ! -f "$DB_BACKUP" ]; then
    echo "Error: Database backup not found: $DB_BACKUP"
    exit 1
fi

echo "WARNING: This will overwrite current data!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Stopping services..."
docker compose down

echo "Starting database..."
docker compose up -d db

echo "Waiting for database to be ready..."
sleep 10

echo "Restoring database..."
cat $DB_BACKUP | docker compose exec -T db psql -U gpsadmin gps_tracker

if [ -f "$CONFIG_BACKUP" ]; then
    echo "Restoring configuration..."
    tar -xzf $CONFIG_BACKUP
fi

echo "Starting all services..."
docker compose up -d

echo ""
echo "Restore completed!"
echo "Please check logs: docker compose logs"
