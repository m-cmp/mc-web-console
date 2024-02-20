#!/bin/bash
cmds=("mc-web-console" "buffalo" "node" "webpack")
for cmd in "${cmds[@]}"; do
    exist=true
    while $exist; do
        pid=$(ps -al | grep "$cmd" | awk '{print $4}')
        if [ -n "$pid" ]; then
            echo -e "kill\t$cmd\tpid-$pid\t"
            kill $pid
        else
            exist=false
        fi
    done
done
echo -e "Done."
