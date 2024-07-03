# M-CMP WEB Console

This repository provides a Multi-Cloud WEB Console.

A sub-system of [M-CMP platform](https://github.com/m-cmp/docs/tree/main) to deploy and manage Multi-Cloud Infrastructures.

## Overview

The MC-WEB-CONSOLE multi-cloud management portal and open interfaces include several features. Firstly, the multi-cloud management platform provides open APIs, facilitating integration with various cloud services. Secondly, a user portal for the multi-cloud management platform is provided, allowing general users to efficiently manage their cloud resources. Lastly, an administrator portal for the multi-cloud management platform enables administrators to monitor and control the entire cloud environment. These portals and interfaces are designed to maximize management efficiency in a multi-cloud environment and enhance convenience for both users and administrators.

- 멀티 클라우드 관리 포털 및 개방형 인터페이스
    - 멀티 클라우드 관리 플랫폼 일반 사용자 포털
    - 멀티 클라우드 관리 플랫폼 관리자 포털
    

---

## Quick Start with docker

Use this guide to start MC-WEB-CONOLE  using the docker. This guide explains on the premise that all prerequisites have been met.

### Prequisites

- Ubuntu (22.04 is tested) with external access (https-443, http-80, ssh-ANY)
- pre-installed [MC-IAM-MANAGER](https://github.com/m-cmp/mc-iam-manager) and [MC-INFRA-MANAGER](https://github.com/m-cmp/mc-infra-manager)
    - Both should be completed setting (users, pre-Runscript, credential ….)
- Stop or Disable Services using 3001 port for web interface

### Step one : Clone this repo

```bash
git clone https://github.com/m-cmp/mc-web-console <YourFolderName>
```

### Step two : Go to Scripts Folder

```bash
cd <YourFolderName>/scripts
```

### Step three: **Modifying an Environment variable in docker-compose file**

Those marked with OPTIONAL do not have to be changed. Those marked with REQUIRED are fixed values that must be changed or used after setting.

```jsx
version: '3.8'

services:
  mcwebconsole:
    build: ../
    container_name: mcwebconsole
    depends_on:
      - postgresdb
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      GO_ENV: development # production | development # Please CHANGE ME (OPTIONAL)
      GODEBUG: netdns=go
      MCIAMMANAGER: https://sample.mc-iam-manager.com:5000 # Please CHANGE ME (REQUIRE)
      MCINFRAMANAGER: http://sample.m-cmp.com:1323/tumblebug # Please CHANGE ME (REQUIRE)
      API_USERNAME: API_USERNAME # Please CHANGE ME (REQUIRE)
      API_PASSWORD: API_PASSWORD # Please CHANGE ME (REQUIRE)
      DEV_DATABASE_URL: postgres://mcwebadmin:mcwebadminpassword@mcwebconsole-postgresdb:5432/mcwebconsoledbdev # Please CHANGE ME (OPTIONAL)
      PROD_DATABASE_URL: postgres://mcwebadmin:mcwebadminpassword@mcwebconsole-postgresdb:5432/mcwebconsoledbprod # Please CHANGE ME (OPTIONAL)
    restart: always
    networks:
      - mcwebconsole

  mcwebconsole-postgresdb:
    image: postgres:14-alpine
    container_name: mcwebconsole-postgresdb
    volumes:
      - ~/.m-cmp/mc-web-console/postgresql/data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: mcwebconsoledbdev # [mcwebconsoledbdev / mcwebconsoledbprod] # Please CHANGE ME (OPTIONAL)
      POSTGRES_USER: mcwebadmin # Please CHANGE ME (OPTIONAL)
      POSTGRES_PASSWORD: mcwebadminpassword # Please CHANGE ME (OPTIONAL)
    networks:
      - mcwebconsole

networks:
  mcwebconsole:

```

### Step four: Excute docker-compose

```bash
docker-compose up --build -d
```

If you check the log as below, it seems that you have successfully built and deployed the mc-web-console without any problems.

```bash
$ docker-compose up --build -d
## This warning sign is a natural occurrence when running an existing MCIAMMANAGER with docker components.
WARNING: Found orphan containers (mciammanager, mciammanager-keycloak, mciammanager-nginx, mciammanager-certbot) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.
Building mcwebconsole
Step 1/32 : FROM golang:1.22.3-alpine AS builder
 ---> 0594d7786b7c
Step 2/32 : RUN apk add --no-cache gcc libc-dev musl-dev curl npm wget
 ---> Using cache
 ---> ed49efe7089b
Step 3/32 : RUN npm install --global yarn
.....
Creating mcwebconsole-postgresdb ... done
Creating mcwebconsole            ... done
```

### WELCOME: **Visit Web pages**

```jsx
http://<YOUR_ADDRESS>:3001/auth/login
```

MC-WEB-CONSOLE has been successfully deployed if the screen below is visible during the access to the web of the endpoint above. Login users can log in as users created by MC-IAM-MANAGER.


![Untitled](https://raw.githubusercontent.com/m-cmp/mc-web-console/docs/assets/img/login.png)




---

**[설치 환경]**


mc-web-console은 1.19 이상의 Go 버전이 설치된 다양한 환경에서 실행 가능하지만 최종 동작을 검증한 OS는 Ubuntu 22.0.4입니다.

**[의존성]**

mc-web-console은 내부적으로 mc-iam-manager & mc-infra-manager의 개방형 API를 이용하기 때문에 각 서버의 연동이 필요합니다.(필수)

- https://github.com/m-cmp/mc-infra-manager README 참고하여 설치 및 실행
- https://github.com/m-cmp/mc-iam-manager README 참고하여 설치 및 실행 (검증된 버전 : mc-iam-manager v0.2.0).

---

**[소스 설치]**

- Git 설치
    - `$ sudo apt update`
    - `$ sudo apt install git`

- Go 1.19 이상의 버전 설치 ( 공식 문서 참고 )
    - https://go.dev/doc/install

- mc-web-console 설치
    
    ```bash
    $ git clone https://github.com/m-cmp/mc-web-console.git
    ```
    
    ```bash
    $ git clone https://github.com/m-cmp/mc-web-console.git
    ```
    
    - web_console_api
        
        ```bash
        $ cd mc-web-console/mc_web_console_api
        $ buffalo build
        ```
        
    - web_console_front
        
        ```bash
        $ cd mc-web-console/mc_web_console_front
        $ npm install
        $ yarn install
        $ buffalo build
        ```
        

---

**[환경 설정]**

- ./.env 파일에서 이용하고자 하는 개방형 API 서버의 실제 URL 정보로 수정합니다.
    
    **[주의사항]**
    
    mc-web-console을 비롯하여 연동되는 모든 서버가 자신의 로컬 환경에서 개발되는 경우를 제외하고는 클라이언트의 웹브라우저에서 접근하기 때문에 localhost나 127.0.0.1 주소가 아닌 실제 IP 주소를 사용해야 합니다.
    

---

**[mc-web-console 실행]**

- 코드기반 실행
    - `$ ./startDev.sh` /  `$ ./stopDev.sh` 활용
