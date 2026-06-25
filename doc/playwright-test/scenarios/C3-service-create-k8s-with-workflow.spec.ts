/**
 * deploy/scenarios/C3-service-create-k8s-with-workflow.spec.ts
 * 레지스트리: C3-service-create-k8s-with-workflow
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C3-service-create-k8s-with-workflow.spec.ts
 *   SCENARIO_ID=C3-service-create-k8s-with-workflow npx playwright test deploy/scenarios/C3-service-create-k8s-with-workflow.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C3-service-create-k8s-with-workflow');
