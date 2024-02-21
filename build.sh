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

binPath=$rootDir/bin

echo -en "\n- Attempting to delete existing build..."
rm $binPath/mc-web-console-api
rm $binPath/mc-web-console-front
echo -en "\n- delete Success!\n\n"

echo -en "\n- ## Excute mc_web_console_api build start";
cd $rootDir/mc_web_console_api/
buffalo build > $rootDir/devlog/mc_web_console_api_build.log 2>&1 &

echo -en "\n- ## Excute mc_web_console_front build start\n\n";
cd $rootDir/mc_web_console_front/
buffalo build > $rootDir/devlog/mc_web_console_api_front.log 2>&1 &

# spinner="😊😂🤣🦝"
spinner="/|\\-"
count=0

buildDone=false
while !($buildDone); do
    printf "\r%s" "${spinner:$count:1} Now building....."
    count=$(( (count + 1) % 4 ))
    sleep 0.5
    if [ -e "$binPath/mc-web-console-api" ] && [ -e "$binPath/mc-web-console-front" ]; then
        buildDone=true
    fi
done

echo -en "\n\n \033[32m Build Done...\n\n"



