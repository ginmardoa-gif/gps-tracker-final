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

## Problem: User can't access Admin panel

**Symptoms:**
- User doesn't see "Admin" button
- "Access Denied" when trying to access admin features

**Solution:**

**Check user role:**
```bash
docker compose exec backend python -c "
from app.models import db, User
from app.main import app
with app.app_context():
    username = input('Enter username: ')
    user = User.query.filter_by(username=username).first()
    if user:
        print(f'Username: {user.username}')
        print(f'Role: {user.role}')
        print(f'Active: {user.is_active}')
"
```

**Update user role:**
```bash
docker compose exec backend python -c "
from app.models import db, User
from app.main import app
with app.app_context():
    username = input('Enter username: ')
    new_role = input('Enter new role (admin/manager/operator/viewer): ')
    user = User.query.filter_by(username=username).first()
    if user:
        user.role = new_role
        db.session.commit()
        print(f'Updated {username} to role: {new_role}')
"
```

**Role permissions:**
- Admin panel access: `admin`, `manager`
- User management: `admin` only
- Vehicle/POI management: `admin`, `manager`
- Pin locations: `admin`, `manager`, `operator`
- View tracking: All roles

---

## Problem: Inactive vehicles not showing

**Solution:**

The inactive vehicles filter is working correctly. Check:

1. Go to Admin → Vehicles
2. Click **"Inactive (X)"** button at top
3. Only inactive vehicles will show
4. Click **"All (X)"** to see everything

**Toggle vehicle status:**
- Click on the status badge (Active/Inactive) to toggle

---

## Problem: Manager can see Users tab

**This should NOT happen.** If it does:
```bash
# Restart frontend to reload permissions
docker compose restart frontend

# Clear browser cache
# Ctrl + Shift + R (hard refresh)
```

Only admins should see the Users tab.

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
