#!/bin/bash
echo "==============================================================================="
echo "                                  _                                     _      "
echo "  _ __ ___   ___    __      _____| |__         ___ ___  _ __  ___  ___ | | ___ "
echo " | '_ \` _ \ / __|___\ \ /\ / / _ \ '_ \ _____ / __/ _ \| '_ \/ __|/ _ \| |/ _ \\"
echo " | | | | | | (_|_____\ V  V /  __/ |_) |_____| (_| (_) | | | \__ \ (_) | |  __/"
echo " |_| |_| |_|\___|     \_/\_/ \___|_.__/       \___\___/|_| |_|___/\___/|_|\___|"
echo "                                                                               "
echo "==============================================================================="
echo "# File PATH #"
rootDir=$(pwd)
echo -e "- \033[32mCurrent PATH\t\033[37m$rootDir";
sourceEnv="${rootDir}/.env"
echo -e "- \033[32menv PATH\t\033[37m$sourceEnv";
source $sourceEnv
echo "==============================================================================="
echo "# Version #"
echo -en "- \033[32mgo\033[37m\t\t"; go version
echo -en "- \033[32mbuffalo\033[37m\t"; buffalo version
echo -en "- \033[32mnode\033[37m\t\t"; node -v
echo -en "- \033[32mnpm\033[37m\t\t"; npm -v
echo "==============================================================================="
echo "# Network #"
echo "-------------------------------------------------------------------------------"
HOSTIP=$(curl -s ifconfig.me)
echo -en "- \033[32mHOST\033[37m\t\t\t\t$HOSTIP\n";
echo "-------------------------------------------------------------------------------"
echo -en "- \033[32mAPI SERVER(ENV)\033[37m\t\thttp://$API_ADDR:$API_PORT\n";
echo -en "- \033[32mAPI SERVER(External)\033[37m\t\thttp://$HOSTIP:$API_PORT\n";
echo "-------------------------------------------------------------------------------"
echo -en "- \033[32mFront SERVER(ENV)\033[37m\t\thttp://$FRONT_ADDR:$FRONT_PORT\n";
echo -en "- \033[32mFront SERVER(External)\033[37m\thttp://$HOSTIP:$FRONT_PORT\n";
echo "==============================================================================="

APISERVER_HEALTH=false
FRONTSERVER_HEALTH=false

echo -en "\n## Deploy API server Development Mode\n";
cd $rootDir/mc_web_console_api/
buffalo dev | tee $rootDir/devlog/mc_web_console_api.log &

spinner="/|\\-"
count=0

while !($APISERVER_HEALTH); do
    printf "\r%s" "${spinner:$count:1}"
    count=$(( (count + 1) % 4 ))
    sleep 1
    http_status=$(curl -s -o /dev/null -w "%{http_code}" 127.0.0.1:$API_PORT/api/alive)
    if [ "$http_status" != "000" ]; then
        APISERVER_HEALTH=true
    fi
done
echo $http_status

echo -en "\n## Deploy Front server Development Mode\n";
cd $rootDir/mc_web_console_front/
buffalo dev | tee $rootDir/devlog/mc_web_console_front.log &

while !($FRONTSERVER_HEALTH); do
    printf "\r%s" "${spinner:$count:1}"
    count=$(( (count + 1) % 4 ))
    sleep 1
    http_status=$(curl -s -o /dev/null -w "%{http_code}" 127.0.0.1:$FRONT_PORT/alive)
    if [ "$http_status" != "000" ]; then
        FRONTSERVER_HEALTH=true
    fi
done
echo $http_status

echo -en "\n## done\n";


