#!/bin/bash
set -euo pipefail

APP_DIR=/opt/nodecraft
WEB_ROOT=/var/www/nodecraft

echo "=== Deploy started at $(date) ==="

cd "$APP_DIR"

git pull origin main

echo "--- Manager: installing dependencies ---"
cd manager
npm ci --omit=dev
NODE_ENV=production node_modules/.bin/sequelize-cli db:migrate
cd "$APP_DIR"

echo "--- Worker: installing dependencies ---"
cd worker
npm ci --omit=dev
cd "$APP_DIR"

echo "--- Web: building frontend ---"
cd web
npm ci
npm run build
cp -r build/. "$WEB_ROOT/"
cd "$APP_DIR"

echo "--- Restarting services ---"
sudo systemctl restart nodecraft-manager
sudo systemctl restart nodecraft-worker

echo "=== Deploy finished at $(date) ==="
