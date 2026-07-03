#!/usr/bin/env bash
set -euo pipefail

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-venv ffmpeg curl git

mkdir -p "$HOME/.local/bin" "$HOME/.local/share"
python3 -m venv "$HOME/.local/share/yt-dlp-venv"
"$HOME/.local/share/yt-dlp-venv/bin/pip" install --upgrade pip yt-dlp
ln -sf "$HOME/.local/share/yt-dlp-venv/bin/yt-dlp" "$HOME/.local/bin/yt-dlp"

sudo ufw allow 3000/tcp || true
node -v
npm -v
"$HOME/.local/bin/yt-dlp" --version
ffmpeg -version | head -1

