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
./backup.sh              # Create backup
./restore.sh DATE        # Restore from backup
./maintenance.sh         # System maintenance
./update.sh              # Update system
```

## Common Commands
```bash
docker compose ps              # Check status
docker compose logs -f         # View logs
docker compose restart         # Restart all
docker compose down            # Stop all
```

## Features

- ✅ Real-time GPS tracking
- ✅ Web dashboard with maps
- ✅ Mobile GPS sender (works in browser)
- ✅ Historical route playback
- ✅ Auto-stop detection
- ✅ Manual location saving
- ✅ User authentication
- ✅ Statistics & data export
- ✅ HTTPS security

## Support

See [INSTALLATION_MANUAL.md](INSTALLATION_MANUAL.md) for detailed troubleshooting and configuration.

## System Requirements

- Linux with Docker
- 2GB RAM minimum
- 2 CPU cores
- 10GB storage

## License

Built with open-source components: Flask, React, PostgreSQL, Leaflet.js, OpenStreetMap
