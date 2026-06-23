/**
 * deploy/params/base/tc/workflow/TC-WORKFLOW-02.params.ts
 * TC-WORKFLOW-02: 워크플로우 생성
 * TC-WORKFLOW-03: 워크플로우 실행   (같은 파일 공유)
 * TC-WORKFLOW-04: 워크플로우 삭제   (같은 파일 공유)
 *
 * 런타임 OUT params (TC-WORKFLOW-02):
 *   store.set('workflowId',   생성된 workflow ID)
 *   store.set('workflowName', workflowName)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    workflowName:        'tc-workflow-e2e',
    workflowDescription: 'E2E 테스트 워크플로우',
    // 워크플로우 정의 — 간단한 인프라 배포 플로우
    steps: [
      { order: 1, type: 'infra-deploy', targetNsId: 'default' },
      { order: 2, type: 'sw-install',   appName:    'nginx'   },
    ],
  },
} satisfies TCParams;
