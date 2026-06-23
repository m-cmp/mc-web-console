/**
 * deploy/scenarios/C9-cloud-cost-analysis.spec.ts
 * 레지스트리: C9-cloud-cost-analysis
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C9-cloud-cost-analysis.spec.ts
 *   SCENARIO_ID=C9-cloud-cost-analysis npx playwright test deploy/scenarios/C9-cloud-cost-analysis.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C9-cloud-cost-analysis');
