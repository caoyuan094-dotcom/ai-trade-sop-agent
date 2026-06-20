#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3002}"

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  npm install
fi

if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  echo "Port $PORT is already in use. Trying next port..."
  PORT=$((PORT + 1))
done

URL="http://${HOST}:${PORT}"

echo ""
echo "AI Trade Agent is starting..."
echo "Open: $URL"
echo ""

npm run dev -- --hostname "$HOST" --port "$PORT"
