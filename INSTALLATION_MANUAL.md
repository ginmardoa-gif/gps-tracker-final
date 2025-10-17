# GPS Tracker System - Complete Installation & User Manual

**Version:** 1.0  
**Server IP:** 192.168.100.222  
**Last Updated:** October 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Installation](#initial-installation)
4. [File Structure](#file-structure)
5. [Configuration Files](#configuration-files)
6. [Starting the System](#starting-the-system)
7. [Accessing the System](#accessing-the-system)
8. [User Guide](#user-guide)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)
11. [Backup & Restore](#backup--restore)
12. [Security Best Practices](#security-best-practices)

---

## System Overview

### What This System Does

- **Real-time GPS Tracking** - Track up to 5 vehicles simultaneously
- **Web Dashboard** - View all vehicles on an interactive map
- **Mobile GPS Sender** - Use any smartphone to send location data
- **Historical Routes** - View breadcrumb trails of vehicle movements
- **Auto-Stop Detection** - Automatically saves locations where vehicles stop for 5+ minutes
- **Manual Location Saving** - Pin and annotate important locations
- **Statistics & Reporting** - View distance traveled, speeds, and export data
- **User Authentication** - Secure login system for dashboard access

### Technology Stack

- **Backend:** Python 3.11 + Flask
- **Database:** PostgreSQL 15
- **Frontend:** React + Vite + Tailwind CSS
- **Maps:** Leaflet.js + OpenStreetMap
- **Containerization:** Docker + Docker Compose
- **Security:** HTTPS with self-signed SSL certificates

---

## Prerequisites

### System Requirements

- **Operating System:** Linux (Ubuntu 20.04+ recommended)
- **RAM:** Minimum 2GB (4GB recommended)
- **CPU:** 2 cores minimum
- **Storage:** 10GB free space
- **Network:** Static IP address configured

### Software Requirements

- Docker Engine 20.10+
- Docker Compose v2.0+
- OpenSSL (for SSL certificates)

### Network Requirements

- Server must have static IP: **192.168.100.222**
- Ports required:
  - 3000 (Dashboard HTTP)
  - 5000 (Backend HTTP)
  - 5443 (Backend HTTPS)
  - 5432 (PostgreSQL - internal only)
  - 8080 (Mobile HTTP)
  - 8443 (Mobile HTTPS)

---

## Initial Installation

### Step 1: Prepare Directory Structure
```bash
cd ~
mkdir gps-tracker-final
cd gps-tracker-final
mkdir -p backend/app
mkdir -p frontend/src/components
mkdir -p mobile
mkdir -p ssl
mkdir -p database
```

### Step 2: Generate SSL Certificates
```bash
cd ~/gps-tracker-final/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=SR/ST=Paramaribo/L=Paramaribo/O=GPS-Tracker/CN=192.168.100.222"
cd ..
```

### Step 3: Create All Configuration Files

Create the following files with their exact content:

#### `.env`
```env
# Database Configuration
POSTGRES_USER=gpsadmin
POSTGRES_PASSWORD=gpspassword123
POSTGRES_DB=gps_tracker
DATABASE_URL=postgresql://gpsadmin:gpspassword123@db:5432/gps_tracker

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production-12345

# Server Configuration
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: gps_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: gps_backend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      FLASK_ENV: ${FLASK_ENV}
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "${BACKEND_PORT}:5000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/app:/app/app
    restart: unless-stopped

  backend-proxy:
    image: nginx:alpine
    container_name: gps_backend_proxy
    ports:
      - "5443:5443"
    volumes:
      - ./backend-proxy.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: gps_frontend
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - backend
    restart: unless-stopped

  mobile:
    build: ./mobile
    container_name: gps_mobile
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped

volumes:
  postgres_data:
```

#### `backend-proxy.conf`
```nginx
server {
    listen 5443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
    }
}
```

### Step 4: Create Backend Files

See full file contents in the [Configuration Files](#configuration-files) section below.

Required files:
- `backend/requirements.txt`
- `backend/Dockerfile`
- `backend/app/__init__.py`
- `backend/app/config.py`
- `backend/app/models.py`
- `backend/app/main.py`

### Step 5: Create Frontend Files

Required files:
- `frontend/package.json`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/Login.jsx`
- `frontend/src/components/Map.jsx`
- `frontend/src/components/VehicleList.jsx`
- `frontend/src/components/VehicleHistory.jsx`
- `frontend/src/components/VehicleStats.jsx`

### Step 6: Create Mobile Files

Required files:
- `mobile/index.html`
- `mobile/nginx-https.conf`
- `mobile/Dockerfile`

---

## File Structure
```
gps-tracker-final/
├── .env
├── docker-compose.yml
├── backend-proxy.conf
├── ssl/
│   ├── cert.pem
│   └── key.pem
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── config.py
│       ├── models.py
│       └── main.py
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── index.css
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── Login.jsx
│           ├── Map.jsx
│           ├── VehicleList.jsx
│           ├── VehicleHistory.jsx
│           └── VehicleStats.jsx
└── mobile/
    ├── Dockerfile
    ├── nginx-https.conf
    └── index.html
```

---

## Configuration Files

### Critical CORS Configuration

In `backend/app/main.py`, the CORS configuration MUST include mobile app origin:
```python
CORS(app, 
     supports_credentials=True, 
     origins=[
         'http://192.168.100.222:3000',
         'https://192.168.100.222:8443',
         'http://192.168.100.222:8080'
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
```

**This is essential for mobile app to work!**

---

## Starting the System

### First Time Setup
```bash
cd ~/gps-tracker-final
docker compose down -v  # Clean any previous installations
docker compose up -d --build
```

**Wait 5-10 minutes for all services to build and start.**

### Check Status
```bash
docker compose ps
```

All containers should show "Up" status.

### View Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs mobile

# Follow logs in real-time
docker compose logs -f backend
```

### Verify Installation
```bash
# Test backend HTTP
curl http://192.168.100.222:5000/api/health

# Test backend HTTPS
curl -k https://192.168.100.222:5443/api/health

# Expected response:
# {"message":"GPS Tracker API is running","status":"healthy"}
```

---

## Accessing the System

### Dashboard (Computer)

**URL:** `http://192.168.100.222:3000`

**Default Login:**
- Username: `admin`
- Password: `admin123`

**Features:**
- View all vehicles on map
- Click vehicle to see historical route
- Edit/delete saved locations
- View statistics
- Export data (CSV/JSON)

### Mobile GPS Sender (Smartphone)

**URL:** `https://192.168.100.222:8443`

**Steps:**
1. Open URL in phone browser (Chrome/Safari)
2. Accept security warning (self-signed certificate)
3. Server URL auto-fills: `https://192.168.100.222:5443`
4. Select a vehicle (1-5)
5. Choose update interval
6. Click "Start Tracking"
7. Allow GPS permissions when prompted

**No login required for sending GPS data.**

---

## User Guide

### Creating New Users

1. Access dashboard: `http://192.168.100.222:3000`
2. Click "Don't have an account? Sign up"
3. Enter username, email, password
4. Click "Sign Up"
5. Login with new credentials

### Tracking a Vehicle

**On Mobile:**
1. Open `https://192.168.100.222:8443`
2. Select vehicle number
3. Click "Start Tracking"
4. App shows:
   - Updates Sent counter
   - Current Speed
   - GPS coordinates
   - Accuracy

**On Dashboard:**
1. Login to dashboard
2. Vehicle appears on map (colored dot)
3. Click vehicle name in sidebar to:
   - View detailed route history
   - See saved locations
   - View statistics

### Saving Important Locations

**Method 1: Manual Save (Mobile)**
1. While tracking, click "📍 Save Current Location"
2. Enter location name
3. Add optional notes
4. Location appears in dashboard

**Method 2: Auto-Detection**
- Vehicle automatically saves location after stopping for 5+ minutes
- Appears as "Auto-detected Stop" with duration

**Method 3: Dashboard (Future Feature)**
- Click directly on map to save location

### Viewing Historical Routes

1. Click vehicle in sidebar
2. Select history duration:
   - Last 1 hour
   - Last 6 hours
   - Last 24 hours
   - Last 3 days
   - Last 7 days
3. Map shows:
   - Blue line (route trail)
   - Small dots (GPS points)
   - Yellow pins (saved locations)

### Editing Saved Locations

1. Select vehicle
2. Scroll to "Saved Locations" panel
3. Click "Edit" on any location
4. Modify name or notes
5. Click "Save"

### Deleting Saved Locations

1. Select vehicle
2. Click "Delete" on location
3. Confirm deletion

### Viewing Statistics

Statistics panel shows:
- **Data Points:** Number of GPS updates received
- **Distance:** Total distance traveled (km)
- **Avg Speed:** Average speed (km/h)
- **Max Speed:** Maximum speed recorded (km/h)

### Exporting Data

1. Select vehicle
2. Choose history duration
3. Click export format:
   - **JSON:** Machine-readable format
   - **CSV:** Spreadsheet format (Excel, Google Sheets)

CSV includes:
- Timestamp
- Latitude
- Longitude
- Speed

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs [service-name]
```

**Common issues:**
- Port already in use
- Missing files
- Configuration errors

**Solution:**
```bash
docker compose down
docker compose up -d --build
```

### Backend API Not Responding

**Test connection:**
```bash
curl http://localhost:5000/api/health
```

**Check backend logs:**
```bash
docker compose logs backend --tail 50
```

**Common issues:**
- Database not ready
- CORS misconfiguration
- Port binding issues

### Mobile App "Failed to Send Data"

**Checklist:**
1. Check backend is running: `docker compose ps`
2. Test backend: `curl -k https://192.168.100.222:5443/api/health`
3. Verify CORS configuration in `backend/app/main.py`
4. Check backend logs: `docker compose logs backend -f`
5. Ensure phone on same network (192.168.100.0/24)

**CORS Fix:**
Ensure `backend/app/main.py` includes mobile app origin:
```python
origins=[
    'http://192.168.100.222:3000',
    'https://192.168.100.222:8443',  # Mobile HTTPS
    'http://192.168.100.222:8080'   # Mobile HTTP
]
```

### Dashboard Login Fails

**Test backend auth:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Check if default user was created:**
```bash
docker compose logs backend | grep "admin user"
```

Should show: "Created default admin user"

**Reset database (WARNING: Deletes all data):**
```bash
docker compose down -v
docker compose up -d
```

### Map Not Loading

**Check browser console:**
- Press F12
- Look for errors in Console tab

**Common issues:**
- Network requests blocked
- Component failed to load
- API endpoints unreachable

**Solution:**
```bash
docker compose restart frontend
```

### SSL Certificate Errors on Mobile

**Expected behavior:** Browser shows security warning for self-signed certificate.

**Steps:**
1. Click "Advanced" or "Details"
2. Click "Proceed to 192.168.100.222" or "Accept Risk"
3. This is safe - it's your own certificate

**For production:** Use Let's Encrypt for valid certificates.

### Database Connection Issues

**Check database status:**
```bash
docker compose logs db --tail 50
```

**Test connection:**
```bash
docker compose exec db psql -U gpsadmin -d gps_tracker -c "SELECT 1;"
```

**Reset database:**
```bash
docker compose down -v
docker compose up -d
```

---

## Maintenance

### Routine Maintenance Tasks

#### Daily
- Monitor disk space: `df -h`
- Check container health: `docker compose ps`

#### Weekly
- Review logs for errors: `docker compose logs --tail 100`
- Verify backups are working
- Check database size: `docker compose exec db psql -U gpsadmin -d gps_tracker -c "SELECT pg_size_pretty(pg_database_size('gps_tracker'));"`

#### Monthly
- Update system packages: `apt update && apt upgrade`
- Review and archive old tracking data
- Rotate logs if needed

### Starting/Stopping Services
```bash
# Start all services
docker compose up -d

# Stop all services (keeps data)
docker compose down

# Restart specific service
docker compose restart backend

# Restart all services
docker compose restart

# View status
docker compose ps
```

### Updating the System

**After modifying code:**
```bash
cd ~/gps-tracker-final

# Rebuild specific service
docker compose up -d --build backend

# Or rebuild everything
docker compose up -d --build

# View logs to verify
docker compose logs -f
```

### Viewing Logs
```bash
# All logs
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Last 50 lines
docker compose logs backend --tail 50

# Follow in real-time
docker compose logs -f backend

# All services, real-time
docker compose logs -f
```

### Cleaning Up
```bash
# Remove stopped containers
docker compose down

# Remove containers and volumes (DELETES ALL DATA)
docker compose down -v

# Remove unused images
docker image prune -a

# Remove everything (CAUTION)
docker system prune -a --volumes
```

---

## Backup & Restore

### Backup Database

**Create backup directory:**
```bash
mkdir -p ~/gps-tracker-backups
```

**Backup database:**
```bash
docker compose exec db pg_dump -U gpsadmin gps_tracker > ~/gps-tracker-backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated daily backups (crontab):**
```bash
crontab -e

# Add this line:
0 2 * * * cd ~/gps-tracker-final && docker compose exec -T db pg_dump -U gpsadmin gps_tracker > ~/gps-tracker-backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### Restore Database

**Stop containers:**
```bash
docker compose down
```

**Start only database:**
```bash
docker compose up -d db
```

**Wait 10 seconds, then restore:**
```bash
cat ~/gps-tracker-backups/backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T db psql -U gpsadmin gps_tracker
```

**Start all services:**
```bash
docker compose up -d
```

### Backup Configuration Files
```bash
# Create backup
tar -czf ~/gps-tracker-config-backup_$(date +%Y%m%d).tar.gz \
  ~/gps-tracker-final/.env \
  ~/gps-tracker-final/docker-compose.yml \
  ~/gps-tracker-final/backend-proxy.conf \
  ~/gps-tracker-final/ssl/

# List backups
ls -lh ~/gps-tracker-config-backup*.tar.gz
```

### Full System Backup
```bash
# Stop services
docker compose down

# Backup everything
tar -czf ~/gps-tracker-full-backup_$(date +%Y%m%d).tar.gz \
  ~/gps-tracker-final/

# Restart services
cd ~/gps-tracker-final
docker compose up -d
```

### Restore Full System
```bash
# Extract backup
tar -xzf ~/gps-tracker-full-backup_YYYYMMDD.tar.gz -C ~/

# Start services
cd ~/gps-tracker-final
docker compose up -d
```

---

## Security Best Practices

### Change Default Credentials

**1. Change Admin Password:**
- Login to dashboard
- Create new admin user with strong password
- Delete or disable default admin account

**2. Change Database Password:**
Edit `.env` file:
```env
POSTGRES_PASSWORD=your-new-strong-password-here
DATABASE_URL=postgresql://gpsadmin:your-new-strong-password-here@db:5432/gps_tracker
```

Rebuild:
```bash
docker compose down -v
docker compose up -d --build
```

**3. Change Secret Key:**
Edit `.env` file:
```env
SECRET_KEY=generate-a-long-random-string-here-at-least-32-characters
```

Generate strong key:
```bash
openssl rand -hex 32
```

### Production SSL Certificates

For production use, replace self-signed certificates with Let's Encrypt:
```bash
# Install certbot
apt install certbot

# Generate certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/gps-tracker-final/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/gps-tracker-final/ssl/key.pem

# Restart services
docker compose restart backend-proxy mobile
```

### Firewall Configuration

**If using UFW:**
```bash
# Allow required ports
sudo ufw allow 3000/tcp  # Dashboard
sudo ufw allow 5000/tcp  # Backend HTTP
sudo ufw allow 5443/tcp  # Backend HTTPS
sudo ufw allow 8443/tcp  # Mobile HTTPS

# Enable firewall
sudo ufw enable
```

### Network Security

- Use VPN for remote access
- Restrict access by IP if possible
- Use strong passwords for all accounts
- Enable HTTPS for all external access
- Keep system and Docker updated

### Regular Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

---

## System Specifications

### Default Ports

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Dashboard | 3000 | HTTP | Web UI |
| Backend API | 5000 | HTTP | Internal API |
| Backend API | 5443 | HTTPS | External API |
| PostgreSQL | 5432 | TCP | Database (internal) |
| Mobile App | 8080 | HTTP | Mobile redirect |
| Mobile App | 8443 | HTTPS | Mobile GPS sender |

### Default Credentials

**Dashboard:**
- Username: `admin`
- Password: `admin123`

**Database:**
- User: `gpsadmin`
- Password: `gpspassword123`
- Database: `gps_tracker`

**⚠️ CHANGE THESE IN PRODUCTION!**

### Vehicles

5 pre-configured vehicles:
- Vehicle 1: `device_1`
- Vehicle 2: `device_2`
- Vehicle 3: `device_3`
- Vehicle 4: `device_4`
- Vehicle 5: `device_5`

---

## API Endpoints

### Public Endpoints (No Auth)
```
GET  /api/health              - Health check
POST /api/gps                 - Receive GPS data
POST /api/auth/login          - User login
POST /api/auth/register       - User registration
GET  /api/auth/check          - Check auth status
```

### Protected Endpoints (Requires Auth)
```
GET    /api/vehicles                                    - List all vehicles
GET    /api/vehicles/:id/location                       - Get last location
GET    /api/vehicles/:id/history                        - Get location history
GET    /api/vehicles/:id/saved-locations                - Get saved locations
POST   /api/vehicles/:id/saved-locations                - Save location
PUT    /api/vehicles/:id/saved-locations/:loc_id        - Update location
DELETE /api/vehicles/:id/saved-locations/:loc_id        - Delete location
GET    /api/vehicles/:id/stats                          - Get statistics
GET    /api/vehicles/:id/export                         - Export data
POST   /api/auth/logout                                 - Logout
```

---

## Frequently Asked Questions

### Q: Can I add more vehicles?

**A:** Yes. Edit `backend/app/main.py` and add more vehicles in the initialization section:
```python
if Vehicle.query.count() == 0:
    for i in range(1, 11):  # Change 6 to 11 for 10 vehicles
        vehicle = Vehicle(name=f'Vehicle {i}', device_id=f'device_{i}')
        db.session.add(vehicle)
```

Also update `mobile/index.html` to add more options in the vehicle selector.

### Q: How do I change the server IP?

**A:** You must update the IP in multiple places:

1. SSL certificate (regenerate)
2. `backend/app/main.py` (CORS origins)
3. `mobile/index.html` (auto-fill URL)

Then rebuild all containers.

### Q: Can I use a domain name instead of IP?

**A:** Yes! Update all references to `192.168.100.222` with your domain name, then get proper SSL certificates using Let's Encrypt.

### Q: How much data does GPS tracking use?

**A:** Approximately:
- 5 second interval: ~100 KB per hour
- 10 second interval: ~50 KB per hour
- 30 second interval: ~17 KB per hour

### Q: Can multiple users login simultaneously?

**A:** Yes! Each user gets their own session. Create separate accounts for each user.

### Q: How do I delete old tracking data?

**A:** Connect to database:
```bash
docker compose exec db psql -U gpsadmin gps_tracker

-- Delete locations older than 30 days
DELETE FROM locations WHERE timestamp < NOW() - INTERVAL '30 days';

-- Delete auto-detected stops older than 30 days
DELETE FROM saved_locations WHERE timestamp < NOW() - INTERVAL '30 days' AND visit_type = 'auto_detected';

-- Exit
\q
```

### Q: Can I track devices on different networks?

**A:** Yes, but you need to:
1. Forward ports through your router
2. Use your public IP or domain name
3. Use proper SSL certificates
4. Configure firewall rules

### Q: How accurate is the GPS tracking?

**A:** Accuracy depends on:
- Phone GPS quality (typically 5-20 meters)
- Signal strength
- Environment (urban/rural)
- Weather conditions

The system displays accuracy in meters on mobile app.

---

## Support & Resources

### Log Locations
```bash
# Docker logs
docker compose logs [service]

# System logs
/var/log/syslog
```

### Useful Commands Reference
```bash
# System info
docker compose ps                          # Container status
docker compose logs [service]              # View logs
docker stats                               # Resource usage

# Service management
docker compose up -d                       # Start all
docker compose down                        # Stop all
docker compose restart [service]           # Restart service
docker compose up -d --build               # Rebuild and start

# Database
docker compose exec db psql -U gpsadmin gps_tracker  # Connect to DB
docker compose exec db pg_dump -U gpsadmin gps_tracker > backup.sql  # Backup

# Cleanup
docker compose down -v                     # Remove with data
docker system prune -a                     # Clean all unused
```

### Configuration File Locations
```
~/gps-tracker-final/.env                   # Environment variables
~/gps-tracker-final/docker-compose.yml     # Container orchestration
~/gps-tracker-final/backend/app/main.py    # Backend logic & CORS
~/gps-tracker-final/ssl/                   # SSL certificates
```

---

## Version History

**v1.0 - October 2025**
- Initial release
- 5 vehicle support
- Real-time tracking
- Historical routes
- Auto-stop detection
- Manual location saving
- User authentication
- Statistics & export
- HTTPS security

---

## License & Credits

**Built with:**
- Flask (Python web framework)
- React (JavaScript UI library)
- PostgreSQL (Database)
- Leaflet.js (Mapping library)
- OpenStreetMap (Map tiles)
- Docker (Containerization)

**Map Data:** © OpenStreetMap contributors

---

## Emergency Procedures

### System Completely Broken
```bash
# Stop everything
docker compose down -v

# Remove all containers, images, volumes
docker system prune -a --volumes

# Restore from backup
tar -xzf ~/gps-tracker-full-backup_YYYYMMDD.tar.gz -C ~/

# Rebuild
cd ~/gps-tracker-final
docker compose up -d --build
```

### Database Corrupted
```bash
# Stop services
docker compose down

# Remove database volume
docker volume rm gps-tracker-final_postgres_data

# Start services (creates fresh database)
docker compose up -d

# Restore from backup
cat ~/gps-tracker-backups/backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T db psql -U gpsadmin gps_tracker
```

### Forgot Admin Password
```bash
# Access database
docker compose exec db psql -U gpsadmin gps_tracker

# Reset admin password to 'newpassword123'
# First, generate hash in Python:
docker compose exec backend python -c "from flask_bcrypt import Bcrypt; print(Bcrypt().generate_password_hash('newpassword123').decode('utf-8'))"

# Copy the output hash, then in psql:
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'admin';
\q
```

---

**END OF MANUAL**

*For additional support, refer to the Docker and Flask documentation.*

---
