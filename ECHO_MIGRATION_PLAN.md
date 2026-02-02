# Buffalo → Echo 완전 마이그레이션 계획

## 📋 프로젝트 개요

**목표:** Go Buffalo 기반 API를 Echo 프레임워크로 완전 마이그레이션
**브랜치:** `mig-echo-api`
**예상 기간:** 4-6주 (단계별 진행)
**핵심 원칙:**
- 기존 API 호환성 유지
- 점진적이고 안전한 마이그레이션
- 테스트 주도 개발
- 성능 향상

---

## 🎯 마이그레이션 전략

### 선택: Strangler Fig Pattern (교살자 무화과 패턴)

**방식:** 새로운 Echo 서버를 병렬로 구축하고, 점진적으로 트래픽 전환

**이유:**
- ✅ 안전한 롤백 가능
- ✅ 단계별 검증 가능
- ✅ 비즈니스 중단 최소화
- ✅ 팀 학습 곡선 완화

**대안 (선택하지 않은 이유):**
- ❌ Big Bang (한번에 전체 교체) - 위험도 높음
- ❌ Adapter Pattern (Buffalo 위에 Echo) - 복잡도 증가

---

## 🏗️ 아키텍처 설계

### 목표 Echo 구조

```
api/
├── cmd/
│   └── main.go                 # Echo 서버 엔트리포인트
│
├── internal/
│   ├── config/                 # 설정 관리
│   │   ├── config.go           # Viper 기반 설정 로더
│   │   └── api_spec.go         # api.yaml 파서
│   │
│   ├── middleware/             # Echo 미들웨어
│   │   ├── auth.go             # 인증 미들웨어
│   │   ├── cors.go             # CORS 설정
│   │   ├── logger.go           # 로깅
│   │   ├── recovery.go         # Panic recovery
│   │   └── mciam.go            # MC-IAM 연동
│   │
│   ├── handler/                # HTTP 핸들러
│   │   ├── health.go           # /readyz
│   │   ├── auth.go             # 인증 엔드포인트
│   │   ├── proxy.go            # 동적 프록시 핸들러
│   │   ├── self/               # 자체 구현 핸들러
│   │   │   ├── disk.go
│   │   │   ├── menu.go
│   │   │   ├── role.go
│   │   │   └── workspace_project.go
│   │   └── response.go         # 공통 응답 헬퍼
│   │
│   ├── service/                # 비즈니스 로직
│   │   ├── proxy_service.go    # 백엔드 프록시 서비스
│   │   ├── auth_service.go     # 인증 서비스
│   │   └── session_service.go  # 세션 관리
│   │
│   ├── repository/             # 데이터 접근
│   │   └── session_repo.go     # 세션 저장소 (GORM)
│   │
│   ├── model/                  # 데이터 모델
│   │   ├── request.go          # CommonRequest
│   │   ├── response.go         # CommonResponse
│   │   └── session.go          # Usersess
│   │
│   └── router/                 # 라우팅
│       ├── router.go           # 메인 라우터
│       ├── auth_routes.go      # 인증 라우트
│       └── api_routes.go       # API 라우트
│
├── pkg/                        # 공용 패키지
│   ├── httpclient/             # HTTP 클라이언트
│   ├── jwt/                    # JWT 유틸
│   └── errors/                 # 에러 처리
│
├── migrations/                 # DB 마이그레이션 (유지)
├── conf/                       # 설정 파일 (유지)
│   └── api.yaml
├── go.mod
└── go.sum
```

### 핵심 변경사항

| 항목 | Buffalo | Echo |
|------|---------|------|
| **프레임워크** | Buffalo v1.1.0 | Echo v4.12+ |
| **라우터** | Gorilla Mux | Echo Router |
| **미들웨어** | Buffalo Middleware | Echo Middleware |
| **ORM** | Pop v6 | GORM v2 |
| **세션** | Gorilla Sessions (DB) | GORM (DB 저장) |
| **Context** | buffalo.Context | echo.Context |
| **응답** | buffalo.Render | echo.JSON() |

---

## 📅 단계별 실행 계획

### Phase 0: 준비 단계 (1주)

**목표:** 개발 환경 구축 및 기초 설정

#### Task 0.1: 의존성 설정
```bash
# Echo 및 필수 라이브러리 추가
go get github.com/labstack/echo/v4
go get github.com/labstack/echo/v4/middleware
go get gorm.io/gorm
go get gorm.io/driver/postgres  # 또는 사용 중인 DB
go get github.com/spf13/viper
go get github.com/golang-jwt/jwt/v5
```

#### Task 0.2: 프로젝트 구조 생성
- [ ] `internal/` 디렉토리 구조 생성
- [ ] `pkg/` 디렉토리 구조 생성
- [ ] 기본 파일 스캐폴딩

#### Task 0.3: 설정 파일 마이그레이션
- [ ] `conf/api.yaml` 파서 구현 (Viper)
- [ ] 환경 변수 관리 구조화
- [ ] 설정 테스트 작성

**산출물:**
- `internal/config/config.go`
- `internal/config/api_spec.go`
- `conf/config.yaml` (새로운 Echo 설정)

---

### Phase 1: 코어 인프라 구축 (1-2주)

**목표:** Echo 서버 기본 구조 및 공통 컴포넌트 구현

#### Task 1.1: Echo 서버 초기화
**파일:** `cmd/main.go`

```go
package main

import (
    "mc_web_console_api/internal/config"
    "mc_web_console_api/internal/router"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

func main() {
    // 설정 로드
    cfg := config.Load()

    // Echo 인스턴스 생성
    e := echo.New()

    // 미들웨어 설정
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())
    e.Use(middleware.CORS())

    // 라우터 설정
    router.Setup(e, cfg)

    // 서버 시작
    e.Logger.Fatal(e.Start(cfg.Server.Address))
}
```

- [ ] main.go 구현
- [ ] 서버 실행 확인
- [ ] 기본 health check 엔드포인트

#### Task 1.2: 공통 모델 정의
**파일:** `internal/model/`

```go
// request.go
type CommonRequest struct {
    PathParams  map[string]string      `json:"pathParams"`
    QueryParams map[string]string      `json:"queryParams"`
    Request     map[string]interface{} `json:"request"`
}

// response.go
type CommonResponse struct {
    ResponseData interface{} `json:"responseData"`
    Status       Status      `json:"status"`
}

type Status struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}
```

- [ ] CommonRequest 구현
- [ ] CommonResponse 구현
- [ ] 헬퍼 함수 구현

#### Task 1.3: 공통 미들웨어 구현
**파일:** `internal/middleware/`

- [ ] `logger.go` - 요청/응답 로깅
- [ ] `cors.go` - CORS 설정
- [ ] `recovery.go` - Panic recovery
- [ ] `request_id.go` - Request ID 추적

#### Task 1.4: 에러 처리 시스템
**파일:** `pkg/errors/`

```go
type AppError struct {
    Code    int
    Message string
    Err     error
}

func (e *AppError) Error() string {
    return e.Message
}
```

- [ ] 공통 에러 타입 정의
- [ ] Echo 에러 핸들러 구현
- [ ] HTTP 상태 코드 매핑

**산출물:**
- 실행 가능한 Echo 서버
- 공통 모델 및 에러 처리
- 기본 미들웨어

---

### Phase 2: 인증 시스템 마이그레이션 (1주)

**목표:** 인증/인가 기능 완전 이식

#### Task 2.1: 세션 관리 (GORM, DB 저장)
**파일:** `internal/model/session.go`

**중요:** Redis를 사용하지 않고, Buffalo와 동일하게 **데이터베이스에 세션 저장**

```go
type UserSession struct {
    ID               string    `gorm:"primaryKey;type:uuid"`
    UserID           string    `gorm:"index"`
    AccessToken      string
    ExpiresIn        float64
    RefreshToken     string
    RefreshExpiresIn float64
    CreatedAt        time.Time
    UpdatedAt        time.Time
}
```

**파일:** `internal/repository/session_repo.go`

- [ ] GORM 모델 정의 (usersesses 테이블 매핑)
- [ ] CRUD 메서드 구현 (Create, FindByUserID, Update, Delete)
- [ ] Buffalo Pop → GORM 마이그레이션 (스키마 호환)

#### Task 2.2: JWT 처리
**파일:** `pkg/jwt/jwt.go`

```go
func ParseToken(tokenString string) (*Claims, error)
func GenerateToken(claims *Claims) (string, error)
func RefreshToken(refreshToken string) (string, error)
```

- [ ] JWT 파싱/생성 유틸
- [ ] Claims 구조체 정의
- [ ] 토큰 검증 로직

#### Task 2.3: 인증 미들웨어
**파일:** `internal/middleware/auth.go`

```go
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        token := extractToken(c)
        claims, err := jwt.ParseToken(token)
        if err != nil {
            return echo.NewHTTPError(401, "Unauthorized")
        }

        c.Set("userId", claims.UserID)
        c.Set("userName", claims.UserName)

        return next(c)
    }
}
```

- [ ] 토큰 추출 로직
- [ ] 토큰 검증
- [ ] Context에 사용자 정보 설정

#### Task 2.4: MC-IAM 연동 미들웨어
**파일:** `internal/middleware/mciam.go`

- [ ] MC-IAM TokenValidMiddleware 포팅
- [ ] MC-IAM SetContextMiddleware 포팅
- [ ] Ticket 기반 API 접근 제어

#### Task 2.5: 인증 핸들러
**파일:** `internal/handler/auth.go`

```go
// POST /api/auth/login
func Login(c echo.Context) error

// POST /api/auth/refresh
func Refresh(c echo.Context) error

// POST /api/auth/validate
func Validate(c echo.Context) error

// POST /api/auth/logout
func Logout(c echo.Context) error

// POST /api/auth/userinfo
func UserInfo(c echo.Context) error
```

- [ ] 로그인 핸들러 (MCIAM/기본)
- [ ] 토큰 갱신 핸들러
- [ ] 토큰 검증 핸들러
- [ ] 로그아웃 핸들러
- [ ] 사용자 정보 핸들러

**산출물:**
- 완전한 인증 시스템
- GORM 기반 세션 관리 (DB 저장, Redis 미사용)
- MC-IAM 연동

---

### Phase 3: 프록시 시스템 마이그레이션 (1-2주)

**목표:** 동적 라우팅 및 백엔드 프록시 기능 구현

#### Task 3.1: API 스펙 파서
**파일:** `internal/config/api_spec.go`

```go
type ApiSpec struct {
    Services       map[string]Service
    ServiceActions map[string]map[string]ActionSpec
}

type Service struct {
    Version string
    BaseURL string
    Auth    AuthConfig
}

type ActionSpec struct {
    Method       string
    ResourcePath string
    Description  string
}

func LoadApiSpec(path string) (*ApiSpec, error)
func (s *ApiSpec) GetAction(subsystem, operationId string) (*Service, *ActionSpec, error)
```

- [ ] api.yaml 파싱
- [ ] 서비스/액션 조회 메서드
- [ ] 캐싱 로직

#### Task 3.2: HTTP 프록시 클라이언트
**파일:** `pkg/httpclient/proxy_client.go`

```go
type ProxyClient struct {
    client *http.Client
}

func (p *ProxyClient) Call(
    method string,
    url string,
    auth string,
    body []byte,
) (*http.Response, error)
```

- [ ] HTTP 클라이언트 구현
- [ ] 타임아웃 설정
- [ ] Retry 로직
- [ ] 연결 풀링

#### Task 3.3: 프록시 서비스
**파일:** `internal/service/proxy_service.go`

```go
type ProxyService struct {
    apiSpec *config.ApiSpec
    client  *httpclient.ProxyClient
}

func (s *ProxyService) CallBackend(
    subsystem string,
    operationId string,
    req *model.CommonRequest,
    authToken string,
) (*model.CommonResponse, error)
```

- [ ] 백엔드 서비스 호출 로직
- [ ] 인증 헤더 처리
- [ ] PathParams/QueryParams 치환
- [ ] 에러 변환

#### Task 3.4: 프록시 핸들러
**파일:** `internal/handler/proxy.go`

```go
// POST /api/:subsystemName/:operationId
func ProxyHandler(c echo.Context) error {
    subsystem := c.Param("subsystemName")
    operationId := c.Param("operationId")

    var req model.CommonRequest
    if err := c.Bind(&req); err != nil {
        return err
    }

    authToken := extractToken(c)

    resp, err := proxyService.CallBackend(
        subsystem,
        operationId,
        &req,
        authToken,
    )

    if err != nil {
        return err
    }

    return c.JSON(resp.Status.Code, resp)
}
```

- [ ] 동적 라우팅 핸들러
- [ ] Request 바인딩
- [ ] Response 변환

**산출물:**
- 동적 프록시 시스템
- conf/api.yaml 완전 호환
- 백엔드 서비스 연동

---

### Phase 4: Self 핸들러 마이그레이션 (1주)

**목표:** 자체 구현 API 엔드포인트 이식

#### Task 4.1: Disk 관련 API
**파일:** `internal/handler/self/disk.go`

- [ ] POST /api/disklookup
- [ ] POST /api/availabledisktypebyproviderregion

**Buffalo 코드 참조:**
- `handler/self/disk.go`

#### Task 4.2: Menu 관련 API
**파일:** `internal/handler/self/menu.go`

- [ ] POST /api/getmenutree
- [ ] POST /api/createmenuresources

**Buffalo 코드 참조:**
- `handler/self/menu.go`
- `actions/menu.go`

#### Task 4.3: Role 관련 API
**파일:** `internal/handler/self/role.go`

- [ ] POST /api/getplatformroles
- [ ] POST /api/getworkspaceroles

**Buffalo 코드 참조:**
- `handler/self/role.go`
- `actions/role.go`

#### Task 4.4: Workspace/Project 관련 API
**파일:** `internal/handler/self/workspace_project.go`

```go
// POST /api/getwpmappinglistbyworkspaceid
func GetWPMappingListByWorkspaceId(c echo.Context) error

// POST /api/getworkspaceuserrolemappinglistbyuserid
func GetWorkspaceUserRoleMappingListByUserId(c echo.Context) error

// POST /api/createproject
func CreateProject(c echo.Context) error

// POST /api/getprojectlist
func GetProjectList(c echo.Context) error
```

- [ ] Workspace/Project CRUD
- [ ] Mapping 조회 API

**Buffalo 코드 참조:**
- `handler/self/workspaceproject.go`
- `actions/workspaceproject.go`

#### Task 4.5: 기타 API
**파일:** `internal/handler/self/misc.go`

- [ ] POST /api/getapihosts
- [ ] POST /api/getcompanyinfo
- [ ] POST /api/getworkspaceuserrolemappingbytoken

**산출물:**
- 모든 self 핸들러 Echo 버전
- 기능 동등성 보장

---

### Phase 5: 라우팅 및 통합 (1주)

**목표:** 모든 컴포넌트 통합 및 라우팅 완성

#### Task 5.1: 라우터 구성
**파일:** `internal/router/router.go`

```go
func Setup(e *echo.Echo, cfg *config.Config) {
    // Health check (미들웨어 스킵)
    e.GET("/readyz", handler.HealthCheck)

    // API 그룹
    api := e.Group("/api")

    // 인증 라우트 (미들웨어 스킵)
    auth := api.Group("/auth")
    auth.POST("/login", handler.Login)
    auth.POST("/refresh", handler.Refresh)
    auth.POST("/validate", handler.Validate)
    auth.POST("/logout", handler.Logout)
    auth.POST("/userinfo", handler.UserInfo)

    // 보호된 API (인증 미들웨어 적용)
    protected := api.Group("")
    protected.Use(middleware.AuthMiddleware)

    // Self 핸들러
    protected.POST("/disklookup", self.DiskLookup)
    protected.POST("/getmenutree", self.GetMenuTree)
    // ... 기타 self 핸들러

    // 동적 프록시 핸들러
    protected.POST("/:subsystemName/:operationId", handler.ProxyHandler)
}
```

- [ ] 라우트 그룹 구성
- [ ] 미들웨어 적용 순서
- [ ] Skip 로직 구현

#### Task 5.2: MCIAM 모드 분기
**파일:** `internal/router/router.go`

```go
func Setup(e *echo.Echo, cfg *config.Config) {
    if cfg.MCIAM.Use {
        setupMCIAMRoutes(e, cfg)
    } else {
        setupDefaultRoutes(e, cfg)
    }
}
```

- [ ] MCIAM 모드 라우팅
- [ ] 기본 모드 라우팅
- [ ] 설정 기반 분기

#### Task 5.3: 통합 테스트
- [ ] 모든 엔드포인트 동작 확인
- [ ] 인증 플로우 테스트
- [ ] 프록시 호출 테스트

**산출물:**
- 완전한 라우팅 시스템
- 통합된 Echo 서버

---

### Phase 6: 테스트 및 검증 (1주)

**목표:** 품질 보증 및 Buffalo와 동등성 검증

#### Task 6.1: 단위 테스트
- [ ] 모델 테스트
- [ ] 서비스 테스트
- [ ] 핸들러 테스트 (Echo 테스트 프레임워크)
- [ ] 미들웨어 테스트

#### Task 6.2: 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 인증 플로우 통합 테스트
- [ ] 프록시 통합 테스트

#### Task 6.3: Buffalo와 비교 테스트
**방법:** 동일한 요청을 Buffalo/Echo 양쪽에 보내서 응답 비교

```bash
# Buffalo 서버 (기존)
cd api && buffalo dev &

# Echo 서버 (새로운)
cd api && go run cmd/main.go &

# 비교 테스트 스크립트
./scripts/compare_responses.sh
```

- [ ] 모든 엔드포인트 응답 비교
- [ ] 성능 비교 (응답 시간, 메모리)
- [ ] 차이점 문서화

#### Task 6.4: 프론트엔드 통합 테스트
- [ ] Next.js 프론트와 연동
- [ ] Buffalo 프론트와 연동
- [ ] E2E 시나리오 테스트

**산출물:**
- 테스트 커버리지 > 70%
- Buffalo 동등성 검증 리포트
- 성능 비교 리포트

---

### Phase 7: 배포 준비 (1주)

**목표:** 프로덕션 배포 준비

#### Task 7.1: 설정 관리
- [ ] 환경별 설정 파일 (dev/staging/prod)
- [ ] 시크릿 관리 (환경 변수)
- [ ] 설정 검증 로직

#### Task 7.2: Docker 이미지
**파일:** `Dockerfile.echo`

```dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o mc-web-console-api ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/mc-web-console-api .
COPY conf/ ./conf/
EXPOSE 3000
CMD ["./mc-web-console-api"]
```

- [ ] Dockerfile 작성
- [ ] Docker Compose 설정
- [ ] 이미지 빌드 테스트

#### Task 7.3: CI/CD 파이프라인
- [ ] GitHub Actions 워크플로우
- [ ] 자동 테스트
- [ ] 자동 빌드
- [ ] 이미지 푸시

#### Task 7.4: 모니터링 & 로깅
- [ ] 구조화된 로깅 (Zap/Zerolog)
- [ ] 메트릭 수집 (Prometheus)
- [ ] Health check 엔드포인트 강화

**산출물:**
- Docker 이미지
- CI/CD 파이프라인
- 배포 문서

---

## 🧪 테스트 전략

### 1. 단위 테스트
```go
// internal/service/proxy_service_test.go
func TestProxyService_CallBackend(t *testing.T) {
    // Mock HTTP 서버
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(200)
        w.Write([]byte(`{"status": {"code": 200}, "responseData": []}`))
    }))
    defer server.Close()

    // 테스트 실행
    service := NewProxyService(mockApiSpec, mockClient)
    resp, err := service.CallBackend("mc-iam-manager", "GetWorkspaceList", &req, "token")

    assert.NoError(t, err)
    assert.Equal(t, 200, resp.Status.Code)
}
```

### 2. 통합 테스트
```go
// internal/handler/proxy_test.go
func TestProxyHandler(t *testing.T) {
    e := echo.New()
    req := httptest.NewRequest(http.MethodPost, "/api/mc-iam-manager/GetWorkspaceList", body)
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)

    if assert.NoError(t, ProxyHandler(c)) {
        assert.Equal(t, http.StatusOK, rec.Code)
        // 응답 검증
    }
}
```

### 3. E2E 테스트
```bash
# scripts/e2e_test.sh
#!/bin/bash

# Echo 서버 시작
go run cmd/main.go &
SERVER_PID=$!

# 테스트 실행
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'

# 서버 종료
kill $SERVER_PID
```

---

## ⚠️ 위험 요소 및 대응 방안

### 위험 1: Buffalo Context → Echo Context 호환성
**영향:** 높음
**대응:**
- Context 추상화 레이어 구현
- 단계별 마이그레이션으로 검증

### 위험 2: Pop → GORM 데이터 마이그레이션
**영향:** 중간
**대응:**
- 스키마 호환성 사전 검증
- 마이그레이션 스크립트 작성
- 롤백 계획 수립

### 위험 3: 성능 저하
**영향:** 낮음
**대응:**
- 벤치마크 테스트 (Buffalo vs Echo)
- 프로파일링 및 최적화
- 캐싱 전략 도입

### 위험 4: 프론트엔드 호환성 문제
**영향:** 높음
**대응:**
- API 응답 포맷 완전 동일하게 유지
- 통합 테스트로 사전 검증
- 점진적 트래픽 전환

### 위험 5: MC-IAM 연동 이슈
**영향:** 높음
**대응:**
- MC-IAM 팀과 협업
- 연동 테스트 환경 구축
- Fallback 메커니즘

---

## 🔄 롤백 계획

### 시나리오 1: Echo 서버 장애
1. 즉시 Buffalo 서버로 트래픽 전환
2. Echo 서버 중단
3. 로그 분석 및 원인 파악
4. 수정 후 재배포

### 시나리오 2: 데이터 정합성 문제
1. Echo 서버 중단
2. Buffalo 서버로 롤백
3. 데이터베이스 복구
4. 마이그레이션 스크립트 수정

### 시나리오 3: 성능 이슈
1. 트래픽 비율 조정 (Echo 감소)
2. 성능 프로파일링
3. 최적화 또는 Buffalo 유지 결정

---

## 📊 성공 지표 (KPI)

### 기능 요구사항
- [ ] 모든 Buffalo API 엔드포인트 Echo에서 동작
- [ ] 응답 포맷 100% 동일
- [ ] 인증/인가 기능 완전 동작

### 성능 요구사항
- [ ] 평균 응답 시간: Buffalo와 동등 또는 향상
- [ ] 처리량(TPS): Buffalo와 동등 또는 향상
- [ ] 메모리 사용량: 현재 대비 +20% 이내

### 품질 요구사항
- [ ] 테스트 커버리지 > 70%
- [ ] 중대한 버그 0건
- [ ] 프로덕션 장애 0건

---

## 📝 체크리스트

### Phase 0: 준비
- [ ] Go 1.25+ 설치
- [ ] Echo v4 의존성 추가
- [ ] GORM v2 의존성 추가
- [ ] 프로젝트 구조 생성
- [ ] Git 브랜치 `mig-echo-api` 생성

### Phase 1: 코어 인프라
- [ ] Echo 서버 실행
- [ ] Health check 동작
- [ ] 공통 모델 정의
- [ ] 기본 미들웨어 구현
- [ ] 에러 처리 시스템

### Phase 2: 인증 시스템
- [ ] GORM 세션 모델
- [ ] JWT 유틸리티
- [ ] 인증 미들웨어
- [ ] MC-IAM 연동
- [ ] 인증 핸들러 5개

### Phase 3: 프록시 시스템
- [ ] api.yaml 파서
- [ ] HTTP 프록시 클라이언트
- [ ] 프록시 서비스
- [ ] 동적 라우팅 핸들러

### Phase 4: Self 핸들러
- [ ] Disk API (2개)
- [ ] Menu API (2개)
- [ ] Role API (2개)
- [ ] Workspace/Project API (4개)
- [ ] 기타 API (3개)

### Phase 5: 통합
- [ ] 라우터 구성
- [ ] MCIAM/기본 모드 분기
- [ ] 통합 테스트

### Phase 6: 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] Buffalo 비교 테스트
- [ ] 프론트엔드 통합 테스트

### Phase 7: 배포
- [ ] 환경별 설정
- [ ] Docker 이미지
- [ ] CI/CD 파이프라인
- [ ] 모니터링 설정

---

## 🚀 실행 시작

### 다음 액션
1. ✅ 이 계획 검토 및 승인
2. ⏭️ Phase 0 시작: 의존성 설치
3. ⏭️ 첫 번째 커밋: 프로젝트 구조 생성

### 첫 번째 명령어
```bash
cd ~/goland/mc-web-console/mig-echo-api/api

# Echo 설치
go get github.com/labstack/echo/v4
go get github.com/labstack/echo/v4/middleware

# GORM 설치
go get gorm.io/gorm
go get gorm.io/driver/postgres

# 기타 의존성
go get github.com/spf13/viper
go get github.com/golang-jwt/jwt/v5

# 프로젝트 구조 생성
mkdir -p internal/{config,middleware,handler/self,service,repository,model,router}
mkdir -p pkg/{httpclient,jwt,errors}
mkdir -p cmd

# go.mod 업데이트
go mod tidy
```

---

## 📚 참고 자료

- [Echo 공식 문서](https://echo.labstack.com/)
- [GORM 공식 문서](https://gorm.io/)
- [Buffalo → Echo 마이그레이션 가이드](https://echo.labstack.com/guide/)
- 기존 Buffalo 코드: `/home/nobang/goland/mc-web-console/develop/api/`

---

**작성일:** 2026-02-02
**작성자:** Claude (AI Assistant)
**브랜치:** mig-echo-api
**상태:** 계획 단계 - 승인 대기
