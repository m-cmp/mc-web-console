/**
 * deploy/registry/tc/infra.registry.ts
 * INFRA 도메인 TC 전체 목록 (11개)
 *
 * Feature 코드:
 *   MCI          — 멀티 클라우드 인프라 (생성·조회·라이프사이클·삭제)
 *   MCI-WORKLOAD — MCI 워크로드 (터미널·파일·role별 기능)
 *   SSH-KEY      — SSH 키 CRUD
 *
 * CSP variant:
 *   TC-INFRA-MCI-03 는 CSP별로 다른 param을 사용한다.
 *   deploy/params/base/tc/infra/TC-INFRA-MCI-03.params.ts 의
 *   variants.{aws|azure|gcp|ali|ibm|nhn|tencent} 참조.
 */
import type { TCEntry } from '../types';

export const INFRA_TC_REGISTRY: TCEntry[] = [

  // ── MCI (5) ──────────────────────────────────────────────────────────────
  {
    id: 'TC-INFRA-MCI-01',
    domain: 'infra', feature: 'MCI',
    title: 'MCI 목록 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-01-list-mci.spec.ts',
  },
  {
    id: 'TC-INFRA-MCI-02',
    domain: 'infra', feature: 'MCI',
    title: 'MCI 단건 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-02-get-mci.spec.ts',
  },
  {
    id: 'TC-INFRA-MCI-03',
    domain: 'infra', feature: 'MCI',
    title: 'MCI 생성',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-03-create-mci.spec.ts',
    tags: ['csp-variant'],
    // CSP variant: TC_VARIANT=aws|azure|gcp|ali|ibm|nhn|tencent 로 실행
  },
  {
    id: 'TC-INFRA-MCI-04',
    domain: 'infra', feature: 'MCI',
    title: 'MCI 라이프사이클 (suspend·resume·reboot)',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-04-mci-lifecycle.spec.ts',
  },
  {
    id: 'TC-INFRA-MCI-05',
    domain: 'infra', feature: 'MCI',
    title: 'MCI 삭제',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-05-delete-mci.spec.ts',
  },

  // ── MCI-WORKLOAD (3) ─────────────────────────────────────────────────────
  {
    id: 'TC-INFRA-MCI-WORKLOAD-01',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (admin) — 터미널 접속',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-01~02-mci-workload-admin.spec.ts',
    tags: ['role:admin'],
  },
  {
    id: 'TC-INFRA-MCI-WORKLOAD-02',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (admin) — 파일 전송',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-01~02-mci-workload-admin.spec.ts',
    tags: ['role:admin'],
  },
  {
    id: 'TC-INFRA-MCI-WORKLOAD-03',
    domain: 'infra', feature: 'MCI-WORKLOAD',
    title: 'MCI 워크로드 (viewer) — 접근 제한 확인',
    status: 'ready', channel: 'ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-MCI-WORKLOAD-03-mci-workload-viewer.spec.ts',
    tags: ['role:viewer'],
  },

  // ── SSH-KEY (3) ──────────────────────────────────────────────────────────
  {
    id: 'TC-INFRA-SSH-KEY-01',
    domain: 'infra', feature: 'SSH-KEY',
    title: 'SSH 키 목록 조회',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-01-list-ssh-keys.spec.ts',
  },
  {
    id: 'TC-INFRA-SSH-KEY-02',
    domain: 'infra', feature: 'SSH-KEY',
    title: 'SSH 키 생성',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-02-create-ssh-key.spec.ts',
  },
  {
    id: 'TC-INFRA-SSH-KEY-03',
    domain: 'infra', feature: 'SSH-KEY',
    title: 'SSH 키 삭제',
    status: 'ready', channel: 'api+ui',
    specFile: 'mc-web-console/specs/infra/TC-INFRA-SSH-KEY-03-delete-ssh-key.spec.ts',
  },
];
