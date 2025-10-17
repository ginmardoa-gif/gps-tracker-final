# GPS Tracker - Quick Start Guide

## Installation (5 Minutes)
```bash
cd ~/gps-tracker-final
docker compose down -v
docker compose up -d --build
```

Wait 5-10 minutes for build to complete.

## Access

**Dashboard:** http://192.168.100.222:3000  
Login: `admin` / `admin123`

**Mobile:** https://192.168.100.222:8443  
(Accept security warning)

## First Time Setup

1. **Dashboard:**
   - Open http://192.168.100.222:3000
   - Login with admin/admin123
   - Create new user account
   - Change admin password

2. **Mobile:**
   - Open https://192.168.100.222:8443
   - Select Vehicle 1
   - Click "Start Tracking"
   - Allow GPS permissions

3. **Watch It Work:**
   - Walk around with phone
   - See updates on dashboard
   - Click vehicle to view trail

## Common Commands
```bash
# Check status
docker compose ps

# View logs
docker compose logs backend -f

# Restart
docker compose restart

# Stop
docker compose down

# Start
docker compose up -d
```

## Troubleshooting

**Mobile app won't connect:**
- Check CORS in `backend/app/main.py`
- Must include: `'https://192.168.100.222:8443'`
- Restart: `docker compose restart backend`

**Dashboard won't login:**
- Test: `curl http://localhost:5000/api/health`
- Check logs: `docker compose logs backend`

**Full reset:**
```bash
docker compose down -v
docker compose up -d --build
```

## Support

See full manual: `~/gps-tracker-final/INSTALLATION_MANUAL.md`
