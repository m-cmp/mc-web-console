# 다음 단계 계획

## 🎯 Phase 2: 인증 시스템 마이그레이션

**예상 소요**: 1주일
**우선순위**: 높음

---

## 📋 Phase 2 세부 작업

### Task 2.1: JWT 처리 구현
**파일**: `pkg/jwt/jwt.go`

```go
type Claims struct {
    UserID    string
    UserName  string
    Email     string
    Role      string
    // ...
}

func ParseToken(tokenString string) (*Claims, error)
func GenerateToken(claims *Claims) (string, error)
func RefreshToken(refreshToken string) (string, error)
```

**체크리스트**:
- [ ] Claims 구조체 정의
- [ ] JWT 파싱 함수
- [ ] JWT 생성 함수
- [ ] 토큰 검증 로직
- [ ] Refresh token 처리

---

### Task 2.2: 인증 미들웨어
**파일**: `internal/middleware/auth.go`

```go
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        token := extractToken(c)
        claims, err := jwt.ParseToken(token)
        if err != nil {
            return errors.NewUnauthorized("Invalid token")
        }
        c.Set("userId", claims.UserID)
        return next(c)
    }
}
```

**체크리스트**:
- [ ] 토큰 추출 로직 (Authorization 헤더)
- [ ] 토큰 검증
- [ ] Context에 사용자 정보 설정
- [ ] 옵션: Skip 로직 (특정 경로 제외)

---

### Task 2.3: MC-IAM 연동 미들웨어
**파일**: `internal/middleware/mciam.go`

```go
func MCIAMTokenValidMiddleware(next echo.HandlerFunc) echo.HandlerFunc
func MCIAMSetContextMiddleware(next echo.HandlerFunc) echo.HandlerFunc
func MCIAMTicketMiddleware(next echo.HandlerFunc) echo.HandlerFunc
```

**체크리스트**:
- [ ] Buffalo의 TokenValidMiddleware 포팅
- [ ] SetContextMiddleware 포팅
- [ ] Ticket 기반 API 접근 제어
- [ ] MC-IAM API 호출 클라이언트

---

### Task 2.4: 세션 서비스
**파일**: `internal/service/session_service.go`

```go
type SessionService struct {
    repo *repository.SessionRepository
}

func (s *SessionService) CreateSession(userID, accessToken, refreshToken string) error
func (s *SessionService) ValidateSession(userID string) (bool, error)
func (s *SessionService) RefreshSession(userID, refreshToken string) (*UserSession, error)
func (s *SessionService) DeleteSession(userID string) error
```

**체크리스트**:
- [ ] 세션 생성
- [ ] 세션 검증
- [ ] 세션 갱신
- [ ] 세션 삭제

---

### Task 2.5: 인증 핸들러
**파일**: `internal/handler/auth.go`

**API 엔드포인트**:
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/validate` - 토큰 검증
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/userinfo` - 사용자 정보 조회

**체크리스트**:
- [ ] Login 핸들러 (MCIAM/기본)
- [ ] Refresh 핸들러
- [ ] Validate 핸들러
- [ ] Logout 핸들러
- [ ] UserInfo 핸들러

---

## 🧪 Phase 2 테스트 계획

### 단위 테스트
- [ ] JWT 파싱/생성 테스트
- [ ] 인증 미들웨어 테스트
- [ ] 세션 서비스 테스트

### 통합 테스트
- [ ] 로그인 → 토큰 발급 → API 호출 플로우
- [ ] 토큰 만료 → Refresh → 재호출
- [ ] 로그아웃 → 세션 삭제 확인

### Buffalo 비교 테스트
- [ ] 동일한 로그인 요청 → 응답 비교
- [ ] 토큰 검증 로직 비교
- [ ] 세션 저장 포맷 비교

---

## 📊 Phase 2 성공 지표

| 지표 | 목표 |
|------|------|
| **생성 파일** | 5개 |
| **코드 라인** | ~600줄 |
| **API 엔드포인트** | 5개 |
| **테스트 커버리지** | 60% 이상 |
| **Buffalo 호환성** | 100% |

---

## 🔄 Phase 3 Preview: 프록시 시스템

Phase 2 완료 후 진행할 내용:

### 주요 작업
1. **API 스펙 파서 최적화**
   - 캐싱 로직
   - 성능 개선

2. **HTTP 프록시 클라이언트**
   - Retry 로직
   - 타임아웃 설정
   - 연결 풀링

3. **프록시 서비스**
   - PathParams/QueryParams 치환
   - 인증 헤더 처리
   - 에러 변환

4. **동적 라우팅 핸들러**
   - `POST /api/:subsystemName/:operationId`
   - Buffalo AnyCaller 포팅

---

## 💡 개발 팁

### 1. Buffalo 코드 참조
```bash
# Buffalo 인증 코드 확인
cd ~/goland/mc-web-console/mig-echo-api/api_buffalo/actions
cat auth.go

# Buffalo 미들웨어 확인
cd ~/goland/mc-web-console/mig-echo-api/api_buffalo/handler/mciammanager
cat middleware.go
```

### 2. 테스트 주도 개발
- 핸들러 작성 전에 테스트 케이스 작성
- Buffalo와 동일한 입력 → 동일한 출력 확인

### 3. 점진적 통합
- 기능 단위로 개발 → 테스트 → 통합
- 전체 완성 전에 부분별 동작 확인

---

## 📅 예상 일정

```
Week 1 (현재):
  Day 1-2: Phase 0-1 완료 ✅
  Day 3-5: Phase 2 (인증 시스템)

Week 2:
  Day 1-3: Phase 3 (프록시 시스템)
  Day 4-5: Phase 4 (Self 핸들러) 시작

Week 3:
  Day 1-2: Phase 4 완료
  Day 3-5: Phase 5 (통합 및 라우팅)

Week 4:
  Day 1-2: Phase 6 (테스트 및 검증)
  Day 3-5: Phase 7 (배포 준비)
```

---

## 🎓 학습 자료

### Echo 공식 문서
- [Echo Guide](https://echo.labstack.com/guide/)
- [Middleware](https://echo.labstack.com/middleware/)
- [Custom Context](https://echo.labstack.com/guide/context/)

### GORM 문서
- [GORM Guides](https://gorm.io/docs/)
- [Associations](https://gorm.io/docs/associations.html)

### JWT 구현
- [golang-jwt/jwt](https://github.com/golang-jwt/jwt)

---

**작성일**: 2026-02-02
**작성자**: Claude (AI Assistant)
