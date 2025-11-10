# 001_fix_api_error_toast

## 현상

- MCI Workload 화면에서 getAllMci API 에러 발생 시 로그인 화면으로 리다이렉트됨
- 사용자가 작업 중이던 화면을 벗어나 사용성 저하
- alert 창으로 에러 메시지를 표시하여 사용자 경험 불편
- 모든 API 에러가 동일하게 로그인 페이지로 이동하는 문제

## 해결방법

### Toast 알림 시스템 도입

1. **Toast 유틸리티 함수 구현**
   - Bootstrap Toast를 활용한 알림 시스템 추가
   - 4가지 타입 지원: success, error, warning, info
   - 자동 사라짐 기능 (기본 5초)
   - 오른쪽 상단에 표시되도록 구현

2. **에러 처리 개선**
   - alert() 호출을 showToast() 호출로 전면 교체
   - 401 에러만 로그인 페이지로 리다이렉트
   - 기타 에러(403, 500, 네트워크 오류 등)는 toast 메시지만 표시
   - 사용자가 현재 작업 화면에 머물 수 있도록 개선

3. **에러 타입별 메시지 구분**
   - 401 (Unauthorized): 로그인 페이지로 리다이렉트
   - 403 (Forbidden): 권한 부족 메시지
   - 429 (Too Many Requests): 요청 과다 경고
   - 500 (Internal Server Error): 서버 오류 안내
   - 네트워크 오류: 연결 실패, 타임아웃 등

## 수정내역

### 1. 신규 파일
없음 (기존 파일 수정)

### 2. 수정 파일

#### `front/assets/js/common/util.js`
- **추가**: `showToast(message, type, duration)` 함수
  - Toast 컨테이너 동적 생성
  - 타입별 색상 및 아이콘 설정
  - Bootstrap Toast API 활용
  - 자동 제거 기능 구현

```javascript
export function showToast(message, type = 'info', duration = 5000) {
  // Toast container 생성 및 메시지 표시
  // 타입: success, error, warning, info
}
```

#### `front/assets/js/common/api/http.js`
- **수정**: `commonAPIPost()` 함수의 에러 처리
  - 모든 `alert()` 호출을 `webconsolejs["common/util"].showToast()` 호출로 변경
  - 401 에러 처리 로직 유지 (로그인 페이지 리다이렉트)
  - 기타 HTTP 에러에서 로그인 리다이렉트 제거
  - 에러 타입별 적절한 toast 메시지 표시

- **수정**: `commonAPIPostWithoutRetry()` 함수의 에러 처리
  - 모든 `alert()` 호출을 toast로 변경
  - 일관된 에러 처리 방식 적용

### 3. 테스트 결과
- ✅ Toast 메시지가 오른쪽 상단에 정상 표시
- ✅ 에러 발생 시 현재 페이지 유지
- ✅ 401 에러만 로그인 페이지로 리다이렉트
- ✅ 메시지 자동 사라짐 확인
- ✅ 사용자 경험 개선 확인

### 4. 적용 브랜치
- **브랜치명**: `fix_050`
- **기반 브랜치**: `develop`
- **커밋 해시**: `6cad6e0`
- **커밋 일시**: 2025-11-03

### 5. 코딩 스타일 준수
- ✅ 들여쓰기: 2칸
- ✅ 따옴표: 작은따옴표(')
- ✅ 세미콜론: 모든 구문 끝에 사용
- ✅ 주석: 슬래시 두 개(//) 사용
- ✅ 함수명: camelCase
- ✅ JSDoc 주석 추가

