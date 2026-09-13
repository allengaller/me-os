# MeOS — 个人生活数据操作系统

MeOS 是一个**本地优先**的个人操作系统：以「五维框架」（方向 / 行动 / 认知 / 反思 / 资源）为理论基石，
把散落在健康 App、笔记、聊天记录、目标清单里的生活数据汇聚到一条属于你的时间线上，
并通过 MCP 与技能系统让 AI 参与梳理、反思与创作。

> **使命**：让每个人都能像运营一个操作系统一样运营自己的人生 —— 数据在自己手里，方法论可插拔，AI 可读写。
> **核心理念**：不是任务清单工具，而是生活状态的仪表盘；不是记录流水账，而是促进深度思考与成长。

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

- 🔒 **本地优先** — 数据存于本地 SQLite，不经云端转发；MeLog 条目只在你显式配置 LLM 端点时才会外发
- 🔌 **AI-Ready** — 内置 MCP Server（JSON-RPC 2.0 over HTTP），任何 MCP 客户端可读写时间线、运行技能
- 📐 **标准先行** — [MeLog Standard](./docs/实践/记录/标准.md) 开放数据信封 / Ingest API / Skill 清单格式，连接器与技能可社区共建
- 🧩 **方法论工具箱** — 平衡轮、OKR、GTD、时间矩阵内置为产品能力，而非单一方法论绑架

## 技术栈

### 后端（packages/api）

- Node.js + TypeScript + Fastify
- Prisma + SQLite（36 个数据模型，schema 位于 `packages/api/src/prisma/schema.prisma`）
- JWT 认证；MeLog 技能引擎（规则引擎 + 可选 OpenAI 兼容 LLM）
- MCP Server 端点 `POST /mcp`

### 前端（apps/web）

- React 18 + TypeScript + Vite
- TailwindCSS + Recharts（可视化）+ @xyflow/react（工作流画布）+ react-markdown
- Zustand（状态管理）+ Axios + IndexedDB 离线层（`src/lib/localDB.ts`）

### 周边

- `apps/chrome-extension` — Chrome MV3 扩展（快捷入口）
- `packages/connectors` — MeLog 官方连接器 CLI（Apple Health 导出解析 / chatlog 兼容），零运行时依赖
- `packages/shared` — 前后端共享类型与分页工具
- Turbo monorepo + Vitest（31 个测试文件）+ GitHub Actions CI（lint / build / test）

## 项目结构

```
me-os/
├── apps/
│   ├── web/                    # Web 前端（主端）
│   │   └── src/pages/          # Today、Workbench、Login + 7 个板块 Hub（Hub 内含子页面）
│   └── chrome-extension/       # Chrome MV3 扩展
├── packages/
│   ├── api/                    # Fastify API 服务
│   │   └── src/modules/        # 19 个业务模块：
│   │                           #   auth · vision · domain · goal · balance-wheel · mindset
│   │                           #   todo · habit · topic · reading · insight · reflection · review
│   │                           #   health · contact · subscription · melog · workflow · brand
│   ├── connectors/             # MeLog 官方连接器（apple-health / chatlog）
│   └── shared/                 # 共享类型与分页工具
├── docs/                       # 文档中心（见下方文档导航）
├── DESIGN.md                   # 五维数据模型、联动关系与 Dashboard 设计
├── GETTING_STARTED.md          # 本地启动指南
├── dev.sh                      # 一键启动脚本
└── turbo.json / pnpm-workspace.yaml
```

> 多端规划（Mac 应用 / 微信小程序 / CLI）见[路线图](#路线图)，未实现前不在仓库中保留空占位目录。

## 快速开始

### 环境要求

- Node.js 18–20 LTS（Node 22 存在兼容性问题；CI 使用 Node 20）
- pnpm >= 8.0.0

### 一键启动（推荐）

```bash
./dev.sh
```

脚本会自动完成：端口清理 → 依赖安装 → 生成 `JWT_SECRET` → 数据库初始化 → 启动前后端 → 健康检查 → 打开浏览器。

### 手动启动

```bash
pnpm install

# 初始化数据库（首次运行必做）
cd packages/api
pnpm db:generate
pnpm db:push
pnpm db:seed        # 可选：填充示例数据
cd ../..

pnpm dev            # 同时启动前后端（后端 :3001，前端 :3000）
# 或分别启动：pnpm backend:dev / pnpm web:dev
```

首次访问 http://localhost:3000 注册账号，系统会自动初始化 8 个默认生活领域。
更多细节（环境变量、MeLog LLM 配置）见 [GETTING_STARTED.md](./GETTING_STARTED.md)。

### 构建

```bash
pnpm build                    # packages/api/dist/ + apps/web/dist/
pnpm web:build:extension      # 构建 Chrome 扩展产物
```

### 开发

```bash
pnpm test                     # Vitest 全量测试
pnpm lint                     # ESLint
pnpm --filter @meos/api db:studio   # Prisma Studio 查看数据
```

开发模式下 API 默认使用 mock 用户（`MEOS_DEV_AUTH=true` 或 `NODE_ENV=development`）；
生产环境必须设置 `JWT_SECRET`，否则拒绝启动。

## 文档导航

| 文档 | 内容 |
|---|---|
| [docs/README.md](./docs/README.md) | **文档中心总索引**（全仓库文档地图） |
| [gtm/README.md](./gtm/README.md) | **GTM 总纲**：定位 / 人群 / 定价 / 渠道 / 上线计划 / 指标（含分册） |
| [DESIGN.md](./DESIGN.md) | 五维模型、数据模型、跨维度联动、Dashboard 设计 |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | 启动、环境变量、常见问题 |
| [docs/实践/记录/总览.md](./docs/实践/记录/总览.md) | MeLog 板块总览：架构、API、MCP 工具、技能引擎 |
| [docs/实践/记录/标准.md](./docs/实践/记录/标准.md) | MeLog Standard v0.1 开放格式规范 |
| [packages/connectors/README.md](./packages/connectors/README.md) | 官方连接器使用指南 |
| [docs/实践/品牌/总览.md](./docs/实践/品牌/总览.md) | 品牌板块总览与品牌蓝本摘要 |
| [docs/理论/方法论/总览.md](./docs/理论/方法论/总览.md) | 五维框架方法论总览 |
| [docs/理论/方法论/整合.md](./docs/理论/方法论/整合.md) | 五维协同运作指南 |

## 路线图

- ✅ **阶段一（MVP）** — 五维框架全量落地 + MeLog 板块（v0.3：MCP + 官方连接器 + 技能调度 + LLM 运行器）+ 品牌板块 + Chrome 扩展
- 🚧 **阶段二** — 多方法论整合深化、移动端基础功能
- ⬜ **阶段三** — MeLog 桌面控制中心（Tauri）、Skill 市场、智能化与生态
- ⬜ **阶段四** — 持续优化与商业化；多端扩展（Mac 原生应用、微信小程序、CLI）

MeLog 板块自身的迭代路线见 [docs/实践/记录/总览.md §路线图](./docs/实践/记录/总览.md)。

## 常见问题

### 1. Windows 25H2 兼容性问题

**现象**：前端启动报错 `Cannot read directory "../../../../.."`

**解决**：使用 Node.js 18–20 LTS；项目已通过 pnpm overrides 强制 esbuild 0.21.5。

### 2. 注册时报错 "The table `main.User` does not exist"

**原因**：数据库表未创建。

```bash
cd packages/api
pnpm db:push
```

### 3. 依赖安装失败

```bash
pnpm install --force
```

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提 Issue。
