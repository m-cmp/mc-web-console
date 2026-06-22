/**
 * deploy/scenarios/WF-TC4-k8s-create-sw.spec.ts
 * 레지스트리: WF-TC4-k8s-create-sw
 *
 * 실행:
 *   npx playwright test deploy/scenarios/WF-TC4-k8s-create-sw.spec.ts
 *   SCENARIO_ID=WF-TC4-k8s-create-sw npx playwright test deploy/scenarios/WF-TC4-k8s-create-sw.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('WF-TC4-k8s-create-sw');
