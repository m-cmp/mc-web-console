/**
 * deploy/params/base/scenarios/C4-001.params.ts
 * C4-001: 직접 인프라 생성 시나리오 — 서비스 생성 (인프라 배포 중심)
 *
 * Spec 검색 (ISSUE-012):
 *   - Priority option: seoul
 *   - vCPU max: 4, Cost max: 1
 *   - C4_SPEC_NOT_FOUND_MODE=fail|fallback (기본 fail)
 *
 * MCI 중복:
 *   - C4_MCI_DUPLICATE_MODE=rename|duplicate (기본 rename)
 */
import type { ScenarioStaticParams } from '../../types';

export default {
  global: {
    nsId: 'default',
    mciName:        'e2e-mci-c4',
    specSearch: {
      priorityRegion: 'seoul',
      maxCpu:         4,
      maxCost:        1,
      notFoundMode:   'fail',
      specKeywords:   ['t3a.small', 'c4.large', 'small'],
    },
    mciDuplicateMode: 'rename',
  },
  steps: {
    'TC-INFRA-MCI-03': {
      mciName:        'c4-001-mci',
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.small',
      specSearch: {
        priorityRegion: 'seoul',
        maxCpu:         4,
        maxCost:        1,
        notFoundMode:   'fail',
      },
    },
    'TC-APP-DEP-01': {
      appName:     'c4-001-nginx',
      catalogName: 'nginx',
      version:     'latest',
      deployType:  'standalone',
    },
    'TC-OBS-METRIC-01': {
      metricType: 'cpu',
      periodSec:  60,
    },
  },
} satisfies ScenarioStaticParams;
