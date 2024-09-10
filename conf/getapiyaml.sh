#!/bin/bash
FILE="./api.yaml"

read -p "MCIAM USE? (y/n): " MCIAM_USE 

case "$MCIAM_USE" in
    y|Y ) URL="https://raw.githubusercontent.com/m-cmp/mc-admin-cli/main/conf/api.yaml";; # m-cmp/mc-admin-cli
    n|N ) URL="https://raw.githubusercontent.com/cloud-barista/cm-mayfly/main/conf/api.yaml";; # cloud-barista/cm-mayfly
esac

if [ -f "$FILE" ]; then
    echo "api.yaml already exists."
    read -p "Are you sure you want to overwrite it? (y/n): " choice
    case "$choice" in
        y|Y ) echo "Overwrite file...";;
        n|N ) echo "The operation has been canceled."; exit 0;;
        * ) echo "Invalid input, operation cancelled."; exit 1;;
    esac
fi

wget -O "./api.yaml" "$URL"
if [ $? -ne 0 ]; then
    echo "ERROR: api.yaml update failed."
    exit 1
fi

echo "File updated successfully, please change baseUrl."