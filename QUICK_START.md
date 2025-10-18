# GPS Tracker - Quick Start Guide

Get your GPS tracking system running in **5 minutes**!

---

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Root or sudo access
- 2GB RAM minimum
- 10GB disk space

---

## 1. Install Docker (if not installed)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Logout and login again**, then verify:
```bash
docker --version
docker compose version
```

---

## 2. Create Project Directory
```bash
mkdir -p ~/gps-tracker-final
cd ~/gps-tracker-final
```

---

## 3. Create All Required Files

Follow the complete file creation from **INSTALLATION_MANUAL.md** sections:
- Docker Compose configuration
- Backend files (Dockerfile, requirements.txt, main.py, models.py)
- Frontend files (Dockerfile, package.json, App.jsx, all components)
- Mobile sender (index.html)
- SSL certificates
- Nginx configuration

**OR** if you have the complete project archive:
```bash
tar -xzf gps-tracker-complete.tar.gz
cd gps-tracker-final
```

---

## 4. Generate SSL Certificates
```bash
mkdir -p ssl
cd ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -subj "/C=SR/ST=Paramaribo/L=Paramaribo/O=GPS-Tracker/CN=192.168.100.222"

cd ..
```

---

## 5. Start the System
```bash
docker compose up -d --build
```

**Wait 5-10 minutes** for all containers to build and start.

Check status:
```bash
docker compose ps
```

All containers should show "Up" status.

---

## 6. Access Dashboard

**Open browser and go to:**
```
http://192.168.100.222:3000
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`
- Role: `admin` (full access)

⚠️ **Change default password immediately!**

**To change password:**
1. Login as admin
2. Click "Admin" → "Users"
3. Click "Edit" next to admin user
4. Enter new password
5. Click "Update"

---

## 7. Create Additional Users

**As admin user:**

1. Click **"Admin"** button (top right)
2. Go to **"Users"** tab
3. Click **"Add User"**
4. Fill in:
   - Username
   - Email
   - Password
   - **Role** (choose based on access needs):
     - **Admin:** Full system access
     - **Manager:** Manage vehicles & places
     - **Operator:** Track & pin locations
     - **Viewer:** Read-only access
5. Click **"Add"**

**Recommended first users:**
- 1 Admin (yourself)
- 1-2 Managers (supervisors)
- 2-5 Operators (dispatchers)
- As many Viewers as needed (clients)

---

## 8. Add Vehicles

**Via Dashboard (Admin or Manager):**

1. Click **"Admin"** → **"Vehicles"** tab
2. Click **"Add Vehicle"**
3. Enter:
   - **Name:** e.g., "Delivery Van 1"
   - **Device ID:** e.g., "device_1"
   - Check **"Active"**
4. Click **"Add"**

**Note:** Device ID must match what you use in the mobile app!

Default vehicles created automatically:
- Vehicle 1 (device_1)
- Vehicle 2 (device_2)
- Vehicle 3 (device_3)
- Vehicle 4 (device_4)
- Vehicle 5 (device_5)

---

## 9. Start GPS Tracking (Mobile)

**On your phone/tablet:**

1. Open browser (Chrome on Android, Safari on iOS)
2. Go to: `https://192.168.100.222:8443`
3. Accept security warning (self-signed certificate)
4. Select vehicle from dropdown
5. Click **"Start Tracking"**
6. Allow location permissions when prompted
7. Keep browser open (can minimize)

**GPS data updates every 10 seconds automatically!**

---

## 10. View Live Tracking

**On Dashboard:**

1. Login at `http://192.168.100.222:3000`
2. Click **"Tracking"** button
3. See all active vehicles on map
4. Click a vehicle to:
   - View route history
   - See statistics
   - View saved locations
   - Export data

---

## Quick Test Checklist

✅ Dashboard loads at port 3000  
✅ Can login with admin/admin123  
✅ See vehicles list (Vehicle 1-5)  
✅ Mobile sender loads at port 8443  
✅ Can select device and start tracking  
✅ GPS locations appear on dashboard map  
✅ Can view vehicle history  
✅ Can create new users  
✅ Can add new vehicles  

---

## Next Steps

### Security Setup
1. **Change admin password** (Admin → Users → Edit admin)
2. **Create individual user accounts** for your team
3. **Assign appropriate roles** (viewer, operator, manager, admin)
4. **Update SSL certificates** for production use

### Add Features
1. **Add Places of Interest:**
   - Admin → Places of Interest → Add Place
   - Or use "Pin Location" button on map
2. **Save important locations** while tracking
3. **Set up automated backups:**
```bash
   cd ~/gps-tracker-final
   ./backup.sh
```

### Monitoring
1. **Check system status:**
```bash
   ./status.sh
```
2. **View logs:**
```bash
   docker compose logs -f backend
```
3. **Monitor disk space:**
```bash
   df -h
```

---

## Common Commands
```bash
# Start system
docker compose up -d

# Stop system
docker compose down

# Restart system
docker compose restart

# View logs
docker compose logs -f backend

# Check status
docker compose ps

# Create backup
./backup.sh

# View system status
./status.sh
```

---

## Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Dashboard** | http://192.168.100.222:3000 | Web interface |
| **Mobile Sender** | https://192.168.100.222:8443 | GPS tracking app |
| **Backend API** | https://192.168.100.222:5443 | API endpoint |

---

## User Roles Quick Reference

| Role | Can View Tracking | Can Pin Locations | Can Manage Vehicles | Can Manage Users |
|------|------------------|-------------------|--------------------|--------------------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ |
| **Operator** | ✅ | ✅ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

**Dashboard won't load:**
```bash
docker compose restart frontend
# Clear browser cache (Ctrl + Shift + R)
```

**Can't login:**
```bash
docker compose restart backend
# Check logs: docker compose logs backend
```

**Mobile sender certificate error:**
- Click "Advanced" → "Proceed anyway"
- This is normal for self-signed certificates

**GPS not updating:**
- Ensure phone location is enabled
- Keep mobile browser open
- Check internet connection
- Verify device_id matches vehicle

**Container not starting:**
```bash
docker compose logs [container-name]
docker compose down
docker compose up -d --build
```

---

## Get Help

- **Full Manual:** `INSTALLATION_MANUAL.md`
- **Troubleshooting Guide:** `TROUBLESHOOTING.md`
- **Feature List:** `FEATURES.md`
- **Admin Reference:** `ADMIN_QUICK_REFERENCE.md`

---

## System Requirements

**Minimum:**
- 2GB RAM
- 2 CPU cores
- 10GB disk space
- Linux OS with Docker

**Recommended:**
- 4GB RAM
- 4 CPU cores
- 50GB disk space
- Ubuntu 22.04 LTS
- Static IP address

---

## Production Deployment Tips

1. **Use proper SSL certificates** (Let's Encrypt)
2. **Set up automated backups** (daily cron job)
3. **Configure firewall** (UFW)
4. **Monitor disk space** regularly
5. **Keep system updated** (monthly)
6. **Use strong passwords** (12+ characters)
7. **Regular maintenance** (run ./maintenance.sh monthly)
8. **Store backups offsite** (separate server/cloud)

---

## Success Indicators

You'll know it's working when:

✅ All 4 containers are "Up"  
✅ Dashboard shows vehicle list  
✅ Mobile app sends GPS data  
✅ Map shows live vehicle locations  
✅ Route history displays correctly  
✅ Can create and manage users  
✅ Backups run successfully  

---

**🎉 Congratulations! Your GPS Tracker is ready!**

For detailed configuration and advanced features, see **INSTALLATION_MANUAL.md**

---

**Last Updated:** October 17, 2025  
**Version:** 1.0 (Production Ready)
