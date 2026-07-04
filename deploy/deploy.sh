#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/apps/super-video-resolver
REPO_URL=${REPO_URL:-https://github.com/Mitsukikis/super-video-resolver.git}
DEPLOY_REF=${DEPLOY_REF:-main}

mkdir -p /home/ubuntu/apps
if [ ! -d "$APP_DIR/.git" ]; then
  tmp_env=""
  if [ -f "$APP_DIR/.env.production" ]; then
    tmp_env="/tmp/super-video-resolver.env.$$"
    cp "$APP_DIR/.env.production" "$tmp_env"
  fi
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  if [ -n "$tmp_env" ]; then
    mv "$tmp_env" "$APP_DIR/.env.production"
    chmod 600 "$APP_DIR/.env.production"
  fi
fi

cd "$APP_DIR"
git fetch origin "$DEPLOY_REF"
git reset --hard "origin/$DEPLOY_REF"
npm ci
npm run build
sudo cp deploy/super-video-resolver.service /etc/systemd/system/super-video-resolver.service
sudo systemctl daemon-reload
sudo systemctl enable super-video-resolver
sudo systemctl restart super-video-resolver
sudo systemctl status super-video-resolver --no-pager
