/**
 * deploy/params/base/tc/csp/TC-CSP-CREDENTIAL-03.params.ts
 * TC-CSP-CREDENTIAL-03: CSP Credential 생성
 *
 * 민감한 credential 값은 env/local.params.ts 또는 PW_* 환경변수로 주입한다.
 * 이 파일에는 구조(키 목록)만 정의하고 값은 빈 문자열로 둔다.
 */
import type { TCParams } from '../../../types';

export default {
  base: {
    credentialHolder: 'e2e-credential',
    providerName:     'aws',
    // 실제 값은 env/local.params.ts 또는 PW_credentialKeyId / PW_credentialKeyValue 로 주입
    credentialKeyId:    '',
    credentialKeyValue: '',
  },
  variants: {
    aws: {
      credentialHolder:   'e2e-aws-credential',
      providerName:       'aws',
      credentialKeyId:    '',    // PW_credentialKeyId 로 주입
      credentialKeyValue: '',    // PW_credentialKeyValue 로 주입
    },
    gcp: {
      credentialHolder:   'e2e-gcp-credential',
      providerName:       'gcp',
      credentialKeyId:    '',
      credentialKeyValue: '',
    },
  },
} satisfies TCParams;
