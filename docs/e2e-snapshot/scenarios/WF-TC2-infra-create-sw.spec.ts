/**
 * deploy/scenarios/WF-TC2-infra-create-sw.spec.ts
 * 레지스트리: WF-TC2-infra-create-sw
 *
 * 실행:
 *   npx playwright test deploy/scenarios/WF-TC2-infra-create-sw.spec.ts
 *   SCENARIO_ID=WF-TC2-infra-create-sw npx playwright test deploy/scenarios/WF-TC2-infra-create-sw.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('WF-TC2-infra-create-sw');
