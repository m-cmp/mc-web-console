#!/bin/bash
# FR-004 개발 환경 종료 스크립트

WORKTREE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$WORKTREE_DIR/scripts/logs"

echo "=== FR-004 mc-web-console 종료 ==="

stop_pid() {
    local name=$1
    local pidfile="$LOG_DIR/$name.pid"
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "[+] $name (PID $pid) 종료"
        else
            echo "[-] $name (PID $pid) 이미 종료됨"
        fi
        rm -f "$pidfile"
    else
        echo "[-] $name PID 파일 없음"
    fi
}

stop_pid "front"
stop_pid "api"

echo "완료"
