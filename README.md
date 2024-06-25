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
