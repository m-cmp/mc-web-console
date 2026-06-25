/**
 * deploy/registry/tc/cost.registry.ts
 * COST 도메인 TC 전체 목록 (5개)
 *
 * Feature 코드:
 *   BILL   — 청구·비용 API 조회
 *   IFRAME — Cost Analysis iframe 화면 테스트
 */
import type { TCEntry } from '../types';

export const COST_TC_REGISTRY: TCEntry[] = [
  { id: 'TC-COST-BILL-01', domain: 'cost', feature: 'BILL', title: 'API 호스트 조회', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-01-getApiHosts.spec.ts' },
  { id: 'TC-COST-BILL-02', domain: 'cost', feature: 'BILL', title: '당월 청구 조회', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-02-getCurMonthBill.spec.ts' },
  { id: 'TC-COST-BILL-03', domain: 'cost', feature: 'BILL', title: 'Top5 청구 조회', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-03-getTop5Bill.spec.ts' },
  { id: 'TC-COST-BILL-04', domain: 'cost', feature: 'BILL', title: '자산별 청구 조회', status: 'ready', channel: 'api', specFile: 'mc-web-console/specs/cost/TC-COST-BILL-04-getBillAsset.spec.ts' },
  { id: 'TC-COST-IFRAME-01', domain: 'cost', feature: 'IFRAME', title: 'Cost Analysis iframe 화면', status: 'ready', channel: 'ui', specFile: 'mc-web-console/specs/cost/TC-COST-IFRAME-cost-analysis-iframe.spec.ts' },
];
