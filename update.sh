#!/bin/bash

# GPS Tracker Update Script

echo "=== GPS Tracker Update ==="
echo ""

# Create backup first
echo "Creating backup before update..."
./backup.sh

echo ""
read -p "Backup created. Continue with update? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Update cancelled"
    exit 0
fi

echo ""
echo "Stopping services..."
docker compose down

echo "Pulling latest images..."
docker compose pull

echo "Rebuilding containers..."
docker compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 15

echo ""
echo "Checking status..."
docker compose ps

echo ""
echo "Update completed!"
echo "Check logs: docker compose logs -f"
