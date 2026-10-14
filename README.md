# M-CMP WEB Console

This repository provides a Multi-Cloud WEB Console.

A sub-system of [M-CMP platform](https://github.com/m-cmp/docs/tree/main) to deploy and manage Multi-Cloud Infrastructures.

## Overview

The MC-WEB-CONSOLE multi-cloud management portal and open interfaces include several features. Firstly, the multi-cloud management platform provides open APIs, facilitating integration with various cloud services. Secondly, a user portal for the multi-cloud management platform is provided, allowing general users to efficiently manage their cloud resources. Lastly, an administrator portal for the multi-cloud management platform enables administrators to monitor and control the entire cloud environment. These portals and interfaces are designed to maximize management efficiency in a multi-cloud environment and enhance convenience for both users and administrators.

- 멀티 클라우드 관리 포털 및 개방형 인터페이스
    - 멀티 클라우드 관리 플랫폼 일반 사용자 포털
    - 멀티 클라우드 관리 플랫폼 관리자 포털

## Documentation

프로젝트 문서는 [docs/](docs/) 폴더에 역할별로 정리되어 있습니다.

- [API (Swagger)](docs/api/index.html)
- [개발 기록 (bug/fix)](docs/development/)
- [수동 테스트](docs/manual-testing/)
- [E2E 스냅샷 (mcmp-e2e mirror)](docs/e2e-snapshot/)

---

## Installation

mc-web-console is one subsystem of the M-CMP platform. It depends on **mc-iam-manager** (authentication/menu/RBAC) and **mc-infra-manager** (multi-cloud infra API) being reachable, and its menu catalog (`conf/webconsole_menu_resources.yaml`, see [Menu Catalog](#menu-catalog-canonical-source) below) is the platform-wide canonical source that mc-iam-manager seeds itself from.

### Recommended: install the whole platform with mc-admin-cli

For a new environment, use [mc-admin-cli](https://github.com/m-cmp/mc-admin-cli)'s `installAll.sh` — it is the **unified installer** for the whole M-CMP platform (mc-infra-manager/cb-tumblebug, mc-iam-manager, mc-web-console, and the rest of the microservices) and brings everything up together via Docker Compose, including seeding mc-iam-manager's menu/role data from this repo.

```bash
git clone https://github.com/m-cmp/mc-admin-cli.git -b v0.5.0
cd mc-admin-cli/conf/docker/conf/mc-iam-manager
cp .env.setup .env   # edit: platform admin ID/password and other REQUIRE-marked values
cd ../../../../bin
./installAll.sh
```

See mc-admin-cli's [README](https://github.com/m-cmp/mc-admin-cli#readme) (Quick Start / Quick Guide) for the full walkthrough, deployment modes, and troubleshooting. Once it finishes, mc-web-console is reachable at `https://<server>:3001` with default credentials `mcmp` / `mcmp_password`.

### Local development (contributors)

mc-web-console runs as **two separate Echo servers**: `api/` (backend API / proxy to mc-iam-manager, mc-infra-manager, and the other microservices, default port 3000) and `front/` (HTML templates + static assets, default port 3001).

**Prerequisites**
- Go 1.25+ ([install guide](https://go.dev/doc/install))
- Node.js (for `front/`'s webpack build)
- A reachable mc-iam-manager instance (and mc-infra-manager, for infra-resource screens) — either one you run locally, or a shared dev/stage instance

**1. Clone and configure**
```bash
git clone https://github.com/m-cmp/mc-web-console.git
cd mc-web-console
cp conf/.env.sample conf/.env
# edit conf/.env — MC_WEB_CONSOLE_* ports, Postgres connection, MC_WEB_CONSOLE_USE_IAM, etc.
```
`conf/api.yaml` (committed, not a `.sample`) holds the `services.<name>.baseurl` map the API server proxies to — update `services.mc-iam-manager.baseurl` / `services.mc-infra-manager.baseurl` to point at the instances you're using. Client-side (browser) access means these must be real, reachable addresses — not `localhost`/`127.0.0.1` — unless you're also running the browser on the same host.

**2. Build and run**
```bash
# api
cd api && go build -o ../bin/api ./cmd/main.go && cd ..
MC_WEB_CONSOLE_API_PORT=3000 ./bin/api

# front (separate terminal)
cd front && npm install && npm run build && go build -o ../bin/front ./cmd/app && cd ..
MC_WEB_CONSOLE_FRONT_PORT=3001 ./bin/front
```
For active `front/` development, `npm run dev` (webpack `--watch`) rebuilds static assets automatically instead of running `npm run build` by hand each time; the Go binaries (`api/`, `front/`) still need a manual rebuild.

**3. Verify**
```bash
curl http://localhost:3001/readyz
```
Then open `http://<host>:3001/auth/login` — you should reach the login screen and be able to sign in as a user created in mc-iam-manager.

### Menu Catalog (canonical source)

`conf/webconsole_menu_resources.yaml` in this repo is the **platform-wide canonical menu catalog** — every menu item's id, hierarchy, and (for embedded microservice screens) `viewtype`/`frameworkservice`/`path`. mc-iam-manager does not maintain its own menu definitions. How the file is used depends on the mode:

- **IAM mode** (`MC_WEB_CONSOLE_USE_IAM=true`, the mc-admin-cli default): the catalog is seeded into mc-iam-manager's `mcmp_menus` table **once, at first install**. mc-admin-cli bundles a copy of this file under `conf/docker/conf/mc-web-console/api/conf/` and mounts it into the mc-iam-manager container (`MC_WEB_CONSOLE_MENUYAML` points at the mounted path; a URL is also accepted). After that the IAM DB is the source of truth — menus and role-menu mappings are edited through the console's Menus / Roles screens (or mc-iam-manager's `/api/menus*` APIs), and the console reads the full menu (`/api/menus/list`) and the caller's role-filtered menu (`/api/users/menus/list`) from IAM. Re-running the seed skips when menus already exist; an operator can explicitly `force` a re-seed (role mappings are backed up first) — see mc-iam-manager's README "Menu Management". So changing this file affects existing deployments only when someone updates the mc-admin-cli copy and forces a re-seed.
- **self mode** (`MC_WEB_CONSOLE_USE_IAM=false`): the API server loads this file at boot and answers the menu queries (`GetAllAvailableMenus`, `Getmenuresources`, `listMenus`) from it directly — full menu = role menu, no IAM round trip. Screens that only work with IAM (Menus, Roles, CSP Roles, Cloud Overview's Setup Status) are hidden from the local list (`api/internal/handler/menu_local.go`).
