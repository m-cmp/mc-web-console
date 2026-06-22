/**
 * deploy/scenarios/WF-TC3-k8s-create.spec.ts
 * 레지스트리: WF-TC3-k8s-create
 *
 * 실행:
 *   npx playwright test deploy/scenarios/WF-TC3-k8s-create.spec.ts
 *   SCENARIO_ID=WF-TC3-k8s-create npx playwright test deploy/scenarios/WF-TC3-k8s-create.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('WF-TC3-k8s-create');
