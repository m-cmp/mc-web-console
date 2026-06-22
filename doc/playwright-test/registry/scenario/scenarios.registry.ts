/**
 * deploy/registry/scenario/scenarios.registry.ts
 * 시나리오 전체 목록
 *
 * Code 체계:
 *   C2  — IAM·사용자 관리 (Onboarding)
 *   C3  — 서비스 생성 with Workflow
 *   C4  — 서비스 생성 without Workflow (직접 구성)
 *   C5  — 서비스 운영 관리
 *   C6  — 모니터링·로깅·트레이싱
 *   C7  — K8s 클러스터 관리
 *   C8  — 데이터 백업·복구·마이그레이션
 *   C9  — 클라우드 비용 분석
 *   WF  — 워크플로우 기반 시나리오
 *
 * 상태(status):
 *   ready   — 전체 스텝 실행 가능
 *   partial — 일부 bypass 포함, 나머지 실행 가능
 *   wip     — 작업 중
 *   todo    — 구현 예정
 */
import type { ScenarioEntry } from '../types';

export const SCENARIO_REGISTRY: ScenarioEntry[] = [

  // ── C2: IAM 온보딩 ────────────────────────────────────────────────────────
  {
    id: 'C2-iam-onboarding',
    code: 'C2',
    title: 'IAM 온보딩 — 사용자 추가·역할·그룹 할당',
    description: '신규 사용자 생성부터 역할 배정, 그룹 할당, 워크스페이스 접근 확인까지의 전체 흐름.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-iam-onboarding.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-USERGROUP-03', status: 'ready', description: '신규 사용자 생성' },
      { order: 2, tcId: 'TC-IAM-USERGROUP-08', status: 'ready', description: '그룹 생성' },
      { order: 3, tcId: 'TC-IAM-USERGROUP-11', status: 'ready', description: '그룹에 사용자 배정' },
      { order: 4, tcId: 'TC-IAM-ROLE-06',      status: 'ready', description: '사용자에 플랫폼 역할 부여' },
      { order: 5, tcId: 'TC-IAM-WORKSPACE-05', status: 'ready', description: '워크스페이스에 사용자 배정' },
      { order: 6, tcId: 'TC-IAM-AUTH-01',      status: 'ready', description: '신규 사용자로 로그인 확인' },
    ],
  },

  {
    id: 'C2-admin-user-role-mci',
    code: 'C2',
    title: '관리자 계정 생성·역할 할당·MCI 연동',
    description: '관리자 사용자 생성 후 역할을 부여하고 MCI 접근 권한을 확인한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-admin-user-role-mci.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-USERGROUP-03', status: 'ready', description: '관리자 사용자 생성' },
      { order: 2, tcId: 'TC-IAM-ROLE-06',      status: 'ready', description: '플랫폼 역할 부여' },
      { order: 3, tcId: 'TC-INFRA-MCI-01',     status: 'ready', description: 'MCI 목록 접근 확인' },
    ],
  },

  {
    id: 'C2-workspace-management',
    code: 'C2',
    title: 'Workspace 관리 UI 전체 검증',
    description: '워크스페이스 목록·생성·수정·삭제·Projects 탭·테이블 UX를 검증한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-workspace-management.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-WORKSPACE-01', status: 'ready', description: '워크스페이스 목록 조회' },
      { order: 2, tcId: 'TC-IAM-WORKSPACE-02', status: 'ready', description: '워크스페이스 생성' },
      { order: 3, tcId: 'TC-IAM-WORKSPACE-08', status: 'ready', description: '대시보드 카운트 확인' },
      { order: 4, tcId: 'TC-IAM-WORKSPACE-10', status: 'ready', description: '추가 모달 UI 확인' },
      { order: 5, tcId: 'TC-IAM-WORKSPACE-13', status: 'ready', description: 'Projects 탭 관리' },
      { order: 6, tcId: 'TC-IAM-WORKSPACE-14', status: 'ready', description: '테이블 정렬·다중선택' },
      { order: 7, tcId: 'TC-IAM-WORKSPACE-04', status: 'ready', description: '워크스페이스 삭제' },
    ],
  },

  {
    id: 'C2-user-signup-approval',
    code: 'C2',
    title: '가입 신청 승인 — 관리자 승인 화면 API·UI 검증',
    description: '사용자가 회원가입을 신청하고 관리자가 API 또는 UI로 승인한 후 로그인을 확인한다.',
    status: 'ready',
    actor: '플랫폼 관리자',
    specFile: 'deploy/scenarios/C2-user-signup-approval.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-IAM-AUTH-05',             status: 'ready', description: '사용자 회원가입 신청' },
      { order: 2, tcId: 'TC-IAM-USER-LIFECYCLE-01',   status: 'ready', description: '관리자 API 승인 후 로그인' },
      { order: 3, tcId: 'TC-IAM-USER-LIFECYCLE-02',   status: 'ready', description: '관리자 UI 승인 후 로그인' },
    ],
  },

  // ── C3: Workflow로 서비스 생성 ────────────────────────────────────────────
  {
    id: 'C3-service-create-infra-with-workflow',
    code: 'C3',
    title: 'Workflow로 인프라 서비스(MCI) 생성',
    description: '워크플로우를 정의하고 실행하여 MCI를 생성·배포하는 자동화 흐름.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-service-create-infra-with-workflow.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-CSP-CREDENTIAL-03', status: 'ready', description: 'CSP 자격증명 등록' },
      { order: 2, tcId: 'TC-CSP-CONNECTION-02', status: 'ready', description: 'CSP 연결 생성' },
      { order: 3, tcId: 'TC-WORKFLOW-02',        status: 'ready', description: '워크플로우 정의 (MCI 생성 포함)' },
      { order: 4, tcId: 'TC-WORKFLOW-03',        status: 'ready', description: '워크플로우 실행' },
      { order: 5, tcId: 'TC-INFRA-MCI-01',      status: 'ready', description: 'MCI 생성 완료 확인' },
      { order: 6, tcId: 'TC-WORKFLOW-04',        status: 'ready', description: '워크플로우 삭제 (정리)' },
    ],
  },

  {
    id: 'C3-service-create-k8s-with-workflow',
    code: 'C3',
    title: 'Workflow로 K8s 서비스 생성',
    description: '워크플로우를 정의하고 실행하여 K8s 클러스터를 생성하는 자동화 흐름.',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C3-service-create-k8s-with-workflow.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-CSP-CREDENTIAL-03', status: 'ready',  description: 'CSP 자격증명 등록' },
      { order: 2, tcId: 'TC-WORKFLOW-02',        status: 'ready',  description: '워크플로우 정의 (K8s 생성 포함)' },
      { order: 3, tcId: 'TC-WORKFLOW-03',        status: 'bypass', description: 'K8s 워크플로우 실행', bypass: { reason: 'K8s workflow 미구현' } },
    ],
  },

  // ── C4: 직접 서비스 생성 (Workflow 없음) ──────────────────────────────────
  {
    id: 'C4-service-create-infra',
    code: 'C4',
    title: '글로벌 멀티클라우드 MCI 직접 구성·배포',
    description: '워크플로우 없이 MCI를 직접 생성하고 SW를 배포한다. 가장 복잡한 E2E 시나리오.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-service-create-infra.spec.ts',
    steps: [
      { order: 1,  tcId: 'TC-IAM-USERGROUP-03',  status: 'ready', description: '운영 사용자 생성' },
      { order: 2,  tcId: 'TC-CSP-CREDENTIAL-03', status: 'ready', description: 'CSP 자격증명 등록' },
      { order: 3,  tcId: 'TC-CSP-CONNECTION-02', status: 'ready', description: 'CSP 연결 생성' },
      { order: 4,  tcId: 'TC-INFRA-SSH-KEY-02',  status: 'ready', description: 'SSH 키 생성' },
      { order: 5,  tcId: 'TC-INFRA-MCI-03',      status: 'ready', description: 'MCI 생성', variant: 'aws' },
      { order: 6,  tcId: 'TC-INFRA-MCI-01',      status: 'ready', description: 'MCI Running 상태 확인' },
      { order: 7,  tcId: 'TC-APP-CAT-05',         status: 'ready', description: 'App Catalog 등록' },
      { order: 8,  tcId: 'TC-SW-CATALOG-02',      status: 'ready', description: 'SW 배포' },
      { order: 9,  tcId: 'TC-APP-APPS-02',        status: 'ready', description: '배포 상태 확인' },
      { order: 10, tcId: 'TC-SW-CATALOG-03',      status: 'ready', description: 'SW 제거' },
      { order: 11, tcId: 'TC-INFRA-MCI-05',      status: 'ready', description: 'MCI 삭제 (정리)' },
    ],
  },

  {
    id: 'C4-mci-per-csp',
    code: 'C4',
    title: 'CSP별 MCI 생성 (자동화)',
    description: 'CSP_TARGETS 목록 기반으로 각 CSP마다 MCI를 자동 생성하고 결과를 기록한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-mci-per-csp.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'AWS MCI 생성',     variant: 'aws' },
      { order: 2, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'Azure MCI 생성',   variant: 'azure' },
      { order: 3, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'GCP MCI 생성',     variant: 'gcp' },
      { order: 4, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'Alibaba MCI 생성', variant: 'ali' },
      { order: 5, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'IBM MCI 생성',     variant: 'ibm' },
      { order: 6, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'NHN MCI 생성',     variant: 'nhn' },
      { order: 7, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: 'Tencent MCI 생성', variant: 'tencent' },
    ],
  },

  {
    id: 'C4-mci-multi-csp',
    code: 'C4',
    title: 'Multi-CSP MCI — 모든 CSP VM을 단일 MCI에 통합',
    description: '여러 CSP의 VM을 하나의 MCI에 묶어 생성하는 멀티클라우드 시나리오.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-mci-multi-csp.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-MCI-03', status: 'ready', description: '멀티 CSP 단일 MCI 생성' },
      { order: 2, tcId: 'TC-INFRA-MCI-01', status: 'ready', description: '모든 VM Running 확인' },
    ],
  },

  {
    id: 'C4-app-deploy-infra',
    code: 'C4',
    title: 'VM(MCI) 위 애플리케이션 배포',
    description: '이미 생성된 MCI에 앱을 배포하고 상태를 확인한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C4-app-deploy-infra.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-APP-CAT-05',  status: 'ready', description: 'App Catalog 등록' },
      { order: 2, tcId: 'TC-SW-CATALOG-02', status: 'ready', description: 'SW 배포 (VM 타겟)' },
      { order: 3, tcId: 'TC-APP-APPS-02', status: 'ready', description: '배포 상세 확인' },
    ],
  },

  // ── C5: 서비스 운영 관리 ──────────────────────────────────────────────────
  {
    id: 'C5-service-management-infra',
    code: 'C5',
    title: '운영 중 MCI 관리',
    description: '운영 중인 MCI의 라이프사이클(suspend·resume·reboot) 및 모니터링을 관리한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C5-service-management-infra.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-MCI-04',       status: 'ready', description: 'MCI suspend' },
      { order: 2, tcId: 'TC-INFRA-MCI-04',       status: 'ready', description: 'MCI resume' },
      { order: 3, tcId: 'TC-INFRA-MCI-04',       status: 'ready', description: 'MCI reboot' },
      { order: 4, tcId: 'TC-APP-APPS-03',         status: 'ready', description: '앱 restart·stop·uninstall' },
      { order: 5, tcId: 'TC-OBS-MON-CONFIG-01',  status: 'ready', description: '모니터링 대상 확인' },
    ],
  },

  {
    id: 'C5-mci-resume',
    code: 'C5',
    title: 'MCI Resume 시나리오',
    description: 'suspend 상태의 MCI를 resume하여 Running으로 복구한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C5-mci-resume.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-MCI-02', status: 'ready', description: 'MCI 상태 확인' },
      { order: 2, tcId: 'TC-INFRA-MCI-04', status: 'ready', description: 'MCI resume 요청' },
      { order: 3, tcId: 'TC-INFRA-MCI-01', status: 'ready', description: 'Running 상태 확인' },
    ],
  },

  // ── C6: 모니터링·로깅·트레이싱 ───────────────────────────────────────────
  {
    id: 'C6-monitoring-tracing-logging',
    code: 'C6',
    title: '운영 중 모니터링·트레이싱·로깅',
    description: '운영 중인 서비스의 모니터링 대시보드, 로그, 트레이스를 확인한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C6-monitoring-tracing-logging.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-OBS-MON-CONFIG-02', status: 'ready',  description: '모니터링 에이전트 설치' },
      { order: 2, tcId: 'TC-OBS-MON-DATA-01',   status: 'ready',  description: '모니터링 데이터 확인' },
      { order: 3, tcId: 'TC-OBS-MON-INSIGHT-01',status: 'ready',  description: '인사이트 확인' },
      { order: 4, tcId: 'TC-OBS-LOG-01',        status: 'ready',  description: '로그 조회' },
      { order: 5, tcId: 'TC-OBS-TRACE-01',      status: 'bypass', description: '트레이스 조회', bypass: { reason: 'Jaeger 미설치 환경에서 skip' } },
    ],
  },

  // ── C7: K8s 클러스터 관리 ─────────────────────────────────────────────────
  {
    id: 'C7-k8s-per-csp',
    code: 'C7',
    title: 'CSP별 K8s 클러스터 생성',
    description: '각 CSP에 K8s 클러스터를 생성하고 결과를 기록한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C7-k8s-per-csp.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-07', status: 'ready',  description: 'AWS K8s KubeConfig 확인' },
      { order: 2, tcId: 'TC-INFRA-K8S-07', status: 'bypass', description: 'Azure K8s', bypass: { reason: '환경 미구성' } },
    ],
  },

  {
    id: 'C7-k8s-manage-ibm',
    code: 'C7',
    title: 'IBM K8s 클러스터 관리',
    description: 'IBM 환경에서 K8s 클러스터를 생성·관리·삭제한다.',
    status: 'partial',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/C7-k8s-manage-ibm.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-INFRA-K8S-07', status: 'ready',  description: 'IBM K8s KubeConfig 복사' },
    ],
  },

  // ── C8: 데이터 백업·복구·마이그레이션 ───────────────────────────────────
  {
    id: 'C8-data-backup-recovery-migration',
    code: 'C8',
    title: '데이터 백업·복구·마이그레이션',
    description: 'RDB·NoRDB·Object Storage 각각의 백업, 복원, 마이그레이션 전체 흐름.',
    status: 'ready',
    actor: 'DBA / 인프라 엔지니어',
    specFile: 'deploy/scenarios/C8-data-backup-recovery-migration.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-DATA-RDB-BAK-01',   status: 'ready', description: 'RDBMS 백업' },
      { order: 2, tcId: 'TC-DATA-RDB-MIG-01',   status: 'ready', description: 'RDBMS 마이그레이션' },
      { order: 3, tcId: 'TC-DATA-NORDB-BAK-01', status: 'ready', description: 'NoRDBMS 백업' },
      { order: 4, tcId: 'TC-DATA-NORDB-MIG-01', status: 'ready', description: 'NoRDBMS 마이그레이션' },
      { order: 5, tcId: 'TC-DATA-OBJ-BAK-01',   status: 'ready', description: 'Object Storage 백업' },
      { order: 6, tcId: 'TC-DATA-OBJ-MIG-01',   status: 'ready', description: 'Object Storage 마이그레이션' },
    ],
  },

  // ── C9: 클라우드 비용 분석 ────────────────────────────────────────────────
  {
    id: 'C9-cloud-cost-analysis',
    code: 'C9',
    title: '클라우드 비용 확인',
    description: 'Cost Analysis iframe에서 당월 청구 및 Top5 비용을 확인한다.',
    status: 'ready',
    actor: '과금 관리자',
    specFile: 'deploy/scenarios/C9-cloud-cost-analysis.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-COST-BILL-01',  status: 'ready', description: 'API 호스트 조회' },
      { order: 2, tcId: 'TC-COST-BILL-02',  status: 'ready', description: '당월 청구 조회' },
      { order: 3, tcId: 'TC-COST-BILL-03',  status: 'ready', description: 'Top5 청구 조회' },
      { order: 4, tcId: 'TC-COST-IFRAME-01',status: 'ready', description: 'Cost Analysis iframe 확인' },
    ],
  },

  // ── WF: 워크플로우 시나리오 ──────────────────────────────────────────────
  {
    id: 'WF-TC1-infra-create',
    code: 'WF',
    title: '워크플로우로 인프라 생성',
    description: '워크플로우를 통해 MCI 인프라를 자동으로 생성한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC1-infra-create.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-02', status: 'ready', description: '인프라 생성 워크플로우 정의' },
      { order: 2, tcId: 'TC-WORKFLOW-03', status: 'ready', description: '워크플로우 실행' },
      { order: 3, tcId: 'TC-INFRA-MCI-01', status: 'ready', description: 'MCI 생성 확인' },
    ],
  },

  {
    id: 'WF-TC2-infra-create-sw',
    code: 'WF',
    title: '워크플로우로 인프라 생성 + SW 설치',
    description: '워크플로우 내에서 MCI 생성 후 SW까지 자동 설치한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC2-infra-create-sw.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-02',   status: 'ready', description: '인프라+SW 통합 워크플로우 정의' },
      { order: 2, tcId: 'TC-WORKFLOW-03',   status: 'ready', description: '워크플로우 실행' },
      { order: 3, tcId: 'TC-APP-APPS-02',   status: 'ready', description: '배포 상태 확인' },
    ],
  },

  {
    id: 'WF-TC3-k8s-create',
    code: 'WF',
    title: '워크플로우로 K8s 생성',
    description: '워크플로우를 통해 K8s 클러스터를 자동 생성한다.',
    status: 'wip',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC3-k8s-create.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-02', status: 'wip',    description: 'K8s 생성 워크플로우 정의 (작업 중)' },
      { order: 2, tcId: 'TC-WORKFLOW-03', status: 'bypass', description: '워크플로우 실행', bypass: { reason: 'K8s workflow 노드 미구현' } },
    ],
  },

  {
    id: 'WF-TC4-k8s-create-sw',
    code: 'WF',
    title: '워크플로우로 K8s 생성 + SW 설치',
    description: '워크플로우 내에서 K8s 생성 후 Helm으로 SW를 설치한다.',
    status: 'todo',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC4-k8s-create-sw.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-02',  status: 'todo', description: 'K8s+Helm 통합 워크플로우 정의' },
      { order: 2, tcId: 'TC-WORKFLOW-03',  status: 'todo', description: '워크플로우 실행' },
    ],
  },

  {
    id: 'WF-TC5-infra-delete',
    code: 'WF',
    title: '워크플로우로 인프라 삭제',
    description: '워크플로우를 통해 MCI 인프라를 자동으로 삭제한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC5-infra-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-02', status: 'ready', description: '인프라 삭제 워크플로우 정의' },
      { order: 2, tcId: 'TC-WORKFLOW-03', status: 'ready', description: '워크플로우 실행' },
      { order: 3, tcId: 'TC-INFRA-MCI-01', status: 'ready', description: 'MCI 삭제 확인' },
    ],
  },

  {
    id: 'WF-TC6-k8s-delete',
    code: 'WF',
    title: '워크플로우로 K8s 삭제',
    description: '워크플로우를 통해 K8s 클러스터를 자동 삭제한다.',
    status: 'wip',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC6-k8s-delete.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-03', status: 'wip', description: 'K8s 삭제 워크플로우 실행 (작업 중)' },
    ],
  },

  {
    id: 'WF-TC7-run-predefined',
    code: 'WF',
    title: '사전 정의 워크플로우 실행',
    description: '미리 등록된 워크플로우를 즉시 실행하고 결과를 확인한다.',
    status: 'ready',
    actor: 'SRE 엔지니어',
    specFile: 'deploy/scenarios/WF-TC7-run-predefined.spec.ts',
    steps: [
      { order: 1, tcId: 'TC-WORKFLOW-01', status: 'ready', description: '워크플로우 목록 조회' },
      { order: 2, tcId: 'TC-WORKFLOW-03', status: 'ready', description: '사전 정의 워크플로우 실행' },
    ],
  },
];
