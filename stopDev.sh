#!/bin/bash

program_list=("mc-web-console" "buffalo" "webpack")

for program in "${program_list[@]}"; do
    if pgrep "$program" >/dev/null; then
        echo "Stopping $program..."
        pkill "$program"
        echo "$program stopped."
    else
        echo "$program is not running."
    fi
done