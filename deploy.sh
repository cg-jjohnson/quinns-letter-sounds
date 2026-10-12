#!/bin/bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

ENV_FILE="$APP_DIR/.env"
DEFAULT_PORT=3002

is_port_in_use() {
  local p=$1
  if ss -tuln | grep -q ":${p} "; then
    return 0 # In use
  elif nc -z 127.0.0.1 "$p" 2>/dev/null; then
    return 0 # In use
  else
    return 1 # Free
  fi
}

# 1. Determine Preferred Port
DESIRED_PORT=$DEFAULT_PORT
if [ -f "$ENV_FILE" ]; then
  SAVED_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d '=' -f2 | tr -d ' "')
  if [ -n "$SAVED_PORT" ]; then
    DESIRED_PORT=$SAVED_PORT
  fi
fi

# 2. Check if desired port is free, or find next available port
ASSIGNED_PORT=$DESIRED_PORT
if is_port_in_use "$ASSIGNED_PORT"; then
  echo "⚠️ Port $ASSIGNED_PORT is currently in use. Searching for next available port..."
  SEARCH_PORT=$DEFAULT_PORT
  while is_port_in_use "$SEARCH_PORT"; do
    SEARCH_PORT=$((SEARCH_PORT + 1))
  done
  ASSIGNED_PORT=$SEARCH_PORT
fi

echo "✅ Using Port: $ASSIGNED_PORT"

# 3. Save to .env for reuse in subsequent spin-ups
echo "PORT=$ASSIGNED_PORT" > "$ENV_FILE"
echo "NODE_ENV=production" >> "$ENV_FILE"
echo "DB_DIR=/app/data" >> "$ENV_FILE"

# 4. Ensure UFW allows the assigned port
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow "${ASSIGNED_PORT}/tcp" || true
fi

# 5. Build and Spin Up Docker Container
echo "🚀 Building and spinning up Quinn's Letter Sounds container on port $ASSIGNED_PORT..."
docker-compose --env-file "$ENV_FILE" up -d --build

echo "🎉 Quinn's Letter Sounds is successfully running on http://$(hostname -I | awk '{print $1}'):$ASSIGNED_PORT"
