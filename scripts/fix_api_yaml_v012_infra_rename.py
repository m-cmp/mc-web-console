"""
FR-FW-CONSOLE-003-08: cb-tumblebug v0.12.9 mci→infra API 경로 전면 갱신
대상: conf/api.yaml mc-infra-manager 섹션 (약 338개 operationId)

실행: python3 scripts/fix_api_yaml_v012_infra_rename.py
"""
import re
import sys
from pathlib import Path

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap
except ImportError:
    print("ruamel.yaml 없음. 설치 중...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "ruamel.yaml", "-q"])
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap

YAML_PATH = Path(__file__).parent.parent / "conf" / "api.yaml"

# ─── 치환 규칙 (적용 순서 엄수 — 긴 패턴 먼저) ───────────────────────────────
REPLACEMENTS = [
    ("/ns/{nsId}/policy/mci",       "/ns/{nsId}/policy/infra"),
    ("/ns/{nsId}/template/mci",     "/ns/{nsId}/template/infra"),
    ("/benchmarkAll/mci/",          "/benchmarkAll/infra/"),
    ("/benchmarkLatency/mci/",      "/benchmarkLatency/infra/"),
    ("/benchmark/mci/",             "/benchmark/infra/"),
    ("/cmd/mci/",                   "/cmd/infra/"),
    ("/control/mci/",               "/control/infra/"),
    ("/monitoring/install/mci/",    "/monitoring/install/infra/"),
    ("/monitoring/status/mci/",     "/monitoring/status/infra/"),
    ("/monitoring/mci/",            "/monitoring/infra/"),
    ("/stream/cmd/mci/",            "/stream/cmd/infra/"),
    ("/installBenchmarkAgent/mci/", "/installBenchmarkAgent/infra/"),
    ("/transferFile/mci/",          "/transferFile/infra/"),
    ("/downloadFile/mci/",          "/downloadFile/infra/"),
    ("/deregisterResource/mci/",    "/deregisterResource/infra/"),
    ("/ns/{nsId}/mci",              "/ns/{nsId}/infra"),
    ("/mciDynamicCheckRequest",     "/infraDynamicCheckRequest"),
    ("/systemMci",                  "/systemInfra"),
    ("/registerCspVm",              "/registerCspNode"),
    ("/subGroupDynamicReview",      "/nodeGroupDynamicReview"),
    ("/subGroupDynamic",            "/nodeGroupDynamic"),
]


def rename_path(path: str) -> str:
    for old, new in REPLACEMENTS:
        path = path.replace(old, new)
    # /vm → /node: 경로 구분자 앞 또는 말단 모두 처리
    path = re.sub(r"/vm(?=/|$)", "/node", path)
    # /subgroup → /nodegroup: 경로 구분자 앞 또는 말단 모두 처리 (포함 /subgroup/)
    path = re.sub(r"/subgroup(?=/|$)", "/nodegroup", path)
    return path


yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 4096  # 긴 description 줄바꿈 방지

print(f"로딩: {YAML_PATH}")
with open(YAML_PATH, "r", encoding="utf-8") as f:
    data = yaml.load(f)

actions = data["serviceActions"]["mc-infra-manager"]

# ─── Step 1: 경로 일괄 치환 (분류 A) ────────────────────────────────────────
changed_count = 0
for op_id, spec in actions.items():
    if not isinstance(spec, dict) or "resourcePath" not in spec:
        continue
    original = spec["resourcePath"]
    new_path = rename_path(original)
    if new_path != original:
        spec["resourcePath"] = new_path
        changed_count += 1
        print(f"  [RENAMED] {op_id}:\n    {original}\n    → {new_path}")

print(f"\nStep 1 완료: {changed_count}개 resourcePath 치환")

# ─── Step 2: GeneratePresignedURL (분류 B-1) ─────────────────────────────────
if "GeneratePresignedURL" in actions:
    prev_method = actions["GeneratePresignedURL"].get("method", "")
    prev_path   = actions["GeneratePresignedURL"].get("resourcePath", "")
    actions["GeneratePresignedURL"]["method"] = "post"
    actions["GeneratePresignedURL"]["resourcePath"] = (
        "/ns/{nsId}/resources/objectStorage/{osId}/object/{objectKey}/presignedUrl"
    )
    print(f"\nStep 2: GeneratePresignedURL")
    print(f"  method: {prev_method} → post")
    print(f"  path:   {prev_path}")
    print(f"        → /ns/{{nsId}}/resources/objectStorage/{{osId}}/object/{{objectKey}}/presignedUrl")
else:
    print("\nStep 2: GeneratePresignedURL 없음 (skip)")

# ─── Step 3: ListSpec (분류 B-2) — FilterSpecsByRange shim ──────────────────
if "ListSpec" in actions:
    prev = actions["ListSpec"].get("resourcePath", "")
    actions["ListSpec"]["method"] = "post"
    actions["ListSpec"]["resourcePath"] = "/ns/{nsId}/resources/filterSpecsByRange"
    print(f"\nStep 3: ListSpec → FilterSpecsByRange shim")
    print(f"  path: {prev} → /ns/{{nsId}}/resources/filterSpecsByRange")
else:
    print("\nStep 3: ListSpec 없음 (skip)")

# ─── Step 4: AnalyzeProvisioningRiskDetailed 이중 prefix 제거 (분류 C) ────────
if "AnalyzeProvisioningRiskDetailed" in actions:
    p = actions["AnalyzeProvisioningRiskDetailed"].get("resourcePath", "")
    if p.startswith("/tumblebug"):
        fixed = p[len("/tumblebug"):]
        actions["AnalyzeProvisioningRiskDetailed"]["resourcePath"] = fixed
        print(f"\nStep 4: AnalyzeProvisioningRiskDetailed 이중 prefix 제거")
        print(f"  {p} → {fixed}")
    else:
        print(f"\nStep 4: AnalyzeProvisioningRiskDetailed prefix 정상 (skip): {p}")
else:
    print("\nStep 4: AnalyzeProvisioningRiskDetailed 없음 (skip)")

# ─── Step 5: PostFileAndCmdToMci resourcePath 갱신 (FR-003-02 연동) ──────────
if "PostFileAndCmdToMci" in actions:
    prev = actions["PostFileAndCmdToMci"].get("resourcePath", "")
    new_path = "/ns/{nsId}/transferFileAndCmd/infra/{infraId}"
    if prev != new_path:
        actions["PostFileAndCmdToMci"]["resourcePath"] = new_path
        print(f"\nStep 5: PostFileAndCmdToMci")
        print(f"  path: {prev} → {new_path}")
    else:
        print(f"\nStep 5: PostFileAndCmdToMci 이미 최신 (skip)")
else:
    # operationId가 없으면 신규 추가
    new_action = CommentedMap()
    new_action["method"] = "post"
    new_action["resourcePath"] = "/ns/{nsId}/transferFileAndCmd/infra/{infraId}"
    new_action["description"] = (
        "Transfer a file and execute commands on all nodes in the Infra. "
        "(v0.12.9 갱신: /ns/{nsId}/mci/{mciId}/fileAndCmd → /ns/{nsId}/transferFileAndCmd/infra/{infraId})"
    )
    actions["PostFileAndCmdToMci"] = new_action
    print("\nStep 5: PostFileAndCmdToMci 신규 추가")

# ─── 버전 필드 갱신 ──────────────────────────────────────────────────────────
prev_ver = data["services"]["mc-infra-manager"].get("version", "")
data["services"]["mc-infra-manager"]["version"] = "0.12.9"
print(f"\n버전: {prev_ver} → 0.12.9")

# ─── 저장 ────────────────────────────────────────────────────────────────────
with open(YAML_PATH, "w", encoding="utf-8") as f:
    yaml.dump(data, f)

print(f"\n완료: {YAML_PATH} 저장됨")
