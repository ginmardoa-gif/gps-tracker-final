# GPS Tracker - Admin Quick Reference Card

## Daily Commands
```bash
# Check system status
./status.sh

# View live logs
docker compose logs -f backend --tail 50

# Check all containers running
docker compose ps
```

---

## Emergency Commands
```bash
# Restart everything
docker compose restart

# Full system restart
docker compose down && docker compose up -d

# Emergency backup
./backup.sh

# View recent errors
docker compose logs backend --tail 100 | grep ERROR
```

---

## User Management Quick Commands
```bash
# List all users
./manage-user.sh  # Option 1

# Create user
./manage-user.sh  # Option 2

# Reset password
./manage-user.sh  # Option 4

# Change role
./manage-user.sh  # Option 3
```

---

## Backup & Restore
```bash
# Create backup
./backup.sh

# List backups
ls -lh ~/gps-tracker-backups/

# Restore
./restore.sh YYYYMMDD_HHMMSS
```

---

## Database Quick Checks
```bash
# Check database size
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "SELECT pg_size_pretty(pg_database_size('gps_tracker'));"

# Count locations
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "SELECT COUNT(*) FROM locations;"

# Count users by role
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "SELECT role, COUNT(*) FROM users GROUP BY role;"
```

---

## Performance Commands
```bash
# Clean old data (90+ days)
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "DELETE FROM locations WHERE timestamp < NOW() - INTERVAL '90 days';"

# Vacuum database
docker compose exec db psql -U gpsadmin gps_tracker -c "VACUUM FULL;"

# Check disk space
df -h /
```

---

## Monitoring Commands
```bash
# Container memory usage
docker stats --no-stream

# Recent GPS points
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "SELECT COUNT(*) FROM locations WHERE timestamp > NOW() - INTERVAL '1 hour';"

# Latest vehicle positions
docker compose exec db psql -U gpsadmin gps_tracker -c \
  "SELECT v.name, MAX(l.timestamp) FROM vehicles v 
   LEFT JOIN locations l ON v.id = l.vehicle_id 
   GROUP BY v.name;"
```

---

## Access URLs

- Dashboard: `http://192.168.100.222:3000`
- Mobile Sender: `https://192.168.100.222:8443`
- Backend API: `https://192.168.100.222:5443`

---

## Default Credentials

- Username: `admin`
- Password: `admin123`
- **⚠️ CHANGE IMMEDIATELY!**

---

## User Roles

| Role | Can Do |
|------|--------|
| **Viewer** | View tracking only |
| **Operator** | View + Pin locations |
| **Manager** | View + Pin + Manage vehicles/POI |
| **Admin** | Everything + User management |

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Can't login | `docker compose restart backend` |
| Map not loading | Clear browser cache (Ctrl+Shift+R) |
| Container down | `docker compose up -d` |
| Out of space | `./maintenance.sh` → cleanup |
| Forgot password | `./manage-user.sh` → Option 4 |

---

## File Locations

- Application: `~/gps-tracker-final/`
- Backups: `~/gps-tracker-backups/`
- Logs: `docker compose logs [service]`
- Database: Inside container (use pg_dump)

---

## Support Contacts

- Documentation: `~/gps-tracker-final/INSTALLATION_MANUAL.md`
- Troubleshooting: `~/gps-tracker-final/TROUBLESHOOTING.md`
- Features: `~/gps-tracker-final/FEATURES.md`

---

**Print this and keep handy!**
