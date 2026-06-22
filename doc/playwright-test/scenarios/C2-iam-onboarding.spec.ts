/**
 * deploy/scenarios/C2-iam-onboarding.spec.ts
 * 레지스트리: C2-iam-onboarding
 *
 * 실행:
 *   npx playwright test deploy/scenarios/C2-iam-onboarding.spec.ts
 *   SCENARIO_ID=C2-iam-onboarding npx playwright test deploy/scenarios/C2-iam-onboarding.spec.ts
 */
import { bootstrapScenario } from './shared/createScenarioSuite';

bootstrapScenario('C2-iam-onboarding');
