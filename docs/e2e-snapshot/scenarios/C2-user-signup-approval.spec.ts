/**
 * deploy/scenarios/C2-user-signup-approval.spec.ts
 * 레지스트리: C2-user-signup-approval
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-user-signup-approval.spec.ts
 *   SCENARIO_ID=C2-user-signup-approval npx playwright test deploy/scenarios/C2-user-signup-approval.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C2-user-signup-approval');
