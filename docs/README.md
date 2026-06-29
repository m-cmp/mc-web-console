# mc-web-console Documentation

프로젝트 문서는 역할별 하위 폴더로 구분합니다.

| 폴더 | 용도 |
|------|------|
| [api/](api/) | mc-web-console API Swagger UI 및 OpenAPI spec |
| [development/](development/) | 버그 목록, 수정 기록 |
| [manual-testing/](manual-testing/) | 수동 테스트 시나리오 및 결과 |
| [e2e-snapshot/](e2e-snapshot/) | `mcmp-e2e/deploy/` 외부 배포용 읽기 전용 스냅샷 |

## E2E 스냅샷 동기화

E2E 테스트 코드의 canonical source는 [mcmp-e2e](https://github.com/m-cmp/mcmp-e2e)입니다.
`e2e-snapshot/`은 외부 배포용 mirror이며, **mcmp-e2e** 저장소에서 sync 스크립트로 반영합니다.

```bash
# mcmp-e2e 저장소에서 실행
./scripts/sync-to-mc-web-console.sh
```

## API 문서

- Swagger UI: [docs/api/index.html](api/index.html) (GitHub Pages)
- OpenAPI spec: [docs/api/swagger.json](api/swagger.json)
- spec 재생성: `./scripts/generate-swagger.sh` (swag CLI 필요)
