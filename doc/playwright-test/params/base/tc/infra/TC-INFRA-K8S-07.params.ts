/**
 * deploy/params/base/tc/infra/TC-INFRA-K8S-07.params.ts
 * TC-INFRA-K8S-07: PMK KubeConfig 클립보드 복사
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:       'default',
    clusterName: 'tc-pmk-cluster',
  },
} satisfies TCParams;
