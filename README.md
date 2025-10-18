# GPS Tracker System

Real-time GPS tracking system with web dashboard and mobile GPS sender.

## Quick Start
```bash
docker compose up -d --build
```

**Dashboard:** http://192.168.100.222:3000 (Login: admin/admin123)  
**Mobile:** https://192.168.100.222:8443

## Documentation

- **[Full Installation Manual](INSTALLATION_MANUAL.md)** - Complete guide with all details
- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes

## Useful Scripts
```bash
./backup.sh              # Create complete backup
./restore.sh DATE        # Restore from backup
./maintenance.sh         # System maintenance & cleanup
./update.sh              # Update system
./status.sh              # View system status
./manage-user.sh         # User management helper
```

### Script Descriptions

- **backup.sh** - Creates timestamped backups of database and configuration
- **restore.sh** - Restores system from a previous backup
- **maintenance.sh** - Checks system health and cleans old data
- **update.sh** - Updates containers to latest versions
- **status.sh** - Shows detailed system status and statistics
- **manage-user.sh** - Interactive user management (create, edit, delete users)

## Common Commands
```bash
docker compose ps              # Check status
docker compose logs -f         # View logs
docker compose restart         # Restart all
docker compose down            # Stop all
```

## Features

### Core Tracking
- ✅ Real-time GPS tracking with 10-second updates
- ✅ Web dashboard with interactive maps
- ✅ Mobile GPS sender (works in any browser)
- ✅ Historical route playback
- ✅ Auto-stop detection
- ✅ Manual location saving

### Vehicle Management
- ✅ Multiple vehicle support
- ✅ Active/Inactive vehicle filtering
- ✅ Real-time location updates
- ✅ Vehicle-specific history tracking
- ✅ Statistics and analytics

### Places of Interest (POI)
- ✅ Save important locations
- ✅ Address search with geocoding
- ✅ Click-to-pin on map
- ✅ Category organization
- ✅ Visual markers on map

### User Management & Security
- ✅ Role-based access control (Admin, Manager, Operator, Viewer)
- ✅ User authentication
- ✅ Permission-based features
- ✅ HTTPS security
- ✅ Session management

### Data & Export
- ✅ Statistics & analytics
- ✅ CSV export functionality
- ✅ Historical data retention
- ✅ Automated backups

## User Roles

| Role | Description | Use Case |
|------|-------------|----------|
| **Admin** | Full system access | IT staff, system administrators |
| **Manager** | Manage vehicles & POI | Fleet managers, supervisors |
| **Operator** | Track & pin locations | Dispatchers, operations team |
| **Viewer** | Read-only access | Clients, stakeholders |

## Support

See [INSTALLATION_MANUAL.md](INSTALLATION_MANUAL.md) for detailed troubleshooting and configuration.

## System Requirements

- Linux with Docker
- 2GB RAM minimum
- 2 CPU cores
- 10GB storage

## License

Built with open-source components: Flask, React, PostgreSQL, Leaflet.js, OpenStreetMap
