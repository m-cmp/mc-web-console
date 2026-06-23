/**
 * deploy/scenarios/WF-TC1-infra-create.spec.ts
 * 레지스트리: WF-TC1-infra-create
 *
 * 실행:
 *   npx playwright test deploy/scenarios/WF-TC1-infra-create.spec.ts
 *   SCENARIO_ID=WF-TC1-infra-create npx playwright test deploy/scenarios/WF-TC1-infra-create.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('WF-TC1-infra-create');
