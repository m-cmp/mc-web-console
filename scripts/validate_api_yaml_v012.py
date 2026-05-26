"""
FR-FW-CONSOLE-003-08 검증: api.yaml mc-infra-manager 섹션 vs cb-tumblebug v0.12.9 swagger
실행: python3 scripts/validate_api_yaml_v012.py
"""
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml", "-q"])
    import yaml

SWAGGER_PATH = Path("/home/nobang/ai_workspace/m-cmp/cb-tumblebug/src/interface/rest/docs/swagger.json")
API_YAML_PATH = Path(__file__).parent.parent / "conf" / "api.yaml"

# 의도적 shim/예외 목록 (실제 swagger에 없어도 정상)
INTENTIONAL_EXCEPTIONS = {
    "ListSpec",                          # FilterSpecsByRange shim (B-2)
    "PostFileAndCmdToMci",               # FR-003-02 연동 — v0.12.9 경로 변경
    "AnalyzeProvisioningRiskDetailed",   # swagger bug: /tumblebug/provisioning/risk/detailed
                                         # (server prefix 중복 정의). baseurl 기준으로
                                         # /provisioning/risk/detailed 사용이 올바름.
}


def norm(path: str) -> str:
    """path parameter 이름 정규화 ({anything} → {P}) — 이름 무관 매칭"""
    return re.sub(r"\{[^}]+\}", "{P}", path)


# ─── swagger 경로 로드 ────────────────────────────────────────────────────────
with open(SWAGGER_PATH) as f:
    tb = json.load(f)

server_prefix = tb.get("servers", [{}])[0].get("url", "")  # e.g. "/tumblebug"

tb_norm: set[tuple] = set()
for raw_path, methods in tb["paths"].items():
    for method in methods:
        if method.lower() in {"get", "post", "put", "delete", "patch", "head"}:
            tb_norm.add((method.upper(), norm(raw_path)))

# ─── api.yaml mc-infra-manager 섹션 로드 ─────────────────────────────────────
with open(API_YAML_PATH) as f:
    mc = yaml.safe_load(f)

actions = mc["serviceActions"]["mc-infra-manager"]

# ─── 매칭 검증 ───────────────────────────────────────────────────────────────
matched = []
not_found = []
excepted = []

for op_id, spec in actions.items():
    if not isinstance(spec, dict) or "resourcePath" not in spec:
        continue
    method = spec.get("method", "").upper()
    path   = spec.get("resourcePath", "")

    if op_id in INTENTIONAL_EXCEPTIONS:
        excepted.append((op_id, method, path))
        continue

    if (method, norm(path)) in tb_norm:
        matched.append((op_id, method, path))
    else:
        not_found.append((op_id, method, path))

# ─── 결과 출력 ───────────────────────────────────────────────────────────────
total = len(matched) + len(not_found) + len(excepted)
print(f"mc-infra-manager 총 operationId: {total}")
print(f"  ✅ 매칭:        {len(matched):3d}개")
print(f"  ⚠️  예외(shim): {len(excepted):3d}개")
print(f"  ❌ 미매칭:      {len(not_found):3d}개")

if excepted:
    print("\n[예외 목록 (의도적 shim)]")
    for op, m, p in sorted(excepted):
        print(f"  {m:6} {p}  ({op})")

if not_found:
    print("\n[미매칭 목록 — 수정 필요]")
    for op, m, p in sorted(not_found):
        print(f"  ❌ {m:6} {p}  ({op})")
    sys.exit(1)
else:
    print("\n모든 API 매칭 성공 (shim 제외)!")
    sys.exit(0)
