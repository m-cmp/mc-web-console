#!/bin/bash

#!/bin/bash
# echo "Setup config"
# source ./conf/setup.env

# mc-web-console-api 프로그램 경로
BIN_PATH="./mc-web-console-api"
# 로그 파일 경로
LOG_FILE="./mc-web-console-api.log"
# PID 파일 경로
PID_FILE="./mc-web-console-api.pid"

start() {
    echo "Starting mc-web-console-api ..."
    nohup $BIN_PATH > $LOG_FILE 2>&1 &
    echo $! > $PID_FILE
    echo "mc-web-console-api started with PID $(cat $PID_FILE)"
}

stop() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        echo "Stopping mc-web-console-api with PID $PID..."
        kill $PID
        rm $PID_FILE
        echo "mc-web-console-api stopped."
    else
        echo "PID file not found. Is the mc-web-console-api running?"
    fi
}

status() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null; then
            echo "mc-web-console-api is running with PID $PID."
        else
            echo "mc-web-console-api is not running, but PID file exists."
        fi
    else
        echo "mc-web-console-api is not running."
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
