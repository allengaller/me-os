#!/bin/bash
# =================================================================
# dev.sh —— 已废弃的兼容入口，实际实现见 scripts/meos
#
# 保留这个文件只为不打破 README / GETTING_STARTED 里 `./dev.sh` 的约定，
# 以及你已有的肌肉记忆。新代码一律走 meos：
#
#   ./scripts/meos start        日常启动（不重复装依赖，比旧 dev.sh 快得多）
#   ./scripts/meos status       看谁在跑、健康与否
#   ./scripts/meos stop         干净停服（旧 dev.sh 的 Ctrl+C 是失效的）
#   ./scripts/meos help         全部命令
#
# 为什么不在这份脚本里继续改：它原先有三处缺陷——监控循环后台化导致脚本
# 提前退出（Ctrl+C 停不掉）、监控的是 pnpm 包装 PID 而非真实监听进程、
# 清理用 `pgrep -f vite|tsx` 无差别 kill 会误杀别的项目的进程。
# 进程监管逻辑现在只有 scripts/meos 一处，避免两份实现漂移。
# =================================================================

exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/meos" start --bootstrap "$@"
