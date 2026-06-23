/**
 * deploy/scenarios/C4-mci-per-csp.spec.ts
 * 레지스트리: C4-mci-per-csp
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C4-mci-per-csp.spec.ts
 *   SCENARIO_ID=C4-mci-per-csp npx playwright test deploy/scenarios/C4-mci-per-csp.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C4-mci-per-csp');
