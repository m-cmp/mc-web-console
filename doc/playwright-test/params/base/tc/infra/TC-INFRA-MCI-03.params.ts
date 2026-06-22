/**
 * deploy/params/base/tc/infra/TC-INFRA-MCI-03.params.ts
 * TC-INFRA-MCI-03: MCI 생성
 *
 * CSP별 variant 를 통해 동일 TC를 여러 클라우드에서 실행할 수 있다.
 *
 * 런타임 OUT params:
 *   store.set('mciId',   생성된 MCI ID)
 *   store.set('mciName', mciName)
 *   store.set('nsId',    nsId)
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    nsId:    'default',
    mciName: 'tc-mci-temp',
    // 기본값: aws ap-northeast-2
    connectionName: 'aws-ap-northeast-2',
    commonSpec:     'aws+ap-northeast-2+t2.small',
    rootDiskType:   'default',
    rootDiskSize:   'default',
    subGroupSize:   '1',
  },
  variants: {
    aws: {
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.small',
    },
    'aws-large': {
      connectionName: 'aws-ap-northeast-2',
      commonSpec:     'aws+ap-northeast-2+t2.medium',
    },
    azure: {
      connectionName: 'azure-koreacentral',
      commonSpec:     'azure+koreacentral+Standard_B1s',
    },
    gcp: {
      connectionName: 'gcp-asia-northeast3',
      commonSpec:     'gcp+asia-northeast3+n1-standard-1',
    },
    ali: {
      connectionName: 'alibaba-ap-northeast-1',
      commonSpec:     'alibaba+ap-northeast-1+ecs.t5-lc1m1.small',
    },
    nhn: {
      connectionName: 'nhncloud-kr1',
      commonSpec:     'nhncloud+kr1+m2.c1m2',
    },
  },
} satisfies TCParams;
