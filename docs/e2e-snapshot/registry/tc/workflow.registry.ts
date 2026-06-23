/**
 * deploy/registry/tc/workflow.registry.ts
 * WORKFLOW 도메인 TC 전체 목록 (5개)
 *
 * Feature 코드:
 *   WF-FLOW  — 워크플로우 플로우 정의 (노드·연결)
 *   WORKFLOW — 워크플로우 CRUD + 실행
 */
import type { TCEntry } from '../types';

export const WORKFLOW_TC_REGISTRY: TCEntry[] = [
  { id: 'TC-WF-FLOW-02',   domain: 'workflow', feature: 'WF-FLOW',  title: '신규 워크플로우 생성 A (인프라 배포 + SW 설치)', status: 'ready', channel: 'ui',     specFile: 'mc-web-console/specs/workflow/TC-WF-FLOW-02-신규-workflow-생성-a-인프라-배포-sw-설치.spec.ts' },
  { id: 'TC-WORKFLOW-01',  domain: 'workflow', feature: 'WORKFLOW', title: '워크플로우 목록 조회',  status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-01-list-workflows.spec.ts' },
  { id: 'TC-WORKFLOW-02',  domain: 'workflow', feature: 'WORKFLOW', title: '워크플로우 생성',       status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-02-create-workflow.spec.ts' },
  { id: 'TC-WORKFLOW-03',  domain: 'workflow', feature: 'WORKFLOW', title: '워크플로우 실행',       status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-03-run-workflow.spec.ts' },
  { id: 'TC-WORKFLOW-04',  domain: 'workflow', feature: 'WORKFLOW', title: '워크플로우 삭제',       status: 'ready', channel: 'api+ui', specFile: 'mc-web-console/specs/workflow/TC-WORKFLOW-04-delete-workflow.spec.ts' },
];
