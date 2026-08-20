#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../medium-import.json" ]]; then
  node "$SCRIPT_DIR/medium-import-control.mjs" refresh-version
fi
exec "$SCRIPT_DIR/run-package.sh" publish:local
