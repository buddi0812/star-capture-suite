#!/bin/bash
set -e

echo "=== Astrophotography Camera Setup ==="

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "WARNING: This script is designed for Raspberry Pi"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install system dependencies
echo "Installing system dependencies..."
sudo apt install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    libcamera-dev \
    libcamera-apps \
    python3-picamera2 \
    python3-opencv \
    nginx \
    caddy \
    git \
    zip \
    unzip

# Create application user
echo "Creating application user..."
sudo useradd -r -s /bin/false -d /opt/astrocam astrocam || true

# Create directories
echo "Creating directories..."
sudo mkdir -p /opt/astrocam
sudo mkdir -p /data/sessions
sudo mkdir -p /data/.thumbs
sudo mkdir -p /data/zips
sudo mkdir -p /etc/astrocam
sudo mkdir -p /var/log/astrocam

# Set permissions
sudo chown -R astrocam:astrocam /opt/astrocam
sudo chown -R astrocam:astrocam /data
sudo chown -R astrocam:astrocam /var/log/astrocam

# Copy application files
echo "Installing application..."
sudo cp -r backend/* /opt/astrocam/
sudo cp -r frontend/dist /opt/astrocam/static

# Create Python virtual environment
echo "Setting up Python environment..."
sudo -u astrocam python3 -m venv /opt/astrocam/venv
sudo -u astrocam /opt/astrocam/venv/bin/pip install --upgrade pip
sudo -u astrocam /opt/astrocam/venv/bin/pip install -r /opt/astrocam/requirements.txt

# Install systemd services
echo "Installing systemd services..."
sudo cp systemd/astrocam-api.service /etc/systemd/system/
sudo cp systemd/astrocam-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload

# Install Caddy configuration
echo "Installing Caddy configuration..."
sudo cp caddy/Caddyfile /etc/caddy/
sudo systemctl restart caddy

# Install default configuration
echo "Installing default configuration..."
sudo cp config/config.yaml /etc/astrocam/

# Enable and start services
echo "Enabling services..."
sudo systemctl enable astrocam-api
sudo systemctl enable astrocam-frontend
sudo systemctl enable caddy

echo "Starting services..."
sudo systemctl start astrocam-api
sudo systemctl start astrocam-frontend

# Configure camera permissions
echo "Configuring camera permissions..."
sudo usermod -a -G video astrocam

# Show status
echo ""
echo "=== Installation Complete ==="
echo ""
echo "Services status:"
sudo systemctl status astrocam-api --no-pager -l
sudo systemctl status astrocam-frontend --no-pager -l
sudo systemctl status caddy --no-pager -l

echo ""
echo "Access the camera interface at:"
echo "  https://$(hostname).local:8443"
echo "  https://$(hostname -I | awk '{print $1}'):8443"
echo ""
echo "Logs can be viewed with:"
echo "  journalctl -u astrocam-api -f"
echo "  journalctl -u astrocam-frontend -f"