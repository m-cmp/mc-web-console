/**
 * deploy/scenarios/C7-k8s-manage-ibm.spec.ts
 * 레지스트리: C7-k8s-manage-ibm
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C7-k8s-manage-ibm.spec.ts
 *   SCENARIO_ID=C7-k8s-manage-ibm npx playwright test deploy/scenarios/C7-k8s-manage-ibm.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C7-k8s-manage-ibm');
