#!/bin/bash
api_pid=$(<mc_web_console_api.pid)
front_pid=$(<mc_web_console_front.pid)

if [ -z "$api_pid" ]; then
    echo "There is NO Provided API SERVER PID!"
else
    kill -9 $api_pid
fi

if [ -z "$front_pid" ]; then
    echo "There is NO Provided FRONT SERVER PID!"
else
    kill -9 $front_pid
fi

if ps -p $api_pid > /dev/null; then
    echo "!!Error while shutdown API server!!"
else
    echo "The api server was successfully shut down..."
fi

if ps -p $api_pid > /dev/null; then
    echo "!!Error while shutdown Front server!!"
else
    echo "The Front server was successfully shut down..."
fi

rm ./mc_web_console_api.pid
rm ./mc_web_console_front.pid

echo "DONE..."
