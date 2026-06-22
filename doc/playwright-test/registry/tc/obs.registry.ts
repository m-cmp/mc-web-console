/**
 * deploy/registry/tc/obs.registry.ts
 * OBS(Observability) 도메인 TC 전체 목록 (6개)
 *
 * Feature 코드:
 *   MON-CONFIG  — 모니터링 대상 등록·에이전트 설치
 *   MON-DATA    — 모니터링 데이터 화면
 *   MON-INSIGHT — 모니터링 인사이트
 *   LOG         — 로그 조회
 *   TRACE       — 트레이싱 조회
 */
import type { TCEntry } from '../types';

export const OBS_TC_REGISTRY: TCEntry[] = [
  { id: 'TC-OBS-MON-CONFIG-01', domain: 'obs', feature: 'MON-CONFIG', title: '모니터링 대상 목록 조회', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-MON-CONFIG-01-list-monitoring-targets.spec.ts' },
  { id: 'TC-OBS-MON-CONFIG-02', domain: 'obs', feature: 'MON-CONFIG', title: '모니터링 에이전트 설치', status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-MON-CONFIG-02-install-monitoring-agent.spec.ts' },
  { id: 'TC-OBS-MON-DATA-01',   domain: 'obs', feature: 'MON-DATA',   title: '모니터링 데이터 화면',   status: 'ready', channel: 'ui',     specFile: 'mc-web-console/specs/obs/TC-OBS-MON-DATA-01-monitoring-data-screen.spec.ts' },
  { id: 'TC-OBS-MON-INSIGHT-01',domain: 'obs', feature: 'MON-INSIGHT',title: '모니터링 인사이트',       status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-MON-INSIGHT-01-monitoring-insight.spec.ts' },
  { id: 'TC-OBS-LOG-01',         domain: 'obs', feature: 'LOG',        title: '로그 목록 조회',          status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-LOG-01-list-logs.spec.ts' },
  { id: 'TC-OBS-TRACE-01',       domain: 'obs', feature: 'TRACE',      title: '트레이스 목록 조회',      status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/obs/TC-OBS-TRACE-01-list-traces.spec.ts' },
];
