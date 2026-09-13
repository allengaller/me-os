# MeOS — 个人生活数据操作系统

MeOS 是一个**本地优先**的个人操作系统：以「五维框架」（方向 / 行动 / 认知 / 反思 / 资源）为理论基石，
把散落在健康 App、笔记、聊天记录、目标清单里的生活数据汇聚到一条属于你的时间线上，
并通过 MCP 与技能系统让 AI 参与梳理、反思与创作。

> **使命**：让每个人都能像运营一个操作系统一样运营自己的人生 —— 数据在自己手里，方法论可插拔，AI 可读写。
> **核心理念**：不是任务清单工具，而是生活状态的仪表盘；不是记录流水账，而是促进深度思考与成长。

## 在线体验

部署在 Meoo 平台，公网可直接访问：

https://i76snwerw0t7.meoo.fun

## 七大板块

| 板块 | 回答的问题 | 能力概览 | 路由 |
|---|---|---|---|
| **方向 Direction** | 我要去哪里 | 愿景、领域、目标与关键结果（OKR）、工作流画布、心态格言、平衡轮 | `/direction` |
| **行动 Action** | 我今天做什么 | 待办看板、习惯打卡与日历 | `/action` |
| **认知 Cognition** | 我要搞懂什么 | 课题研究、洞察笔记、阅读清单 | `/cognition` |
| **反思 Reflection** | 我做得怎样 | 每日反思（自动汇总当日行动数据）、周/月/季/年周期复盘 | `/reflection` |
| **资源 Resources** | 我用什么做 | 订阅与配额、人脉、健康记录、开发环境 | `/resources` |
| **MeLog** | 我的生活数据说了什么 | 健康笔记聊天记录汇入统一时间线，技能加工 + MCP 接入 + 定时调度 | `/melog` |
| **品牌 Brand** | 我的输出如何影响世界 | 品牌资产中枢、内容流水线（一鱼多吃）、渠道矩阵与指标、作品库 | `/brand` |

板块之外还有两个**聚合入口**：**Today**（`/`，今日待办、习惯打卡与反思入口的一站式工作台）与
**Workbench**（`/workbench`，个人工作台），以及 Chrome 扩展快捷入口。

五维之间的联动是系统的灵魂：反思的「明日计划」一键生成待办、复盘自动汇总目标/待办/习惯数据、
平衡轮从目标完成率推算评分、健康记录自动带入每日反思 —— 详见 [DESIGN.md](./DESIGN.md)。

## 核心亮点

- 🔒 **数据主权** — 本地 SQLite 或云端 PostgreSQL（RLS 隔离），数据在你手里
- 🌐 **云端同步** — 手机浏览器登录即可录入和阅读，跨设备数据一致（Meoo 平台）
- 🔌 **AI-Ready** — 内置 MCP Server（JSON-RPC 2.0 over HTTP），任何 MCP 客户端可读写时间线、运行技能
- 📐 **标准先行** — [MeLog Standard](./docs/实践/记录/标准.md) 开放数据信封 / Ingest API / Skill 清单格式，连接器与技能可社区共建
- 🧩 **方法论工具箱** — 平衡轮、OKR、GTD、时间矩阵内置为产品能力，而非单一方法论绑架

## 技术栈

### 双路数据架构

MeOS 支持三种数据模式，通过 `apps/web/src/lib/api.ts` 切换：

| 模式 | 触发条件 | 后端 | 适用场景 |
|---|---|---|---|
| **supabase**（默认） | 生产部署 | Meoo Supabase（PostgreSQL + RLS） | 手机/多设备日常使用 |
| **local** | Chrome 扩展或 `VITE_USE_LOCAL=1` | IndexedDB（零服务器） | 离线/隐私场景 |
| **remote** | `VITE_USE_REMOTE=1` | 本地 Fastify API | 开发调试 |

### 前端（apps/web）

- React 18 + TypeScript + Vite（端口 3015，HashRouter）
- TailwindCSS + Recharts + @xyflow/react + react-markdown
- Zustand（状态管理）+ supabase-js（云端数据层）+ Axios
- 数据适配器：`supabaseAdapter`（默认）/ `localDBAdapter`（离线）/ `remoteApi`（Fastify）

### 云服务（Meoo 平台）

- PostgreSQL 数据库（37 表 + 76 索引 + 61 外键 + RLS 全覆盖）
- 认证：Supabase Auth（密码登录，admin 建号）
- CDN 部署：`meoo deploy` → `*.meoo.fun`
- 本地 dev 代理：vite `/sb-api → SUPABASE_URL`

### 本地后端（packages/api，保留供 Chrome 扩展与开发）

- Node.js + TypeScript + Fastify
- Prisma + SQLite（37 个数据模型）
- JWT 认证；MeLog 技能引擎（规则引擎 + 可选 OpenAI 兼容 LLM）

### 周边

- `apps/chrome-extension` — Chrome MV3 扩展（快捷入口）
- `packages/connectors` — MeLog 官方连接器 CLI（Apple Health / chatlog），零运行时依赖
- `packages/shared` — 前后端共享类型与分页工具
- Turbo monorepo + Vitest + GitHub Actions CI

## 项目结构

```
me-os/
├── apps/
│   ├── web/                    # Web 前端（主端）
│   │   ├── src/pages/          # Today、Workbench、Login + 7 个板块 Hub
│   │   ├── src/lib/
│   │   │   ├── api.ts          # 数据层三元切换（supabase/local/remote）
│   │   │   ├── supabaseAdapter.ts  # Supabase 数据适配器（默认）
│   │   │   └── localDB.ts      # IndexedDB 离线适配器
│   │   └── src/supabase/
│   │       ├── client.ts       # Supabase 客户端（meoo cloud 自动维护）
│   │       └── types.ts        # 数据库类型（meoo migrate 自动更新）
│   └── chrome-extension/       # Chrome MV3 扩展
├── packages/
│   ├── api/                    # Fastify API 服务（本地模式用）
│   │   └── src/prisma/
│   │       ├── schema.prisma        # 本地 SQLite schema
│   │       └── schema.cloud.prisma  # 云端 PostgreSQL schema（自动生成）
│   ├── connectors/             # MeLog 官方连接器
│   └── shared/                 # 共享类型
├── scripts/
│   ├── backup-db.sh            # 本机 SQLite 备份（保留最近 30 份）
│   ├── gen-cloud-schema.py     # 从本地 schema 生成云端 schema
│   └── import-to-cloud.py      # SQLite → PostgreSQL 导入器（三种模式）
├── migrations/                 # 云端数据库迁移文件
├── docs/                       # 文档中心
├── DESIGN.md                   # 五维数据模型、联动关系与 Dashboard 设计
├── GETTING_STARTED.md          # 本地启动指南
└── turbo.json / pnpm-workspace.yaml
```

## 快速开始

### 方式一：云端使用（推荐日常）

直接打开 https://i76snwerw0t7.meoo.fun ，登录后即可使用。数据存储在 Meoo 云 PostgreSQL，跨设备同步。

### 方式二：本地开发

**环境要求**：Node.js 18+、pnpm >= 8.0.0

```bash
pnpm install

# 启动前端（端口 3015）
cd apps/web
pnpm dev

# 打开 http://localhost:3015
# 数据模式自动选择：Chrome 扩展 → local，否则 → supabase
# 指定 remote 模式（需要 Fastify 后端）：
VITE_USE_REMOTE=1 pnpm dev
```

### 方式三：Chrome 扩展

```bash
pnpm web:build:extension
# 在 chrome://extensions 加载 apps/extension-dist/
```

### 部署到 Meoo

```bash
cd apps/web
meoo deploy --force    # 构建 + 上传 CDN → *.meoo.fun
```

### 数据库迁移（云端）

```bash
# DDL 迁移（建表/RLS/触发器）
meoo db migrate --name <name> --sql "$(cat migrations/<file>.sql)"

# 查看表结构
meoo db tables

# 执行查询
meoo db query "SELECT count(*) FROM todos"
```

## 数据库架构

### 云端（Meoo PostgreSQL）

37 张表覆盖完整五维系统：

- 用户与权限：`users`、`auth.users`（RLS 全覆盖）
- 方向：`visions`、`domains`、`goals`、`key_results`、`mindset_slogans`、`balance_wheel_scores`
- 行动：`todos`、`habits`、`habit_logs`
- 认知：`topics`、`topic_notes`、`insight_notes`、`reading_items`
- 反思：`reflections`、`periodic_reviews`
- 资源：`subscriptions`、`quota_definitions`、`monthly_usages`、`quota_usages`、`contacts`、`health_records`
- MeLog：`melog_sources`、`melog_entries`、`melog_skills`、`melog_runs`、`melog_schedules`
- 品牌：`brand_profiles`、`brand_pillars`、`platform_channels`、`content_items`、`content_distributions`、`works`、`metric_snapshots`
- 工作流：`workflows`、`workflow_steps`、`workflow_connections`

### RLS 策略

所有表启用行级安全：`user_id = auth.uid()::text`。匿名访问返回空集，未登录写入被拒绝。`SERVICE_ROLE_KEY` 仅存在于 Edge Function 环境，不进前端代码。

### 时间戳处理

- 所有 `createdAt` / `updatedAt` 列默认值 `now()`
- `updatedAt` 通过 PostgreSQL 触发器在 UPDATE 时自动推进
- SQLite 中的 `DateTime`（integer epoch 毫秒）导入 PostgreSQL 时必须用 `to_timestamp(x::bigint/1000.0)` 转换

## 文档导航

| 文档 | 内容 |
|---|---|
| [docs/README.md](./docs/README.md) | **文档中心总索引** |
| [gtm/README.md](./gtm/README.md) | **GTM 总纲**：定位 / 人群 / 定价 / 渠道 / 上线计划 / 指标 |
| [DESIGN.md](./DESIGN.md) | 五维模型、数据模型、跨维度联动、Dashboard 设计 |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | 本地启动指南 |
| [docs/实践/记录/总览.md](./docs/实践/记录/总览.md) | MeLog 板块总览 |
| [docs/实践/记录/标准.md](./docs/实践/记录/标准.md) | MeLog Standard v0.1 |
| [packages/connectors/README.md](./packages/connectors/README.md) | 官方连接器使用指南 |
| [docs/实践/品牌/总览.md](./docs/实践/品牌/总览.md) | 品牌板块总览 |
| [docs/理论/方法论/总览.md](./docs/理论/方法论/总览.md) | 五维框架方法论总览 |

## 路线图

- ✅ **阶段一（MVP）** — 五维框架全量落地 + MeLog 板块 + 品牌板块 + Chrome 扩展
- ✅ **云端部署** — Meoo 云 PostgreSQL + Supabase Auth + CDN + RLS 全链路验证通过
- 🚧 **阶段二** — 多方法论整合深化、移动端基础功能、Edge Function 接管 melog LLM 与连接器
- ⬜ **阶段三** — MeLog 桌面控制中心（Tauri）、Skill 市场、智能化与生态
- ⬜ **阶段四** — 持续优化与商业化；多端扩展（Mac 原生应用、微信小程序、CLI）

## 数据备份

### 本机 SQLite

```bash
./scripts/backup-db.sh     # 导出到 ~/Backups/meos/，保留最近 30 份
```

### 云端 PostgreSQL

```bash
# 逐表导出 JSON（通过 meoo db query）
meoo --json db query --project <urlId> "SELECT jsonb_agg(t) FROM (SELECT * FROM todos) t"
```

> 注意：当前没有 `pg_dump` 直连（Meoo 不暴露数据库端口），备份依赖 `meoo db query`。
> Storage 桶文件不在 SQL dump 内，需单独处理。

## 常见问题

### 1. 本地 dev 登录返回 403

Meoo 的 Tengine 网关在本地环境拦截 `/auth/v1/token` POST。生产 URL 正常。
本地开发用 `VITE_USE_REMOTE=1` 走 Fastify 后端，或用生产 URL 测试登录。

### 2. `meoo deploy` 报"未找到构建产物目录"

从 `apps/web/` 目录执行 deploy，或确认根目录有 `dist/`。

### 3. Windows 25H2 兼容性问题

使用 Node.js 18–20 LTS；项目已通过 pnpm overrides 强制 esbuild 0.21.5。

### 4. 依赖安装失败

```bash
pnpm install --force
```

### 5. 如何创建新用户

Meoo 平台默认关闭公开注册。通过 admin API 创建：

```bash
curl -X POST "<SUPABASE_URL>/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -d '{"email":"user@example.com","password":"...","email_confirm":true}'
```

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提 Issue。
