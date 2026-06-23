/**
 * deploy/scenarios/C6-monitoring-tracing-logging.spec.ts
 * 레지스트리: C6-monitoring-tracing-logging
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C6-monitoring-tracing-logging.spec.ts
 *   SCENARIO_ID=C6-monitoring-tracing-logging npx playwright test deploy/scenarios/C6-monitoring-tracing-logging.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C6-monitoring-tracing-logging');
