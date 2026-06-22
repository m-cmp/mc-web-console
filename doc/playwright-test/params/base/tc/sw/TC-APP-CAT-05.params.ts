/**
 * deploy/params/base/tc/sw/TC-APP-CAT-05.params.ts
 * TC-APP-CAT-05: Catalog 신규 등록
 * TC-APP-CAT-06: Catalog 수정   (같은 파일 공유)
 * TC-APP-CAT-07: Catalog 삭제   (같은 파일 공유)
 *
 * 런타임 OUT params (TC-APP-CAT-05):
 *   store.set('catalogName', catalogName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    catalogName:        'e2e-catalog',
    catalogDescription: 'E2E 테스트 카탈로그',
    catalogVersion:     '1.0.0',
    catalogType:        'helm',
    repoName:           'e2e-repo-helm',    // TC-APP-REP-02 OUT 과 연계
    chartPath:          'nginx/nginx',
    chartVersion:       '15.0.0',
  },
} satisfies TCParams;
