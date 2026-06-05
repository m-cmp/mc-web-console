#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

API_PORT="${MC_WEB_CONSOLE_API_PORT:-3007}"
FRONT_PORT="${MC_WEB_CONSOLE_FRONT_PORT:-3017}"

echo "[remote] API server  : http://localhost:$API_PORT"
echo "[remote] Front server: http://0.0.0.0:$FRONT_PORT"
echo "[remote] Framework   : mciam.onecloudcon.com"

# webpack 빌드 (SKIP_BUILD=true 로 건너뛸 수 있음)
if [ "${SKIP_BUILD:-false}" != "true" ]; then
  echo "[remote] Building frontend..."
  cd "$ROOT_DIR/front" && npm run build
fi

# API 서버 기동 (백그라운드)
cd "$ROOT_DIR/api"
MC_WEB_CONSOLE_API_ADDR=0.0.0.0 \
MC_WEB_CONSOLE_API_PORT=$API_PORT \
go run cmd/main.go > "$LOGS_DIR/api.log" 2>&1 &
echo $! > "$LOGS_DIR/api.pid"
echo "[remote] API server started (PID: $(cat $LOGS_DIR/api.pid)), log: $LOGS_DIR/api.log"
sleep 2

# Front 서버 기동 (포그라운드 — Ctrl+C 로 종료)
cd "$ROOT_DIR/front"
MC_WEB_CONSOLE_FRONT_PORT=$FRONT_PORT \
MC_WEB_CONSOLE_FRONT_ADDR=0.0.0.0 \
MC_WEB_CONSOLE_API_SCHEME=http \
MC_WEB_CONSOLE_API_ADDR=localhost \
MC_WEB_CONSOLE_API_PORT=$API_PORT \
go run cmd/app/main.go
