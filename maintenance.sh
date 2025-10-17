#!/bin/bash

# GPS Tracker Maintenance Script

echo "=== GPS Tracker System Maintenance ==="
echo ""

# Check disk space
echo "1. Disk Space:"
df -h / | tail -1
echo ""

# Check container status
echo "2. Container Status:"
docker compose ps
echo ""

# Check database size
echo "3. Database Size:"
docker compose exec -T db psql -U gpsadmin gps_tracker -c "SELECT pg_size_pretty(pg_database_size('gps_tracker'));" | tail -2
echo ""

# Count records
echo "4. Record Counts:"
echo -n "   Locations: "
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM locations;"
echo -n "   Saved Locations: "
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM saved_locations;"
echo -n "   Users: "
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM users;"
echo -n "   Vehicles: "
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM vehicles;"
echo ""

# Check recent errors in logs
echo "5. Recent Errors (last 24 hours):"
docker compose logs --since 24h 2>&1 | grep -i error | tail -5
echo ""

# Check memory usage
echo "6. Container Memory Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Offer cleanup
read -p "Delete location data older than 30 days? (yes/no): " cleanup

if [ "$cleanup" = "yes" ]; then
    echo "Cleaning old data..."
    docker compose exec -T db psql -U gpsadmin gps_tracker -c "DELETE FROM locations WHERE timestamp < NOW() - INTERVAL '30 days';"
    docker compose exec -T db psql -U gpsadmin gps_tracker -c "DELETE FROM saved_locations WHERE timestamp < NOW() - INTERVAL '30 days' AND visit_type = 'auto_detected';"
    echo "Cleanup completed!"
fi

echo ""
echo "Maintenance check completed!"
