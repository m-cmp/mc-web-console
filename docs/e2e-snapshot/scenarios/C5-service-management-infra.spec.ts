/**
 * deploy/scenarios/C5-service-management-infra.spec.ts
 * 레지스트리: C5-service-management-infra
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C5-service-management-infra.spec.ts
 *   SCENARIO_ID=C5-service-management-infra npx playwright test deploy/scenarios/C5-service-management-infra.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C5-service-management-infra');
