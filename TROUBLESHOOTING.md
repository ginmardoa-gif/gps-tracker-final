# Quick Troubleshooting Guide

## Problem: Mobile app says "Failed to send data"

**Solution:**
```bash
# 1. Check CORS configuration
nano backend/app/main.py

# Ensure origins includes:
# 'https://192.168.100.222:8443'

# 2. Restart backend
docker compose restart backend backend-proxy

# 3. Test backend
curl -k https://192.168.100.222:5443/api/health
```

---

## Problem: Dashboard won't login

**Solution:**
```bash
# 1. Test backend
curl http://localhost:5000/api/health

# 2. Check logs
docker compose logs backend --tail 50

# 3. Verify default user exists
docker compose logs backend | grep "admin user"

# 4. Reset database (DELETES DATA)
docker compose down -v
docker compose up -d
```

---

## Problem: Container won't start

**Solution:**
```bash
# 1. Check specific container logs
docker compose logs [container-name]

# 2. Check port conflicts
netstat -tulpn | grep -E '3000|5000|5443|8443'

# 3. Rebuild
docker compose down
docker compose up -d --build
```

---

## Problem: Map not loading

**Solution:**
```bash
# 1. Check browser console (F12)
# 2. Restart frontend
docker compose restart frontend

# 3. Clear browser cache
# 4. Check if backend is accessible
curl http://192.168.100.222:5000/api/health
```

---

## Problem: GPS not accurate

**Causes:**
- Phone GPS quality
- Indoor location
- Poor signal
- Weather

**Check accuracy:** Mobile app shows accuracy in meters

---

## Problem: Database full

**Solution:**
```bash
# Check size
docker compose exec db psql -U gpsadmin gps_tracker -c "SELECT pg_size_pretty(pg_database_size('gps_tracker'));"

# Delete old data (30+ days)
docker compose exec db psql -U gpsadmin gps_tracker -c "DELETE FROM locations WHERE timestamp < NOW() - INTERVAL '30 days';"
```

---

## Problem: Forgot password

**Solution:**
```bash
# Generate new password hash
docker compose exec backend python -c "from flask_bcrypt import Bcrypt; print(Bcrypt().generate_password_hash('newpassword').decode('utf-8'))"

# Update in database
docker compose exec db psql -U gpsadmin gps_tracker
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'admin';
\q
```

---

## Emergency Reset

**Complete reset (DELETES ALL DATA):**
```bash
docker compose down -v
docker system prune -a --volumes -f
cd ~/gps-tracker-final
docker compose up -d --build
```

---

## Useful Commands
```bash
# Check everything
docker compose ps
docker compose logs --tail 50

# Test connectivity
curl http://192.168.100.222:5000/api/health
curl -k https://192.168.100.222:5443/api/health

# Restart everything
docker compose restart

# View real-time logs
docker compose logs -f backend
```

---

## Getting Help

1. Check logs: `docker compose logs [service]`
2. Review INSTALLATION_MANUAL.md
3. Check container status: `docker compose ps`
4. Test API endpoints with curl
5. Review browser console (F12)
