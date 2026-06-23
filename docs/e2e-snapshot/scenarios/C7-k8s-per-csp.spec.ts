/**
 * deploy/scenarios/C7-k8s-per-csp.spec.ts
 * 레지스트리: C7-k8s-per-csp
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C7-k8s-per-csp.spec.ts
 *   SCENARIO_ID=C7-k8s-per-csp npx playwright test deploy/scenarios/C7-k8s-per-csp.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C7-k8s-per-csp');
