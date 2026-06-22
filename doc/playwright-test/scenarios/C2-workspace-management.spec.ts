/**
 * deploy/scenarios/C2-workspace-management.spec.ts
 * 레지스트리: C2-workspace-management
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-workspace-management.spec.ts
 *   SCENARIO_ID=C2-workspace-management npx playwright test deploy/scenarios/C2-workspace-management.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C2-workspace-management');
