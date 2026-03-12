#!/bin/bash
# FR-004 개발 환경 기동 스크립트
# 포트 충돌 방지: front=3104, api=3105
# mc-iam-manager: 52.79.163.111:5006

set -e

WORKTREE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONT_DIR="$WORKTREE_DIR/front"
API_DIR="$WORKTREE_DIR/api"
LOG_DIR="$WORKTREE_DIR/scripts/logs"

# 포트 설정 (기존 포트 충돌 방지)
FRONT_PORT=3104
API_PORT=3105

mkdir -p "$LOG_DIR"

echo "=== FR-004 mc-web-console 기동 ==="
echo "Front : http://localhost:$FRONT_PORT"
echo "API   : http://localhost:$API_PORT"
echo "IAM   : http://52.79.163.111:5006"
echo ""

# 기존 프로세스 정리
echo "[*] 기존 FR-004 프로세스 정리..."
pkill -f "FRONT_PORT=$FRONT_PORT" 2>/dev/null || true
pkill -f "API_PORT=$API_PORT" 2>/dev/null || true
sleep 1

# 포트 사용 여부 확인
if ss -tlnp | grep -q ":$FRONT_PORT "; then
    echo "[!] 포트 $FRONT_PORT 이미 사용 중. 기존 프로세스를 종료하세요."
    exit 1
fi
if ss -tlnp | grep -q ":$API_PORT "; then
    echo "[!] 포트 $API_PORT 이미 사용 중. 기존 프로세스를 종료하세요."
    exit 1
fi

# front webpack 빌드 (JS 파일 변경 시)
if [ "${SKIP_BUILD:-false}" != "true" ]; then
    echo "[*] Front webpack 빌드 중..."
    cd "$FRONT_DIR"
    npm run build 2>&1 | tail -5
    echo "[+] 빌드 완료"
fi

# API 서버 기동
echo "[*] API 서버 기동 (포트: $API_PORT)..."
cd "$API_DIR"
FRONT_PORT=$FRONT_PORT \
API_PORT=$API_PORT \
MCIAM_USE=true \
go run cmd/main.go > "$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo "[+] API PID: $API_PID"

# API 서버 준비 대기
sleep 2
if ! kill -0 $API_PID 2>/dev/null; then
    echo "[!] API 서버 기동 실패. 로그 확인: $LOG_DIR/api.log"
    exit 1
fi

# Front 서버 기동
echo "[*] Front 서버 기동 (포트: $FRONT_PORT)..."
cd "$FRONT_DIR"
FRONT_PORT=$FRONT_PORT \
FRONT_ADDR=0.0.0.0 \
API_ADDR=localhost \
API_PORT=$API_PORT \
go run cmd/app/main.go > "$LOG_DIR/front.log" 2>&1 &
FRONT_PID=$!
echo "[+] Front PID: $FRONT_PID"

# PID 저장
echo "$API_PID" > "$LOG_DIR/api.pid"
echo "$FRONT_PID" > "$LOG_DIR/front.pid"

sleep 2
if ! kill -0 $FRONT_PID 2>/dev/null; then
    echo "[!] Front 서버 기동 실패. 로그 확인: $LOG_DIR/front.log"
    exit 1
fi

echo ""
echo "=== 기동 완료 ==="
echo "  회원가입: http://localhost:$FRONT_PORT/auth/signup"
echo "  로그인  : http://localhost:$FRONT_PORT/auth/login"
echo ""
echo "로그 확인:"
echo "  tail -f $LOG_DIR/front.log"
echo "  tail -f $LOG_DIR/api.log"
echo ""
echo "종료: $WORKTREE_DIR/scripts/stop-fr004.sh"
