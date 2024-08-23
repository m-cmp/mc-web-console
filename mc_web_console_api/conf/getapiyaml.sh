#!/bin/bash
URL=https://raw.githubusercontent.com/m-cmp/mc-admin-cli/main/conf/api.yaml
FILE="./api.yaml"

if [ -f "$FILE" ]; then
    echo "api.yaml이 이미 존재합니다."
    read -p "정말로 덮어쓰시겠습니까? (y/n): " choice
    case "$choice" in
        y|Y ) echo "파일을 덮어씁니다...";;
        n|N ) echo "작업이 취소되었습니다."; exit 0;;
        * ) echo "잘못된 입력입니다. 작업이 취소되었습니다."; exit 1;;
    esac
fi

wget -O "./api.yaml" "$URL"
if [ $? -ne 0 ]; then
    echo "ERROR: API YAML 업데이트에 실패했습니다."
    exit 1
fi

echo "@@@@ 파일이 성공적으로 업데이트되었습니다. baseUrl 을 변경하세요."