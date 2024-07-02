---
layout: default
title: Quick Start with docker
parent: How to install
order: 1
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

```docker
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

```
http://<YOUR_ADDRESS>:3001/auth/login
```

MC-WEB-CONSOLE has been successfully deployed if the screen below is visible during the access to the web of the endpoint above. Login users can log in as users created by MC-IAM-MANAGER.

![loginpage](/mc-web-console/assets/img/login.png)
