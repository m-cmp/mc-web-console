/**
 * deploy/params/base/tc/sw/TC-APP-DEP-01.params.ts
 * TC-APP-DEP-01: SW 배포 — VM Standalone
 * TC-APP-DEP-02: SW 배포 — VM Clustering   (같은 파일 공유)
 * TC-APP-DEP-03: SW 배포 — K8s Helm        (같은 파일 공유, 'k8s' variant)
 *
 * 런타임 IN params:
 *   store.require('mciId')    — TC-INFRA-MCI-03 OUT
 *   store.require('mciName')  — TC-INFRA-MCI-03 OUT
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:        'default',
    appName:     'tc-nginx',
    catalogName: 'nginx',
    version:     'latest',
    // mciId, mciName 은 런타임 스토어에서 주입
  },
  variants: {
    standalone: {
      deployType:  'standalone',
      replicaCount: 1,
    },
    clustering: {
      deployType:  'clustering',
      replicaCount: 3,
    },
    k8s: {
      deployType:   'k8s',
      helmChartUrl: '',   // 시나리오 params 또는 env 에서 주입
      namespace:    'default',
    },
  },
} satisfies TCParams;
