/**
 * deploy/scenarios/WF-TC7-run-predefined.spec.ts
 * 레지스트리: WF-TC7-run-predefined
 *
 * 실행:
 *   npx playwright test deploy/scenarios/WF-TC7-run-predefined.spec.ts
 *   SCENARIO_ID=WF-TC7-run-predefined npx playwright test deploy/scenarios/WF-TC7-run-predefined.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('WF-TC7-run-predefined');
