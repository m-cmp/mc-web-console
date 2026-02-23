# 파일 구조 및 코드 매핑

## 📁 전체 디렉토리 구조

```
mig-echo-api/
├── api/                           # Echo API (새로 생성)
│   ├── cmd/
│   │   └── main.go               # 서버 엔트리포인트
│   ├── internal/
│   │   ├── config/
│   │   │   ├── config.go         # 전체 설정 관리
│   │   │   └── api_spec.go       # api.yaml 파서
│   │   ├── handler/
│   │   │   └── self/             # 자체 구현 API (예정)
│   │   ├── middleware/
│   │   │   ├── logger.go         # 커스텀 로거
│   │   │   ├── cors.go           # CORS 설정
│   │   │   ├── recovery.go       # Panic 복구
│   │   │   └── request_id.go    # Request ID
│   │   ├── model/
│   │   │   ├── request.go        # CommonRequest
│   │   │   ├── response.go       # CommonResponse
│   │   │   └── session.go        # UserSession
│   │   ├── repository/
│   │   │   ├── database.go       # GORM 초기화
│   │   │   └── session_repository.go  # 세션 CRUD
│   │   ├── router/               # 라우팅 (예정)
│   │   └── service/              # 비즈니스 로직 (예정)
│   ├── pkg/
│   │   ├── errors/
│   │   │   ├── errors.go         # AppError 타입
│   │   │   └── handler.go        # 에러 핸들러
│   │   ├── httpclient/           # HTTP 클라이언트 (예정)
│   │   └── jwt/                  # JWT 유틸 (예정)
│   ├── conf/
│   │   └── api.yaml              # API 스펙 (복사)
│   ├── migrations/               # DB 마이그레이션 (복사)
│   ├── go.mod
│   └── go.sum
│
├── api_buffalo/                   # Buffalo API (보존)
│   ├── actions/
│   │   ├── app.go
│   │   ├── auth.go
│   │   ├── routes.go
│   │   └── ...
│   ├── handler/
│   │   ├── http-util.go
│   │   ├── mciammanager/
│   │   └── self/
│   ├── models/
│   └── ...
│
├── mc-web-console-spec/          # 문서화
│   └── 00_workflow/
│       └── 00_mig-plan-api/
│           ├── 00_overview.md
│           ├── 01_phase0-complete.md
│           ├── 02_phase1-complete.md
│           ├── 03_next-steps.md
│           └── 04_file-structure.md (이 파일)
│
└── ECHO_MIGRATION_PLAN.md        # 마스터 계획서
```

---

## 🔄 Buffalo → Echo 파일 매핑

### 1. 설정 관리

| Buffalo | Echo | 설명 |
|---------|------|------|
| 환경 변수 직접 사용 | `internal/config/config.go` | Viper 기반 통합 설정 |
| `conf/api.yaml` | `internal/config/api_spec.go` | API 스펙 파서 |
| `actions/env.go` | `config.ServerConfig` | 서버 설정 구조화 |

### 2. 미들웨어

| Buffalo | Echo | 설명 |
|---------|------|------|
| `buffalo.Middleware` | `internal/middleware/logger.go` | 로거 |
| CORS 설정 | `internal/middleware/cors.go` | CORS |
| `buffalo.Recover` | `internal/middleware/recovery.go` | Panic 복구 |
| - | `internal/middleware/request_id.go` | Request ID (신규) |

### 3. 핸들러

| Buffalo | Echo | 설명 |
|---------|------|------|
| `actions/routes.go` | `cmd/main.go` | 라우팅 설정 |
| `handler/http-util.go` | `internal/model/request.go` | CommonRequest |
| `handler/http-util.go` | `internal/model/response.go` | CommonResponse |
| `handler/http-util.go` | `pkg/errors/handler.go` | 에러 핸들러 |

### 4. 데이터 모델

| Buffalo | Echo | 설명 |
|---------|------|------|
| `models/usersess.go` (Pop) | `internal/model/session.go` (GORM) | 세션 모델 |
| `models/models.go` | `internal/repository/database.go` | DB 초기화 |

### 5. 비즈니스 로직

| Buffalo | Echo | 설명 |
|---------|------|------|
| `actions/auth.go` | `internal/handler/auth.go` (예정) | 인증 핸들러 |
| `actions/menu.go` | `internal/handler/self/menu.go` (예정) | 메뉴 핸들러 |
| `actions/workspaceproject.go` | `internal/handler/self/workspace_project.go` (예정) | Workspace/Project |

---

## 📊 코드 라인 비교

### Phase 0-1 완료 시점

| 구분 | Buffalo | Echo | 비율 |
|------|---------|------|------|
| **설정** | ~200 | ~200 | 100% |
| **미들웨어** | ~150 | ~110 | 73% |
| **모델** | ~100 | ~170 | 170% |
| **핸들러** | ~300 | ~50 | 17% |
| **에러 처리** | ~100 | ~150 | 150% |
| **DB** | ~150 | ~170 | 113% |
| **총합** | ~1000 | ~850 | 85% |

**분석**:
- 에러 처리: Echo가 더 체계적 (+50%)
- 모델: 타입 안전성 강화 (+70%)
- 핸들러: 아직 미구현 (-83%)

---

## 🎯 구현 우선순위

### High Priority (Phase 2)
```
internal/
├── service/
│   └── session_service.go        # 세션 비즈니스 로직
├── handler/
│   └── auth.go                   # 인증 API
└── middleware/
    └── auth.go                   # 인증 미들웨어

pkg/
└── jwt/
    └── jwt.go                    # JWT 처리
```

### Medium Priority (Phase 3)
```
internal/
├── service/
│   └── proxy_service.go          # 프록시 서비스
└── handler/
    └── proxy.go                  # 동적 프록시 핸들러

pkg/
└── httpclient/
    └── proxy_client.go           # HTTP 클라이언트
```

### Low Priority (Phase 4-5)
```
internal/
├── handler/
│   └── self/
│       ├── disk.go               # Disk API
│       ├── menu.go               # Menu API
│       ├── role.go               # Role API
│       └── workspace_project.go  # Workspace/Project API
└── router/
    ├── router.go                 # 메인 라우터
    ├── auth_routes.go            # 인증 라우트
    └── api_routes.go             # API 라우트
```

---

## 📝 파일별 책임

### `cmd/main.go`
- 서버 초기화
- 미들웨어 체인 설정
- 라우팅 설정
- 서버 시작

### `internal/config/`
- 설정 파일 로드 (Viper)
- 환경 변수 관리
- api.yaml 파싱

### `internal/middleware/`
- 요청 전처리
- 인증/인가
- 로깅
- 에러 복구

### `internal/handler/`
- HTTP 요청 처리
- 입력 검증
- 응답 생성

### `internal/service/`
- 비즈니스 로직
- 트랜잭션 관리
- 외부 API 호출

### `internal/repository/`
- 데이터 접근
- CRUD 연산
- 쿼리 최적화

### `internal/model/`
- 데이터 구조 정의
- 검증 규칙
- 직렬화/역직렬화

### `pkg/`
- 재사용 가능한 유틸리티
- 외부에서 import 가능
- 프레임워크 독립적

---

## 🔍 의존성 그래프

```
cmd/main.go
  ├── internal/config
  ├── internal/middleware
  │   ├── pkg/jwt
  │   └── internal/model
  ├── internal/handler
  │   ├── internal/service
  │   │   ├── internal/repository
  │   │   │   └── internal/model
  │   │   └── pkg/httpclient
  │   └── internal/model
  └── pkg/errors
```

**규칙**:
- `internal/` → `pkg/` ✅
- `pkg/` → `internal/` ❌
- `internal/handler` → `internal/service` → `internal/repository` ✅

---

## 📐 네이밍 컨벤션

### 파일명
- 소문자, 언더스코어 사용
- 예: `session_repository.go`, `auth_middleware.go`

### 패키지명
- 소문자, 단수형
- 예: `handler`, `middleware`, `model`

### 타입명
- PascalCase
- 예: `CommonRequest`, `SessionRepository`

### 함수명
- camelCase (private)
- PascalCase (public)
- 예: `parseToken()`, `NewSessionRepository()`

---

## 🧪 테스트 파일 구조 (예정)

```
api/
├── internal/
│   ├── config/
│   │   ├── config.go
│   │   └── config_test.go        # 단위 테스트
│   ├── middleware/
│   │   ├── auth.go
│   │   └── auth_test.go          # 단위 테스트
│   └── handler/
│       ├── auth.go
│       └── auth_test.go          # 통합 테스트
└── test/
    ├── integration/               # 통합 테스트
    │   └── auth_flow_test.go
    └── e2e/                       # E2E 테스트
        └── api_test.go
```

---

**작성일**: 2026-02-02
**작성자**: Claude (AI Assistant)
