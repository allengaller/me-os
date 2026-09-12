# 品牌快照定时任务（How to schedule daily snapshots）

- 日期：2026-09-12
- 关联：连接器 [packages/connectors/](../../packages/connectors/) ｜ 数据接入策略 [DATA_SOURCES.md](./DATA_SOURCES.md)
- 适用：本地长期运行 MeOS 后端的个人工作台，让 B站 / YouTube / GitHub 等渠道指标按周期自动写入品牌板块

## 1. 准备

### 1.1 启用连接器需要的环境变量

把要启用的连接器配置写到 `~/.config/meos/snapshots.env`（脚本启动时自动 source），例如：

```bash
# MeOS 后端（dev 模式可省略 token）
export MEOS_URL=http://localhost:3001
export MEOS_API_TOKEN=        # dev 模式留空；非 dev 时填 JWT

# B站
export BILIBILI_MID=123456    # space.bilibili.com/{mid}，必填
export BILIBILI_COOKIE=       # 可选：填了才能拉投稿统计；粉丝数匿名可拉
export BILIBILI_MAX_VIDEOS=0  # 默认 0（仅粉丝数；需要统计时改 100）
export BILIBILI_CHANNEL_ID=   # 可选：多 B站渠道时指定目标渠道

# YouTube（需要 Google Cloud Console 启用 YouTube Data API v3 并申请 API key）
export YOUTUBE_CHANNEL_ID=UCxxxxxx
export YOUTUBE_API_KEY=AIza...
export YOUTUBE_MAX_VIDEOS=50
export YOUTUBE_TARGET_CHANNEL_ID=    # 可选：指定 MeOS 渠道

# GitHub（无需鉴权；传 token 提高速率配额）
export GITHUB_REPO=owner/name
export GITHUB_TOKEN=ghp_...
export GITHUB_TARGET_CHANNEL_ID=
```

脚本只会运行配置了对应变量的连接器（变量缺失则跳过）。

### 1.2 一次性准备（确保后端能写）

```bash
cd /path/to/me-os
pnpm --filter @meos/api db:push    # 首次 / 表结构变更后必做
pnpm --filter @meos/api db:seed:brand   # 初始化品牌 mock 数据（仅 dev 场景）
```

为每个要追踪的渠道在品牌板块「渠道与数据」页创建渠道，或首次运行连接器时让它自动创建。

## 2. 手动试运行

```bash
./scripts/snapshot-brand.sh
tail -n 30 ~/.melog/connectors/cron.log
```

每个连接器会在日志里记录 START/OK/FAIL；脚本始终 exit 0，不刷屏 cron 邮件。

## 3. cron 配置

`crontab -e` 加一行：

```cron
# 每天 09:00 跑一次（cron 路径短，使用绝对路径）
0 9 * * * /Users/yourname/path/to/me-os/scripts/snapshot-brand.sh >> /Users/yourname/.melog/connectors/cron.log 2>&1
```

注意：

- **MeOS 后端需要在该时间点处于运行状态**——cron 不会自动拉起后端。如果你的 dev.sh 是手动起的，要么把后端挂到 launchd 让它常驻，要么改成「上班后才打开」的频率，例如工作日 09:30（你打开 MeOS 之后再触发）。
- cron 进程的 PATH/环境与登录 shell 不同；脚本里走 `pnpm --filter exec tsx` 解析相对路径，避免依赖 `$PATH` 找 `pnpm`。
- 想每天多点几次（防止单点失败）：再加几行不同时间。

## 4. 替代方案

- **GitHub Actions**：如果把 MeOS 后端部署到公网可访问的环境（如一台有公网 IP 的 VPS 或反向隧道到家庭网络），可以写一个 workflow 在云端定时跑。但部署 MeOS 本身就破坏了「本地优先」的前提——除非你专门为此搭一个只跑快照写入的小服务，否则不如本地 cron。
- **手动触发**：所有 `brand-*` 连接器都带 `--dry-run`；随时可手动跑一遍查看数据而不写库。
- **fans-card 等模板**：`scripts/snapshot-brand.sh` 文件结构简单，可被 launchd/Windows 计划任务复用。

## 5. 封闭平台手动采集（brand-import）

`公众号` / `视频号` / `小红书` 等平台没有公开 API，浏览器插件方案需要你自己登录测试，落地成本较高。短期最实用的兜底是**手动采集 + JSON 导入**：

1. 浏览器登录创作者后台，把当前粉丝数与累计互动数据抄下来
2. 按下面的 schema 写成 JSON 文件
3. 跑 `melog-connector brand-import --file <path>`

JSON schema：

```json
{
  "platform": "wechat-mp",            // 或 wechat-channels / xiaohongshu / custom
  "handle": "公众号ID或名称",          // 同一 platform+handle 会复用游标
  "displayName": "公众号主号",          // 可选，首次自动建渠道的显示名
  "positioning": "...",                 // 可选
  "followers": 720,                    // 当前粉丝总数（必填）
  "totals": {
    "views": 9200,                      // 累计阅读 / 播放 / 曝光
    "likes": 460,                       // 累计点赞 / 在看 / 喜欢
    "comments": 90,
    "shares": 310
  },
  "note": "公众号后台 2026-09-12 复盘"  // 可选，写入快照的 note
}
```

各平台采集位置：

| 平台 | 数据 | 来源 |
|---|---|---|
| 公众号 | 粉丝 + 总阅读数 + 分享数 | 公众平台 → 数据分析 → 全部 → 关注 + 全部图文 |
| 视频号 | 粉丝 + 总播放 + 总点赞 + 转发 | 视频号助手 → 数据概览 |
| 小红书 | 粉丝 + 累计点赞 + 累计收藏 + 评论 | 创作中心 → 数据分析 |

游标规则：同一 platform+handle 共享同一基线（不同文件名也能累计），首次导入增量记为 null，第二次按累计差值。

可以把这个流程挂进 cron：每周跑一次 `brand-import --file ~/snapshots/wechat-2026-W37.json`（文件名随你）。

## 6. Chrome 扩展读创作者后台（实验性）

`apps/chrome-extension` 自 v0.2.0 起内置「品牌快照」区块（已内置在 popup 中）：

1. 打开浏览器扩展管理页，加载已解压的 `apps/chrome-extension/`（开发者模式）
2. 登录公众号（mp.weixin.qq.com）/ 视频号（channels.weixin.qq.com）/ 小红书创作中心（creator.xiaohongshu.com）后台
3. 点扩展图标 → 「品牌快照」→ 「从当前页提取」→ 核对数值 → 「同步到 MeOS 快照」

实现是**启发式正则抽取**（页面可见文本匹配「粉丝/阅读/点赞/评论/分享」），DOM 结构由各平台后台掌握且经常改版，**需要在你的登录态下实测校准**；提取结果可手动修正，也可完全不依赖提取、直接手填数值。同步写入 `/api/brand/snapshots`（开发模式免鉴权；生产模式需先在 MeOS 页面登录以获得 token）。

## 7. 故障排查

| 症状 | 排查 |
|---|---|
| 日志里 `FAIL bilibili code=-101` | nav 接口 -101：大概率 IP 触发了 B站风控，过几小时再试；或加 `--cookie` |
| 日志里 `FAIL bilibili code=-352` 或 HTTP 412 | 投稿列表需要 cookie；按 [DATA_SOURCES.md §2](./DATA_SOURCES.md#1-官方开放-apioauth-授权自己的账号--首选能走则走) 取登录态 cookie |
| 日志里 `FAIL youtube 403 quotaExceeded` | YouTube API 配额用完；每天 10000 单位一般够用，但大量视频时可能超额 |
| 日志里 `FAIL github 403 ratelimit` | 未鉴权 60 次/小时；加 `--token` 或 `GITHUB_TOKEN` |
| 日志里 `MeOS 返回 401` | MeOS 端关闭了 dev 免鉴权；填 `MEOS_API_TOKEN` |