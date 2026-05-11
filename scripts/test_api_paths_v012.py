"""
FR-FW-CONSOLE-003-08 1차 테스트
mc-web-console 로그인 후 토큰으로 mc-infra-manager operationId 전체 호출
판정 기준: 404 → FAIL / 그 외 (200, 400, 401, 500 등) → PASS (경로 인식됨)

실행: python3 scripts/test_api_paths_v012.py
"""
import json
import sys
import time
import yaml
import requests
from pathlib import Path

WEBCONSOLE_URL = "http://localhost:3016"
API_YAML_PATH  = Path(__file__).parent.parent / "conf" / "api.yaml"

# ─── 1. 로그인 ────────────────────────────────────────────────────────────────
print("=== 1. mc-web-console 로그인 ===")
resp = requests.post(f"{WEBCONSOLE_URL}/api/auth/login", json={
    "request": {"id": "mcmp", "password": "mcmp_password"}
}, timeout=10)

data = resp.json()
if not data.get("access_token"):
    print(f"❌ 로그인 실패: {data}")
    sys.exit(1)

token = data["access_token"]
print(f"✅ 로그인 성공 (token: {token[:30]}...)\n")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

# ─── 2. api.yaml 로드 ─────────────────────────────────────────────────────────
with open(API_YAML_PATH) as f:
    api_spec = yaml.safe_load(f)

actions = api_spec["serviceActions"]["mc-infra-manager"]

# ─── 3. 각 operationId 호출 ──────────────────────────────────────────────────
print("=== 2. mc-infra-manager operationId 호출 테스트 ===")
print(f"{'operationId':<50} {'method':<6} {'status':>6}  판정")
print("-" * 90)

results = []
PASS_STATUSES = set(range(200, 600)) - {404}  # 404만 FAIL

for op_id, spec in actions.items():
    if not isinstance(spec, dict) or "resourcePath" not in spec:
        continue

    method       = spec.get("method", "get").upper()
    resource_path = spec.get("resourcePath", "")

    # path parameter를 더미값으로 채우기
    dummy_path = resource_path
    for param in ["nsId", "infraId", "mciId", "nodeId", "vmId", "subgroupId",
                  "nodegroupId", "nlbId", "vpnId", "requestId", "taskId",
                  "osId", "objectKey", "specId", "metric", "index",
                  "templateId", "bastionVmId", "bastionMciId", "bastionNsId",
                  "bastionNodeId", "targetVmId"]:
        dummy_path = dummy_path.replace(f"{{{param}}}", "test-dummy")

    url = f"{WEBCONSOLE_URL}/api/mc-infra-manager/{op_id}"

    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=8,
                             params={"action": "status"})
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=8)
        else:
            r = requests.request(method, url, headers=headers,
                                 json={}, timeout=8)

        status = r.status_code
        verdict = "✅ PASS" if status != 404 else "❌ FAIL"
    except requests.exceptions.Timeout:
        status = "TIMEOUT"
        verdict = "⚠️  TIMEOUT"
    except Exception as e:
        status = f"ERR"
        verdict = f"⚠️  ERR: {str(e)[:30]}"

    results.append({
        "operationId": op_id,
        "method":      method,
        "path":        resource_path,
        "status":      status,
        "verdict":     verdict,
    })
    print(f"{op_id:<50} {method:<6} {str(status):>6}  {verdict}")
    time.sleep(0.05)  # 서버 과부하 방지

# ─── 4. 요약 ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 90)
total   = len(results)
passed  = sum(1 for r in results if "PASS" in r["verdict"])
failed  = sum(1 for r in results if "FAIL" in r["verdict"])
warned  = total - passed - failed

print(f"총 {total}개  |  ✅ PASS: {passed}  |  ❌ FAIL(404): {failed}  |  ⚠️ 기타: {warned}")

if failed:
    print("\n[FAIL 목록]")
    for r in results:
        if "FAIL" in r["verdict"]:
            print(f"  ❌ {r['method']:6} {r['path']}  ({r['operationId']})")

# ─── 5. JSON 결과 저장 ───────────────────────────────────────────────────────
out_path = Path(__file__).parent / "test_result_v012.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\n결과 저장: {out_path}")
