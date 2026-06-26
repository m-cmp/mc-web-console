#!/usr/bin/env bash
# Generate docs/api/swagger.json from API handler annotations (swag).
#
# Prerequisites: go install github.com/swaggo/swag/cmd/swag@latest
#
# Usage:
#   ./scripts/generate-swagger.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SWAG="${SWAG:-$(command -v swag || echo "$HOME/go/bin/swag")}"

if [ ! -x "$SWAG" ] && [ ! -f "$SWAG" ]; then
  echo "error: swag not found. Run: go install github.com/swaggo/swag/cmd/swag@latest" >&2
  exit 1
fi

cd "$ROOT/api"
"$SWAG" init \
  -g cmd/main.go \
  -o ../docs/api \
  --outputTypes json \
  --parseDependency \
  --parseInternal

echo "generated: $ROOT/docs/api/swagger.json"
