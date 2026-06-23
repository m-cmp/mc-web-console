/**
 * deploy/params/runtime/store.ts
 * 시나리오 런타임 IN/OUT 파라미터 스토어
 *
 * 동작 원리:
 *   - TC afterAll 에서 store.set(key, value)  → OUT param 저장
 *   - 다음 TC beforeAll 에서 store.require(key) → IN param 읽기
 *   - /tmp/scenario-runtime-{scenarioId}.json 에 파일로 지속
 *     (Playwright 워커 간 격리를 우회하기 위해 fs 사용)
 *   - bypass 처리: store.setBypassed(tcId) → 다음 TC에서 store.wasBypassed(tcId) 로 확인
 *
 * 사용 예:
 *
 *   // TC-INFRA-MCI-03 (MCI 생성) afterAll:
 *   store.set('mciId', createdId);
 *   store.set('mciName', mciName);
 *
 *   // TC-WORKLOAD-MCI-01 (터미널 접속) beforeAll:
 *   const mciId = store.wasBypassed('TC-INFRA-MCI-03')
 *     ? store.getOrDefault('mciId', 'fallback-mci-id')
 *     : store.require('mciId');
 */
import * as fs from 'fs';
import * as path from 'path';

interface StoreData {
  params:   Record<string, unknown>;
  bypassed: string[];               // bypass 처리된 TC ID 목록
}

export class ScenarioRuntimeStore {
  private readonly filePath: string;
  private data: StoreData;

  constructor(scenarioId: string) {
    this.filePath = path.join('/tmp', `scenario-runtime-${scenarioId}.json`);
    this.data     = this.load();
  }

  // ── 파일 I/O ──────────────────────────────────────────────────────────────

  private load(): StoreData {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(raw) as StoreData;
    } catch {
      return { params: {}, bypassed: [] };
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  // ── 초기화 ────────────────────────────────────────────────────────────────

  /**
   * 시나리오 시작 시 스토어를 초기화한다.
   * 시나리오 spec 파일의 최상위 beforeAll 에서 호출한다.
   */
  reset(): void {
    this.data = { params: {}, bypassed: [] };
    try { fs.unlinkSync(this.filePath); } catch { /* 이미 없으면 무시 */ }
  }

  // ── OUT param 설정 ────────────────────────────────────────────────────────

  /** TC afterAll 에서 호출: OUT param 하나 저장 */
  set(key: string, value: unknown): void {
    this.data.params[key] = value;
    this.save();
  }

  /** TC afterAll 에서 호출: 여러 OUT param 한꺼번에 저장 */
  setAll(pairs: Record<string, unknown>): void {
    Object.assign(this.data.params, pairs);
    this.save();
  }

  /**
   * 이 TC가 bypass 처리되었음을 기록한다.
   * 다음 TC에서 store.wasBypassed(tcId) 로 확인 후 fallback 처리한다.
   */
  setBypassed(tcId: string): void {
    if (!this.data.bypassed.includes(tcId)) {
      this.data.bypassed.push(tcId);
    }
    this.save();
  }

  // ── IN param 읽기 ─────────────────────────────────────────────────────────

  /** 키 조회 — 없으면 undefined */
  get<T = unknown>(key: string): T | undefined {
    return this.data.params[key] as T | undefined;
  }

  /**
   * 키 조회 — 없으면 에러 throw
   * 앞 단계 TC가 반드시 실행되었을 때 사용한다.
   */
  require<T = unknown>(key: string): T {
    const val = this.get<T>(key);
    if (val === undefined) {
      throw new Error(
        `[ScenarioRuntimeStore] 필수 런타임 파라미터가 없습니다: "${key}"\n` +
        `  → 이전 TC 가 set("${key}", ...) 를 호출하지 않았거나 bypass 처리되었습니다.`,
      );
    }
    return val;
  }

  /**
   * 키 조회 — 없으면 fallback 반환
   * 앞 단계 TC가 bypass 되었을 수 있을 때 사용한다.
   *
   * @example
   *   const mciId = store.wasBypassed('TC-INFRA-MCI-03')
   *     ? store.getOrDefault('mciId', 'fallback-mci')
   *     : store.require('mciId');
   */
  getOrDefault<T = unknown>(key: string, fallback: T): T {
    const val = this.get<T>(key);
    return val !== undefined ? val : fallback;
  }

  /** 이 TC ID 가 bypass 처리되었는지 확인 */
  wasBypassed(tcId: string): boolean {
    return this.data.bypassed.includes(tcId);
  }

  // ── 디버그 / 요약 ─────────────────────────────────────────────────────────

  /** 시나리오 종료 시 스토어 내용을 콘솔에 출력 */
  dump(label = 'ScenarioRuntimeStore'): void {
    console.log(`\n── ${label} ──────────────────────────`);
    console.log('  params  :', JSON.stringify(this.data.params, null, 4));
    console.log('  bypassed:', this.data.bypassed);
    console.log('────────────────────────────────────────\n');
  }

  /** 현재 params 스냅샷 (읽기 전용 복사본) */
  snapshot(): Record<string, unknown> {
    return { ...this.data.params };
  }
}
