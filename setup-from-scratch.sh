#!/bin/bash

# GPS Tracker - Complete Setup from Scratch
# Run this on a fresh Linux system

set -e

echo "=== GPS Tracker Complete Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run as root"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please logout and login again, then re-run this script."
    exit 0
fi

# Check if in docker group
if ! groups | grep -q docker; then
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "Please logout and login again, then re-run this script."
    exit 0
fi

echo "Creating directory structure..."
mkdir -p ~/gps-tracker-final/{backend/app,frontend/src/components,mobile,ssl,database}

echo "Note: You need to create all configuration files manually."
echo "Follow the INSTALLATION_MANUAL.md for complete file contents."
echo ""
echo "Setup directory created at: ~/gps-tracker-final"
echo ""
echo "Next steps:"
echo "1. Copy all configuration files from manual"
echo "2. Generate SSL certificates: cd ~/gps-tracker-final/ssl && openssl req -x509 ..."
echo "3. Run: docker compose up -d --build"
