/**
 * deploy/scenarios/C4-app-deploy-infra.spec.ts
 * 레지스트리: C4-app-deploy-infra
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C4-app-deploy-infra.spec.ts
 *   SCENARIO_ID=C4-app-deploy-infra npx playwright test deploy/scenarios/C4-app-deploy-infra.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C4-app-deploy-infra');
