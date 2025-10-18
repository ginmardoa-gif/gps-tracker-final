#!/bin/bash

# GPS Tracker System Status
# Quick overview of system health and usage

echo "================================================"
echo "GPS TRACKER SYSTEM STATUS"
echo "================================================"
echo ""
echo "⏰ Current Time: $(date)"
echo ""

# Container Status
echo "🐳 CONTAINER STATUS"
echo "------------------------------------------------"
docker compose ps
echo ""

# Database Statistics
echo "📊 DATABASE STATISTICS"
echo "------------------------------------------------"

# Total users by role
echo "👥 Users:"
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "
SELECT 
    role, 
    COUNT(*) as count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'manager' THEN 2 
        WHEN 'operator' THEN 3 
        WHEN 'viewer' THEN 4 
    END;
" | sed 's/^/   /'

# Vehicle statistics
echo ""
echo "🚗 Vehicles:"
TOTAL_VEHICLES=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM vehicles;")
ACTIVE_VEHICLES=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM vehicles WHERE is_active = true;")
echo "   Total: $TOTAL_VEHICLES"
echo "   Active: $ACTIVE_VEHICLES"
echo "   Inactive: $(($TOTAL_VEHICLES - $ACTIVE_VEHICLES))"

# Location data
echo ""
echo "📍 Location Data:"
LOCATIONS=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM locations;")
SAVED_LOCATIONS=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM saved_locations;")
POI=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM places_of_interest;")
echo "   GPS Points: $LOCATIONS"
echo "   Saved Locations: $SAVED_LOCATIONS"
echo "   Places of Interest: $POI"

# Database size
echo ""
echo "💾 Database Size:"
DB_SIZE=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT pg_size_pretty(pg_database_size('gps_tracker'));")
echo "   $DB_SIZE"

# Recent activity
echo ""
echo "📡 RECENT ACTIVITY (Last 24 hours)"
echo "------------------------------------------------"
RECENT_LOCATIONS=$(docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "SELECT COUNT(*) FROM locations WHERE timestamp > NOW() - INTERVAL '24 hours';")
echo "   GPS points recorded: $RECENT_LOCATIONS"

# Latest location per vehicle
echo ""
echo "🚗 Latest Vehicle Positions:"
docker compose exec -T db psql -U gpsadmin gps_tracker -t -c "
SELECT 
    v.name,
    TO_CHAR(l.timestamp, 'YYYY-MM-DD HH24:MI:SS') as last_update,
    ROUND(l.speed::numeric, 1) || ' km/h' as speed
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT * FROM locations 
    WHERE vehicle_id = v.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) l ON true
WHERE v.is_active = true
ORDER BY v.name;
" | sed 's/^/   /'

# Disk usage
echo ""
echo "💿 DISK USAGE"
echo "------------------------------------------------"
df -h / | tail -1 | awk '{print "   Used: " $3 " / " $2 " (" $5 ")"}'

# Memory usage
echo ""
echo "🧠 CONTAINER MEMORY USAGE"
echo "------------------------------------------------"
docker stats --no-stream --format "   {{.Name}}: {{.MemUsage}}" 2>/dev/null

echo ""
echo "================================================"
echo "✅ Status check complete!"
echo "================================================"
echo ""
