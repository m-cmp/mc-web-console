#!/bin/sh

trap "nginx -s stop" SIGTERM

nginx -g "daemon off;"
