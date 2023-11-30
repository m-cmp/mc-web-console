# M-CMP WEB Console

This repository provides a Multi-Cloud WEB Console.

A sub-system of [M-CMP platform](https://github.com/m-cmp/docs/tree/main) to deploy and manage Multi-Cloud Infrastructures. 

```
[NOTE]
mc-web-console is currently under development.
So, we do not recommend using the current release in production.
Please note that the functionalities of mc-web-console are not stable and secure yet.
If you have any difficulties in using mc-web-console, please let us know.
(Open an issue or Join the M-CMP Slack)
```

## Overview
- [KOREAN] mc-web-console은 Multi-Cloud Project의 일환으로 다양한 클라우드를 web console에서 처리해 사용자로 하여금 간단하고 편안하게 클라우드를 접할 수 있게 해준다.
- [ENG] The mc-web-console is part of the Multi-Cloud Project, allowing users to seamlessly manage various clouds through a web console, providing a simple and comfortable experience for interacting with the cloud."

## How to Use
  - [[설치 환경]](#설치-환경)
  - [[의존성]](#의존성)
  - [[소스 설치]](#소스-설치)
  - [[환경 설정]](#환경-설정)
  - [[mc-web-console 실행]](#mc-web-console-실행)

***
## [설치 환경]
mc-web-console은 1.19 이상의 Go 버전이 설치된 다양한 환경에서 실행 가능하지만 최종 동작을 검증한 OS는 Ubuntu 22.0.4입니다.

<br>

## [의존성]
mc-web-console은 내부적으로 mc-infra-connector & mc-infra-manager의 개방형 API를 이용하기 때문에 각 서버의 연동이 필요합니다.(필수)<br>
- [https://github.com/cloud-barista/cb-tumblebug](https://github.com/cloud-barista/cb-tumblebug) README 참고하여 설치 및 실행 (검증된 버전 : cb-tumblebug v0.5.11)
- [https://github.com/cloud-barista/cb-spider](https://github.com/cloud-barista/cb-spider) README 참고하여 설치 및 실행 (검증된 버전 : cb-spider v0.5.12-p1)
- [https://github.com/cloud-barista/cb-dragonfly](https://github.com/cloud-barista/cb-dragonfly) README 참고하여 설치 및 실행 (검증된 버전 : cb-dragonfly v0.5.2)
- [https://github.com/cloud-barista/cb-mcks](https://github.com/cloud-barista/cb-mcks) README 참고하여 설치 및 실행 (검증된 버전 : cb-mcks v0.5.3)

추가로 mc-across-service-manager, mc-observability, mc-cost-optimizer, mc-iam-manager의 개방형 API를 이용할 수도 있다.

<br>

## [소스 설치]
- Git 설치
  - `$ sudo apt update`
  - `$ sudo apt install git`

- Go 1.19 이상의 버전 설치<br>
  - `$ wget https://golang.org/dl/go1.19.1.linux-amd64.tar.gz`
  - `$ sudo tar -C /usr/local -xzf go1.19.1.linux-amd64.tar.gz`

- Go 환경 설정  
  - `$ echo "export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin" >> ~/.bashrc`
  - `$ echo "export GOPATH=$HOME/go" >> ~/.bashrc`
  - `$ source ~/.bashrc`
  - `$ go version`
  ```
      go version go1.19.1 linux/amd64
  ```

 - mc-web-console 설치
   - `$ mkdir -p ~/go/src/github.com/m-cmp`
   - `$ cd ~/go/src/github.com/m-cmp`
   - `$ git clone https://github.com/m-cmp/mc-web-console.git`
   - `$ cd mc-web-console`
   - `$ go mod download`
   - `$ go mod verify`

<br>

## [환경 설정]
   - ./.env 파일에서 이용하고자 하는 개방형 API 서버의 실제 URL 정보로 수정합니다.<br><br>
     **[주의사항]**<br> mc-web-console을 비롯하여 연동되는 모든 서버가 자신의 로컬 환경에서 개발되는 경우를 제외하고는 클라이언트의 웹브라우저에서 접근하기 때문에 localhost나 127.0.0.1 주소가 아닌 실제 IP 주소를 사용해야 합니다.

   - 로그인 : iammanager를 사용하는 경우 iammanager에 user 생성, 로컬DB를 

   - 초기 Data 구축관련<br>
     내부적으로 [cb-spider](https://github.com/cloud-barista/cb-spider)와 [cb-tumblebug](https://github.com/cloud-barista/cb-tumblebug)의 개방형 API를 사용하므로 입력되는 Key Name및 Key Value는 cb-spider 및 cb-tumblebug의 API 문서를 참고하시기 바랍니다.<br>

<br>

## [mc-web-console 실행]
  - 일반 실행 
    - `$ cd ~/go/src/github.com/m-cmp/mc-web-console`
    - `$ source ./.env`
    - `$ buffalo dev`
  
<br>

## How to Contribute

- Issues/Discussions/Ideas: Utilize issue of mc-web-console
