#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SITE_URL="${INDEXNOW_SITE_URL:-https://gentang.github.io}"
SITE_URL="${SITE_URL%/}"
ENDPOINT="${INDEXNOW_ENDPOINT:-https://api.indexnow.org/indexnow}"
PUBLIC_DIR="$PROJECT_DIR/public"
KEY_FILE_OVERRIDE="${INDEXNOW_KEY_FILE:-}"
KEY_LOCATION_OVERRIDE="${INDEXNOW_KEY_LOCATION:-}"
LEGACY_KEY_FILE="$PUBLIC_DIR/indexnow-key.txt"
SITEMAP_FILE="${INDEXNOW_SITEMAP_FILE:-$PROJECT_DIR/out/sitemap.xml}"

usage() {
  cat <<'EOF'
用法：
  ./scripts/indexnow.sh --init
  ./scripts/indexnow.sh --all
  ./scripts/indexnow.sh /zh/ /zh/blog/example/
  ./scripts/indexnow.sh https://gentang.github.io/zh/
  ./scripts/indexnow.sh --dry-run --all

选项：
  --init       生成 public/<Key>.txt；生成后需要提交并发布该文件
  --all        一次性提交 out/sitemap.xml 中的全部 canonical URL
  --dry-run    只列出将提交的 URL，不调用 IndexNow
  -h, --help   显示帮助

环境变量：
  INDEXNOW_SITE_URL       站点根地址，默认 https://gentang.github.io
  INDEXNOW_ENDPOINT       API 地址，默认 https://api.indexnow.org/indexnow
  INDEXNOW_KEY            覆盖本地 Key 文件中的值
  INDEXNOW_KEY_FILE       本地 Key 文件路径；默认自动发现 public/<Key>.txt
  INDEXNOW_KEY_LOCATION   线上 Key 文件地址
  INDEXNOW_SITEMAP_FILE   本地 sitemap.xml 路径

说明：
  --all 适合首次接入或全站迁移后使用。日常更新请只传入真正新增、修改、
  删除或重定向的 URL，并在 GitHub Pages 部署完成后执行。
EOF
}

fail() {
  printf '错误：%s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "没有找到 $1，请先安装后再运行。"
}

generate_key() {
  local key
  if command -v openssl >/dev/null 2>&1; then
    key="$(openssl rand -hex 16)"
  else
    require_command node
    key="$(node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))")"
  fi

  local key_file
  key_file="${KEY_FILE_OVERRIDE:-$PUBLIC_DIR/$key.txt}"
  if [[ -e "$key_file" ]]; then
    fail "Key 文件已经存在：$key_file。如需轮换，请先手工确认并移走旧文件。"
  fi

  mkdir -p "$(dirname "$key_file")"
  printf '%s\n' "$key" > "$key_file"

  local key_location
  key_location="${KEY_LOCATION_OVERRIDE:-$SITE_URL/$(basename "$key_file")}"

  printf '已生成 IndexNow Key 文件：%s\n' "$key_file"
  printf '下一步：\n'
  printf '  1. 将该文件提交并推送到 GitHub。\n'
  printf '  2. 等待 GitHub Pages 部署完成。\n'
  printf '  3. 确认可以打开 %s\n' "$key_location"
  printf '  4. 首次运行 ./scripts/indexnow.sh --all\n'
}

DRY_RUN=false
POSITIONAL=()

while (($#)); do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL+=("$1")
      ;;
  esac
  shift
done

set -- "${POSITIONAL[@]}"

if (($# == 0)); then
  usage >&2
  exit 1
fi

if [[ "$1" == "--init" ]]; then
  (($# == 1)) || fail "--init 不能与 URL 或 --all 同时使用。"
  $DRY_RUN && fail "--init 不能与 --dry-run 同时使用。"
  generate_key
  exit 0
fi

require_command node
require_command curl

KEY="${INDEXNOW_KEY:-}"
KEY_FILE=""

if [[ -n "$KEY_FILE_OVERRIDE" ]]; then
  [[ -f "$KEY_FILE_OVERRIDE" ]] || fail "没有找到 INDEXNOW_KEY_FILE 指定的文件：$KEY_FILE_OVERRIDE"
  KEY_FILE="$KEY_FILE_OVERRIDE"
elif [[ -n "$KEY" && -f "$PUBLIC_DIR/$KEY.txt" ]]; then
  KEY_FILE="$PUBLIC_DIR/$KEY.txt"
else
  MATCHING_KEY_FILES=()
  for candidate in "$PUBLIC_DIR"/*.txt; do
    [[ -f "$candidate" ]] || continue
    candidate_key="$(tr -d '\r\n' < "$candidate")"
    candidate_name="$(basename "$candidate" .txt)"
    if [[ "$candidate_key" == "$candidate_name" && "$candidate_key" =~ ^[A-Za-z0-9-]{8,128}$ ]]; then
      MATCHING_KEY_FILES+=("$candidate")
    fi
  done

  if ((${#MATCHING_KEY_FILES[@]} == 1)); then
    KEY_FILE="${MATCHING_KEY_FILES[0]}"
  elif ((${#MATCHING_KEY_FILES[@]} > 1)); then
    printf '发现多个有效的 IndexNow Key 文件：\n' >&2
    printf '  %s\n' "${MATCHING_KEY_FILES[@]}" >&2
    fail "请通过 INDEXNOW_KEY_FILE 明确指定要使用的文件。"
  elif [[ -f "$LEGACY_KEY_FILE" ]]; then
    KEY_FILE="$LEGACY_KEY_FILE"
  fi
fi

if [[ -z "$KEY" ]]; then
  if [[ -n "$KEY_FILE" ]]; then
    KEY="$(tr -d '\r\n' < "$KEY_FILE")"
  else
    fail "没有找到 Key。请将 Key 保存为 public/<Key>.txt，或运行 ./scripts/indexnow.sh --init。"
  fi
fi

if [[ ! "$KEY" =~ ^[A-Za-z0-9-]{8,128}$ ]]; then
  fail "IndexNow Key 必须由 8—128 个字母、数字或连字符组成。"
fi

if [[ -n "$KEY_LOCATION_OVERRIDE" ]]; then
  KEY_LOCATION="$KEY_LOCATION_OVERRIDE"
elif [[ -n "$KEY_FILE" ]]; then
  KEY_LOCATION="$SITE_URL/$(basename "$KEY_FILE")"
else
  KEY_LOCATION="$SITE_URL/$KEY.txt"
fi

case "$SITE_URL" in
  http://*|https://*) ;;
  *) fail "INDEXNOW_SITE_URL 必须是完整的 http:// 或 https:// 地址。" ;;
esac

HOST="${SITE_URL#*://}"
[[ "$HOST" != */* ]] || fail "INDEXNOW_SITE_URL 只能包含协议和主机名，不能包含路径。"

URLS=()

if [[ "$1" == "--all" ]]; then
  (($# == 1)) || fail "--all 不能与单独 URL 同时使用。"
  [[ -f "$SITEMAP_FILE" ]] || fail "没有找到 $SITEMAP_FILE，请先运行 ./scripts/publish.sh。"

  while IFS= read -r url; do
    [[ -n "$url" ]] && URLS+=("$url")
  done < <(node - "$SITEMAP_FILE" <<'NODE'
const { readFileSync } = require("node:fs");
const source = readFileSync(process.argv[2], "utf8");
for (const match of source.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
  console.log(match[1].replaceAll("&amp;", "&").trim());
}
NODE
  )
elif [[ "$1" == --* ]]; then
  fail "未知选项：$1"
else
  for candidate in "$@"; do
    case "$candidate" in
      http://*|https://*) url="$candidate" ;;
      /*) url="$SITE_URL$candidate" ;;
      *) url="$SITE_URL/$candidate" ;;
    esac
    URLS+=("$url")
  done
fi

((${#URLS[@]} > 0)) || fail "没有找到可提交的 URL。"

UNIQUE_URLS=()
while IFS= read -r url; do
  [[ -n "$url" ]] && UNIQUE_URLS+=("$url")
done < <(printf '%s\n' "${URLS[@]}" | awk '!seen[$0]++')
URLS=("${UNIQUE_URLS[@]}")

((${#URLS[@]} <= 10000)) || fail "单次最多提交 10,000 个 URL。"

for url in "${URLS[@]}"; do
  if [[ "$url" != "$SITE_URL" && "$url" != "$SITE_URL/"* ]]; then
    fail "URL 不属于 $SITE_URL：$url"
  fi
done

printf '准备向 IndexNow 提交 %d 个 URL。\n' "${#URLS[@]}"

if $DRY_RUN; then
  printf '%s\n' "${URLS[@]}"
  exit 0
fi

REMOTE_KEY="$(curl -fsSL --max-time 20 "$KEY_LOCATION" | tr -d '\r\n')" || {
  fail "无法读取线上 Key：$KEY_LOCATION。请先推送并等待 GitHub Pages 部署完成。"
}

[[ "$REMOTE_KEY" == "$KEY" ]] || {
  fail "线上 Key 与本地 Key 不一致：$KEY_LOCATION"
}

PAYLOAD_FILE="$(mktemp)"
RESPONSE_FILE="$(mktemp)"
trap 'rm -f -- "$PAYLOAD_FILE" "$RESPONSE_FILE"' EXIT

node - "$HOST" "$KEY" "$KEY_LOCATION" "${URLS[@]}" > "$PAYLOAD_FILE" <<'NODE'
const [host, key, keyLocation, ...urlList] = process.argv.slice(2);
process.stdout.write(JSON.stringify({ host, key, keyLocation, urlList }));
NODE

HTTP_STATUS="$(
  curl -sS \
    --max-time 60 \
    --output "$RESPONSE_FILE" \
    --write-out '%{http_code}' \
    --header 'Content-Type: application/json; charset=utf-8' \
    --data-binary "@$PAYLOAD_FILE" \
    "$ENDPOINT"
)"

case "$HTTP_STATUS" in
  200)
    printf 'IndexNow 已接收 %d 个 URL（HTTP 200）。\n' "${#URLS[@]}"
    ;;
  202)
    printf 'IndexNow 已接收 %d 个 URL，正在验证 Key（HTTP 202）。\n' "${#URLS[@]}"
    ;;
  *)
    [[ ! -s "$RESPONSE_FILE" ]] || cat "$RESPONSE_FILE" >&2
    fail "IndexNow 返回 HTTP $HTTP_STATUS。"
    ;;
esac

printf '提交成功只代表搜索引擎收到通知，不保证页面一定被抓取或收录。\n'
