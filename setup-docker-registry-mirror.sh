#!/bin/bash
# Script to configure Docker daemon with registry mirror for better connectivity
# Run this on your VPS: sudo bash setup-docker-registry-mirror.sh

echo "Configuring Docker daemon with registry mirror..."

# Backup existing daemon.json if it exists
if [ -f /etc/docker/daemon.json ]; then
  sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
  echo "Backed up existing daemon.json"
fi

# Create or update daemon.json with registry mirrors
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirror.hashicorp.services",
    "https://mirror.gcr.io"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF

echo "Docker daemon.json configured with registry mirrors"
echo "Restarting Docker daemon..."

sudo systemctl daemon-reload
sudo systemctl restart docker

echo "Docker daemon restarted. Testing connection..."
docker pull node:20-alpine

echo "Setup complete!"
