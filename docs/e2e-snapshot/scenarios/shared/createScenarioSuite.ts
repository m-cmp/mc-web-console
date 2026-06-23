/**
 * deploy/scenarios/shared/createScenarioSuite.ts
 * 레지스트리 기반 시나리오 spec 부트스트랩 — C4/C8 커스텀 spec 제외 공통 진입점
 */
import { test } from '@playwright/test';
import { requireScenario } from '../../registry';
import { ScenarioRuntimeStore } from '../../params/runtime/store';
import { runScenarioStep } from './runScenarioStep';

export function bootstrapScenario(scenarioId: string): void {
  const entry = requireScenario(scenarioId);
  const runtimeId = process.env.SCENARIO_ID ?? scenarioId;
  const store = new ScenarioRuntimeStore(runtimeId);

  test.describe(`${entry.code}: ${entry.title}`, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeAll(() => {
      store.reset();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${scenarioId}] 시나리오 시작 (runtime: ${runtimeId})`);
      console.log(`  actor: ${entry.actor}`);
      console.log(`  status: ${entry.status}`);
      console.log('='.repeat(60));
    });

    test.afterAll(() => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${scenarioId}] 시나리오 종료 — 런타임 파라미터:`);
      store.dump(`${scenarioId} RuntimeStore`);
      console.log('='.repeat(60));
    });

    const steps = [...entry.steps].sort((a, b) => a.order - b.order);
    for (const step of steps) {
      test(`Step ${step.order} — ${step.tcId}: ${step.description}`, async ({ page, request }) => {
        test.setTimeout(5 * 60_000);

        if (step.status === 'bypass') {
          const reason = step.bypass?.reason ?? 'bypass';
          console.warn(`[${scenarioId}/Step${step.order}] BYPASS: ${reason}`);
          store.setBypassed(step.tcId);
          test.skip(true, reason);
          return;
        }

        if (step.status === 'todo' || step.status === 'wip') {
          console.warn(`[${scenarioId}/Step${step.order}] SKIP (${step.status})`);
          test.skip(true, `${step.status}: ${step.description}`);
          return;
        }

        await runScenarioStep({
          page,
          request,
          store,
          scenarioId: runtimeId,
          step,
        });
      });
    }
  });
}
