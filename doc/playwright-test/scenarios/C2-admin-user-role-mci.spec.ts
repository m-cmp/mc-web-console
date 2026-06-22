/**
 * deploy/scenarios/C2-admin-user-role-mci.spec.ts
 * 레지스트리: C2-admin-user-role-mci
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-admin-user-role-mci.spec.ts
 *   SCENARIO_ID=C2-admin-user-role-mci npx playwright test deploy/scenarios/C2-admin-user-role-mci.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C2-admin-user-role-mci');
