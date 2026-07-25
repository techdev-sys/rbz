#!/usr/bin/env bash
# Run once as root/sudo: sudo bash /home/takilaa/rbz/setup-prod.sh
set -euo pipefail

BASE=/home/takilaa/rbz

echo "=== [1/5] Installing nginx ==="
apt-get install -y nginx

echo "=== [2/5] Configuring nginx ==="
cp "$BASE/nginx-rbz.conf" /etc/nginx/sites-available/rbz
ln -sf /etc/nginx/sites-available/rbz /etc/nginx/sites-enabled/rbz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "=== [3/5] Installing systemd services ==="
cp "$BASE/systemd/rbz-backend.service" /etc/systemd/system/
cp "$BASE/systemd/rbz-ai.service"      /etc/systemd/system/
systemctl daemon-reload

echo "=== [4/5] Stopping any existing processes ==="
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 3

echo "=== [5/5] Starting & enabling services ==="
systemctl enable --now rbz-backend
systemctl enable --now rbz-ai

echo ""
echo "================================================================"
echo " Setup complete. Services started."
echo " Site is live at:  http://102.37.146.147"
echo ""
echo " Check status:     sudo systemctl status rbz-backend rbz-ai nginx"
echo " Backend logs:     tail -f $BASE/logs/backend.log"
echo " AI logs:          tail -f $BASE/logs/ai.log"
echo "================================================================"
echo ""
echo " NOTE: You still need to open port 80 in the Azure NSG."
echo " Azure Portal → VM → Networking → Add inbound port rule → Port 80"
