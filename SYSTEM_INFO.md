# GPS Tracker System Information

## Installation Details

**Installation Date:** October 17, 2025
**Version:** 1.0 (Production Ready)
**Server IP:** 192.168.100.222

---

## System Architecture
```
┌─────────────────────────────────────────────────┐
│                   Users/Clients                  │
│  (Web Browsers, Mobile Devices)                 │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    HTTP:3000            HTTPS:8443/5443
        │                     │
┌───────▼────────┐    ┌───────▼────────┐
│    Frontend    │    │  Backend Proxy │
│   (React SPA)  │    │     (Nginx)    │
│   Port: 80     │    │  Ports: 5443,  │
│                │    │        8443     │
└────────────────┘    └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │    Backend     │
                      │  (Flask API)   │
                      │   Port: 5000   │
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │   PostgreSQL   │
                      │   Database     │
                      │   Port: 5432   │
                      └────────────────┘
```

---

## Container Services

| Container | Purpose | Port | Technology |
|-----------|---------|------|------------|
| frontend | Web Dashboard UI | 3000 | React, Leaflet.js |
| backend | REST API Server | 5000 | Flask, SQLAlchemy |
| backend-proxy | HTTPS Proxy | 5443, 8443 | Nginx, SSL/TLS |
| db | Database | 5432 | PostgreSQL 15 |

---

## Database Schema

### Tables

**users**
- id, username, email, password_hash, role, is_active, created_at

**vehicles**
- id, name, device_id, is_active, created_at

**locations**
- id, vehicle_id, latitude, longitude, speed, accuracy, battery_level, timestamp

**saved_locations**
- id, vehicle_id, name, latitude, longitude, visit_type, stop_duration_minutes, notes, timestamp

**places_of_interest**
- id, name, address, latitude, longitude, category, description, created_by, created_at

---

## API Endpoints

### Authentication
- POST `/api/auth/register` - Create new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/check` - Check authentication status

### Vehicles
- GET `/api/vehicles` - List all vehicles
- POST `/api/vehicles` - Create vehicle
- GET `/api/vehicles/<id>/location` - Get latest location
- GET `/api/vehicles/<id>/history` - Get location history
- PUT `/api/vehicles/<id>` - Update vehicle
- DELETE `/api/vehicles/<id>` - Delete vehicle

### Locations
- POST `/api/locations` - Submit GPS location (from mobile)
- GET `/api/vehicles/<id>/saved-locations` - Get saved locations
- POST `/api/saved-locations` - Save location manually
- GET `/api/vehicles/<id>/stats` - Get vehicle statistics
- GET `/api/vehicles/<id>/export` - Export location data (CSV)

### Places of Interest
- GET `/api/places-of-interest` - List all POI
- POST `/api/places-of-interest` - Create POI
- PUT `/api/places-of-interest/<id>` - Update POI
- DELETE `/api/places-of-interest/<id>` - Delete POI
- GET `/api/geocode` - Geocode address search

### Users (Admin Only)
- GET `/api/users` - List all users
- PUT `/api/users/<id>` - Update user
- DELETE `/api/users/<id>` - Delete user

---

## File Structure
```
~/gps-tracker-final/
├── docker-compose.yml          # Container orchestration
├── .env                         # Environment variables
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # Flask application
│       └── models.py           # Database models
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Main application
│       └── components/         # React components
├── mobile/
│   └── index.html              # Mobile GPS sender
├── ssl/
│   ├── cert.pem                # SSL certificate
│   └── key.pem                 # SSL private key
├── backend-proxy.conf          # Nginx configuration
├── database/                    # PostgreSQL data (volume)
└── Scripts:
    ├── backup.sh               # Backup system
    ├── restore.sh              # Restore from backup
    ├── maintenance.sh          # System maintenance
    ├── update.sh               # Update system
    ├── status.sh               # System status
    └── manage-user.sh          # User management
```

---

## Network Ports

| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 3000 | Dashboard UI | HTTP | Internal/External |
| 5000 | Backend API | HTTP | Internal only |
| 5432 | PostgreSQL | TCP | Internal only |
| 5443 | Backend HTTPS | HTTPS | External (API) |
| 8443 | Mobile Sender | HTTPS | External (GPS) |

---

## Storage Locations

- **Database Data:** Docker volume `gps-tracker-final_database`
- **Backups:** `~/gps-tracker-backups/`
- **Application Code:** `~/gps-tracker-final/`
- **Logs:** `docker compose logs [service]`

---

## Dependencies

### Backend (Python)
- Flask 2.3.0
- Flask-SQLAlchemy 3.0.0
- Flask-Login 0.6.2
- Flask-Bcrypt 1.0.1
- Flask-CORS 4.0.0
- psycopg2-binary 2.9.6

### Frontend (Node.js)
- React 18.2.0
- React-Leaflet 4.2.1
- Leaflet 1.9.4
- Recharts 2.5.0

### Database
- PostgreSQL 15

### Proxy
- Nginx 1.24

---

## Security Features

- ✅ HTTPS/TLS encryption (self-signed)
- ✅ Password hashing (bcrypt)
- ✅ SQL injection protection (SQLAlchemy ORM)
- ✅ XSS protection (React automatic escaping)
- ✅ CORS configuration
- ✅ Session security (Flask-Login)
- ✅ Role-based access control
- ✅ Input validation

---

## Performance Characteristics

### Expected Load Capacity
- **Vehicles:** Up to 100 concurrent
- **GPS Updates:** 10-second intervals per vehicle
- **Users:** Up to 50 concurrent dashboard users
- **Database:** ~1GB per 100,000 location points

### Resource Usage (typical)
- **CPU:** 10-20% average (2 cores)
- **RAM:** 500MB-1GB total
- **Disk I/O:** Minimal (mostly database writes)
- **Network:** <100 KB/s per vehicle

---

## Backup Strategy

- **Frequency:** Daily automated (2 AM)
- **Retention:** 30 days
- **Location:** `~/gps-tracker-backups/`
- **Size:** ~10-50MB per backup (varies with data)
- **Contents:** Database + configuration

---

## Monitoring Recommendations

### Daily Checks
- Container status (`docker compose ps`)
- Recent errors (`docker compose logs backend | grep ERROR`)
- Disk space (`df -h`)

### Weekly Checks
- System status (`./status.sh`)
- Backup verification
- Database size

### Monthly Tasks
- System maintenance (`./maintenance.sh`)
- User account review
- Security updates

---

## Support Resources

- Installation Manual: `INSTALLATION_MANUAL.md`
- Quick Start: `QUICK_START.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- Features: `FEATURES.md`
- Admin Reference: `ADMIN_QUICK_REFERENCE.md`

---

**Document Version:** 1.0  
**Last Updated:** October 17, 2025  
**Maintained By:** System Administrator
