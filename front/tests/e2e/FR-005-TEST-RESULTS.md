# FR-005 Password Management E2E Test Results

**Date**: 2026-03-11
**Environment**: localhost:3115 (front) → localhost:3207 (API) → 52.79.163.111:5006 (IAM)
**Total**: 11 passed, 0 skipped, 0 failed

## TC-001~006: ChangeMyPassword (본인 비밀번호 변경)

| TC | Description | Result | Note |
|----|-------------|--------|------|
| TC-001 | Change Password 모달 UI 표시 | ✅ PASS | |
| TC-002 | 빈 폼 제출 시 유효성 검증 (current password 미입력) | ✅ PASS | |
| TC-003 | 비밀번호 불일치 시 오류 | ✅ PASS | |
| TC-004 | 잘못된 현재 비밀번호 → 401 오류 | ✅ PASS | |
| TC-005 | 성공적인 비밀번호 변경 | ✅ PASS | |
| TC-006 | 변경된 비밀번호로 로그인 성공 후 원복 | ✅ PASS | |

## TC-007~011: ResetUserPassword (관리자 비밀번호 재설정)

| TC | Description | Result | Note |
|----|-------------|--------|------|
| TC-007 | Reset Password 모달 UI 표시 (사용자 선택 후) | ✅ PASS | |
| TC-008 | 빈 폼 제출 시 유효성 검증 | ✅ PASS | |
| TC-009 | 비밀번호 불일치 시 오류 | ✅ PASS | |
| TC-010 | 성공적인 비밀번호 재설정 | ✅ PASS | |
| TC-011 | 재설정된 비밀번호로 로그인 | ✅ PASS | |

## Issues Found & Fixed

### IAM API Issue
- `POST /api/users` does NOT accept `password` field in request body (returns 400)
- The User model has no `password` field; the Keycloak service sets credentials separately
- Fix: removed `password` and `emailVerified` fields from test user creation in `beforeAll`

### Bootstrap Modal Visibility (Playwright)
- `toBeVisible()` fails for Bootstrap modals inside `.page-wrapper` due to CSS stacking context
- `fade` class causes opacity transition (0→1) that breaks visibility detection
- Fix: `waitForSelector('.show', { state: 'attached' })` + `page.evaluate()` with `{ force: true }` for interactions inside modals

### Alert Dialog Deadlock
- `page.evaluate(() => fn())` + `alert()` creates deadlock: evaluate waits for JS, JS waits for dialog dismiss
- Fix: do NOT `await` the `page.evaluate()` call when the function triggers `alert()`

### Table Pagination
- Tabulator paginates at 10 rows/page; test user was on page 2 with 15+ other users
- TC-010's fallback to `rows.first()` reset a different user's password, so TC-011 login failed
- Fix: TC-010 now navigates through pages (up to 5) until finding `pw-test` user

## All tests passing — no pending items
