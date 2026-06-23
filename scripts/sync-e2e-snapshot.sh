#!/usr/bin/env bash
# mcmp-e2e/deploy/ → docs/e2e-snapshot/ 동기화
#
# 사용:
#   ./scripts/sync-e2e-snapshot.sh
#   MCMP_E2E_ROOT=/path/to/mcmp-e2e ./scripts/sync-e2e-snapshot.sh
#   ./scripts/sync-e2e-snapshot.sh --dry-run

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${MCMP_E2E_ROOT:-$ROOT/../mcmp-e2e}/deploy"
DEST="$ROOT/docs/e2e-snapshot"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

if [ ! -d "$SRC" ]; then
  echo "error: source not found: $SRC" >&2
  echo "Set MCMP_E2E_ROOT to mcmp-e2e repository path." >&2
  exit 1
fi

E2E_ROOT="$(cd "$(dirname "$SRC")" && pwd)"
COMMIT="$(git -C "$E2E_ROOT" rev-parse HEAD)"
SYNCED_AT="$(date -Iseconds)"

RSYNC_OPTS=(-av --delete \
  --exclude 'params/env/local.params.ts' \
  --exclude 'README.md' \
  --exclude 'MANIFEST.json')

if [ "$DRY_RUN" = true ]; then
  RSYNC_OPTS+=(--dry-run)
fi

echo "sync: $SRC/ -> $DEST/"
rsync "${RSYNC_OPTS[@]}" "$SRC/" "$DEST/"

if [ "$DRY_RUN" = true ]; then
  echo "dry-run complete (MANIFEST.json not updated)"
  exit 0
fi

cat > "$DEST/MANIFEST.json" <<EOF
{
  "sourceRepo": "m-cmp/mcmp-e2e",
  "sourcePath": "deploy/",
  "sourceCommit": "$COMMIT",
  "syncedAt": "$SYNCED_AT",
  "note": "Canonical source is mcmp-e2e. Do not edit here; run scripts/sync-e2e-snapshot.sh from mc-web-console root."
}
EOF

echo "synced at $SYNCED_AT (commit $COMMIT)"
