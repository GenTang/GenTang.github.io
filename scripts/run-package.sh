#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "用法：$0 <package-script>" >&2
  exit 2
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_SCRIPT="$1"

cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "没有找到 Node.js，请先安装 Node.js 22 或更新版本。" >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  PACKAGE_MANAGER=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  PACKAGE_MANAGER=(corepack pnpm)
elif command -v npm >/dev/null 2>&1; then
  PACKAGE_MANAGER=(npm)
else
  echo "没有找到 pnpm、Corepack 或 npm，请先安装一个 Node.js 包管理器。" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "首次运行，正在安装项目依赖……"
  "${PACKAGE_MANAGER[@]}" install
fi

exec "${PACKAGE_MANAGER[@]}" run "$PACKAGE_SCRIPT"
