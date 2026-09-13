#!/usr/bin/env bash
# brand-snapshot 每日定时快照脚本
# 在 cron 中调用：pnpm 数据库本地可达时拉取 B站 / YouTube / GitHub 指标写入 MeOS 品牌快照。
#
# 用法：scripts/snapshot-brand.sh
# 配置：在 ~/.config/meos/snapshots.env 写入要启用的连接器（见 docs/实践/品牌/快照调度.md）
# 日志：默认 ~/.melog/connectors/cron.log；可设置 SNAPSHOT_LOG 覆盖
#
# 设计：单个连接器失败不影响其他连接器；脚本始终 exit 0，避免 cron 邮件轰炸；
#       用户自行 `tail -f ~/.melog/connectors/cron.log` 排查。

set -u
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

LOG_FILE="${SNAPSHOT_LOG:-$HOME/.melog/connectors/cron.log}"
mkdir -p "$(dirname "$LOG_FILE")"

# 配置：可选的 ~/.config/meos/snapshots.env
[ -f "$HOME/.config/meos/snapshots.env" ] && . "$HOME/.config/meos/snapshots.env"

# 通用：MEOS_URL / MEOS_API_TOKEN 也可在这里覆盖
: "${MEOS_URL:=http://localhost:3001}"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*" | tee -a "$LOG_FILE"; }

run_conn() {
  local label="$1"; shift
  log "START $label"
  if (cd "$ROOT_DIR" && pnpm --filter @meos/melog-connectors exec tsx src/cli.ts "$@" >> "$LOG_FILE" 2>&1); then
    log "OK    $label"
  else
    log "FAIL  $label（exit $?，详见日志）"
  fi
}

# 公共参数组装
meos_args=()
[ "${MEOS_URL}" != "http://localhost:3001" ] && meos_args+=(--meos-url "$MEOS_URL")
[ -n "${MEOS_API_TOKEN:-}" ] && meos_args+=(--token "$MEOS_API_TOKEN")

# 1. B站 — 仅粉丝数（匿名可用，cookie 可时拉投稿统计）
if [ -n "${BILIBILI_MID:-}" ]; then
  args=(brand-bilibili --mid "$BILIBILI_MID" --max-videos "${BILIBILI_MAX_VIDEOS:-0}")
  [ -n "${BILIBILI_COOKIE:-}" ] && args+=(--cookie "$BILIBILI_COOKIE")
  [ -n "${BILIBILI_CHANNEL_ID:-}" ] && args+=(--channel-id "$BILIBILI_CHANNEL_ID")
  run_conn bilibili "${meos_args[@]}" "${args[@]}"
fi

# 2. YouTube — Data API v3（需 API key）
if [ -n "${YOUTUBE_CHANNEL_ID:-}" ]; then
  args=(brand-youtube --channel-id "$YOUTUBE_CHANNEL_ID" --max-videos "${YOUTUBE_MAX_VIDEOS:-50}")
  [ -n "${YOUTUBE_API_KEY:-}" ] && args+=(--api-key "$YOUTUBE_API_KEY")
  [ -n "${YOUTUBE_TARGET_CHANNEL_ID:-}" ] && args+=(--target-channel-id "$YOUTUBE_TARGET_CHANNEL_ID")
  run_conn youtube "${meos_args[@]}" "${args[@]}"
fi

# 3. GitHub — 公开仓库指标（无需鉴权；传 GITHUB_TOKEN 可提高速率配额）
if [ -n "${GITHUB_REPO:-}" ]; then
  args=(brand-github --repo "$GITHUB_REPO")
  [ -n "${GITHUB_TOKEN:-}" ] && args+=(--token "$GITHUB_TOKEN")
  [ -n "${GITHUB_TARGET_CHANNEL_ID:-}" ] && args+=(--target-channel-id "$GITHUB_TARGET_CHANNEL_ID")
  run_conn github "${meos_args[@]}" "${args[@]}"
fi

log "DONE"
exit 0