# 个人工作台调研：Agent 时代如何做个人工作台

> 调研日期：2026-08-01
> 目标：研究在当前（Agent 时代）如何构建一个个人工作台，将进行中的项目、GitHub 活动、信息输入、日常打卡、学习/思考专题等聚合到单一页面。结论用于指导将该工作台**融入 me-os** 现有体系。

---

## 一、执行摘要（TL;DR）

1. **me-os 已经是"个人 OS"，不是"导航页"。** 市面上最火的开源 dashboard（Dashy / Homepage / Homarr / Glance）本质是"服务聚合导航"，和 me-os 这种"人生管理仪表盘"是两个物种。不要拿它们当对标去重写，而要**借鉴它们的 widget 聚合思路**。
2. **最值得直接借鉴的项目是 [Glance](https://github.com/glanceapp/glance)**——单页、多源信息流（RSS / GitHub / 天气 / 日历）、YAML 配置、Go 单二进制。它的 widget 架构正好补上 me-os 目前缺的"外部信息输入"这一块。
3. **融入路径：在现有 `apps/web` 里升级首页，而非新建独立项目。** 你的 `Today.tsx` 和遗留的 `Dashboard.tsx` 已经是聚合页雏形，缺的只是外部数据源（GitHub / RSS / 第三方工具）的接入层。
4. **Agent 能力先不做，是对的。** 调研显示 2026 年 Agent 工作台（OpenClaw / Hermes / AutoGPT）仍偏"自动化执行"，而你的核心诉求是"一页看全"。先把聚合展示做扎实，Agent 留作第二阶段。
5. **一句话方案：** 把 Glance 式的"外部信息 widget"嫁接到 me-os 的 Today 页面，新增一个 `integration` 后端模块统一对接外部 API，前端用 bento-grid 布局把"内部人生数据 + 外部项目/信息流"拼到一页。
6. **产品灵魂是"掌控感"**：数据本地自有、首屏自己设计、无算法投喂——这是碾压 WorkBuddy（SaaS）和云端 dashboard 的核心差异（详见第七节）。文章理念见"一·补 设计哲学"。

---

## 一·补、设计哲学：工作台到底解决什么体验问题

> 借鉴来源：公众号"谁动了我的芝麻酱"《搭建个人工作台，可能是今年最值的半小时》(2026-07-28)。
> 该文虽是腾讯 WorkBuddy 的推广软文，但对"为什么需要工作台"的体验刻画非常精准，提炼如下作为 me-os 工作台的**设计准绳**。

工作台不是一个技术问题，是一个体验问题。它的目标只有一个：

### 北极星：从"被动回忆"变成"主动看见"

这是整个工作台的灵魂。以前打开电脑，第一步是回忆："我昨天干到哪了？今天该做什么？那个文档在哪？"——这是**被动回忆**，消耗决策成本。工作台要做的是把这些信息**主动摊在你眼前**，让你三秒之内知道下一步。

### 三条设计原则（每个技术决策都应回扣这些原则）

1. **三秒法则**：首屏信息密度以"三秒能扫完并决定下一步"为标准。多了是噪音，少了不够用。这是 bento grid 布局的验收标准。
2. **主动 vs 被动**：每天打开的第一个页面应该是**自己设计的、为自己服务的**，而不是热搜、推送、别人的算法。这是个人工作台区别于一切商业 dashboard 的精神内核。
3. **渐进增强，不是庞大工程**：文章原话——"形式不重要，能解决问题就行"。MVP 先硬编码几个核心卡片跑通"看全"，再迭代丰富。不要一开始就追求 widget 拖拽、全可配置。

### 一个关键差异：掌控感来自数据自有

文章把"掌控感"作为工作台最重要的价值。落地到 me-os，这意味着——**数据在你本地 SQLite，不被云端算法投喂**。这不是一个技术特性，是产品灵魂，是碾压腾讯 WorkBuddy（SaaS）和所有云端 dashboard 的护城河。（详见第七节差异化对比）

---

## 二、现状：me-os 已经有什么

调研了现有代码库，结论是**基础设施已完备，缺的只是"外部数据源接入"和"一页式聚合视图"**。

| 能力 | 现状 | 评估 |
|------|------|------|
| 全栈骨架 | React18 + Vite 前端 / Fastify + Prisma + SQLite 后端 | ✅ 成熟 |
| 业务模块 | 17 个模块（todo/habit/goal/topic/reflection/vision...） | ✅ 完整 |
| 首页聚合 | `Today.tsx`（当前首页）、`Dashboard.tsx`（遗留五维仪表盘） | ⚠️ 有雏形，但只聚合了内部数据 |
| 外部数据接入 | 无 GitHub / RSS / 日历等对接 | ❌ **核心缺口** |
| 单页布局 | 现有是竖向流式，非 bento-grid | ⚠️ 可升级 |
| Agent 能力 | 无 | ⏸ 按计划暂不做 |

**关键发现：** `Dashboard.tsx`（`apps/web/src/pages/Dashboard.tsx`）已经实现了"并发拉取 7 个接口聚合展示"的模式，但**当前路由未引用它**（首页被 `Today.tsx` 取代）。这个文件不是废代码——它的聚合模式正是工作台要的，可以复活/演进。

---

## 三、市场调研：三类对标项目

### 类别 A：服务导航型 Dashboard（不适合直接对标，但 widget 思路可借鉴）

这类项目解决"我有十几个自托管服务，怎么一页打开"的问题，**不是**个人生产力工作台。

| 项目 | Star 级 | 特点 | 对 me-os 的价值 |
|------|---------|------|----------------|
| **[Glance](https://github.com/glanceapp/glance)** | 高热度 | 单页多源 widget（RSS/GitHub/天气/视频/论坛），Go 单二进制，YAML 配置 | ⭐ **最有价值**：widget 聚合架构可直接借鉴 |
| [Homepage](https://github.com/gethomepage/homepage) | 极高 | YAML 配置即代码，100+ 服务集成，强 API/widget | 借鉴：config-as-code 思路 |
| [Homarr](https://github.com/ajnart/homarr) | 高 | 拖拽式可视化布局，Docker 集成 | 借鉴：拖拽 bento 布局交互 |
| [Dashy](https://github.com/Lissy93/dashy) | 高 | 主题丰富、状态检查、UI 编辑器 | 借鉴：多主题/状态健康检查 |
| Heimdall / Homer | 中 | 轻量极简，资源占用低 | 价值有限 |

**核心洞察：** 它们的强项是"**对接外部服务的 widget 体系**"——这正是 me-os 要补的能力。但它们的弱项是"**没有业务逻辑**"（不懂你的目标、习惯、反思），而这恰是 me-os 的护城河。所以是**互补关系，非替代**。

### 类别 B：个人 OS / 生活管理型（同赛道，直接竞品）

| 项目 | 定位 | 与 me-os 的异同 |
|------|------|----------------|
| **[VivOrdo](https://github.com/topics/life-management)** | 本地个人生活 OS，聚合笔记/任务/日历/目标/习惯/健康/财务/学习 | **最接近的竞品**，但它是通用聚合，me-os 有"五维反思"方法论深度 |
| [Flow Dashboard](https://news.ycombinator.com/item?id=...) | 开源习惯追踪，主打"外包记忆"+ 自动时间记录 | 习惯模块的参考，me-os 已有 Habit 模块 |
| Notion 模板（GitHub 风格习惯追踪） | 用贡献热力图做习惯打卡 | 借鉴：GitHub 贡献图式的习惯可视化 |
| [Blinko](https://www.reddit.com/r/selfhosted/comments/1pdui2u/) | AI 驱动的自托管知识/生产力工具 | 借鉴：AI 辅助笔记（对应 me-os 的 Insight/Topic） |

### 类别 C：Agent 时代的新范式（前瞻参考，本期不落地）

2026 年涌现的"Agent 工作台"概念，核心是**让 AI 自主执行任务**而非仅展示。本次按你的决定暂不投入，但记录趋势供后续参考：

| 方向 | 代表 | 核心理念 |
|------|------|---------|
| 个人 AI 助手 | OpenClaw / Hermes Agent | 持久跨会话记忆，能调用工具 |
| 自主任务执行 | AutoGPT | 给目标，Agent 自己拆解执行 |
| 多 Agent 协作 | CrewAI | 多角色 Agent 协同 |
| 触发式工作流 | Notion Custom Agents (2026.02) | 事件触发自动执行 |

> **趋势判断：** "聚合展示"（本期）→ "AI 辅助查询/总结"（中期）→ "Agent 自主执行"（远期）是自然演进路径。现在把数据源接全、结构化做好，就是为未来 Agent 化打地基。

---

## 四、最佳实践提炼

综合竞品和行业趋势，一个优秀的个人工作台应遵循：

### 1. 单页 Bento-Grid 布局，而非长滚动
- **Glance / Homarr / Apple/Notion 首页**都在用"不规则网格卡片"（bento grid），信息密度高且一眼可扫。
- me-os 现有 Today 页是竖向流式，**建议升级为可自定义的网格布局**。

### 2. 内外数据分层聚合
```
工作台首页 = 内部数据（me-os 17 模块）+ 外部数据源（GitHub/RSS/日历/...）
```
- 内部数据：已有 API，直接调（todo/habit/goal/topic/reflection）。
- 外部数据：需要一个**统一的 integration 接入层**（见第五节）。

### 3. Widget 化、可配置、可增删
- 每个信息块是一个独立 widget（GitHub 活跃度 widget、今日待办 widget、RSS 流 widget...）。
- 用户可选择显示/隐藏/拖拽排列（参考 Homarr）。
- 这是 Glance 最值得借鉴的架构。

### 4. 渐进式增强，而非一步到位
- **P0**：静态聚合展示（先有"看全"的能力）。
- **P1**：轻交互（页内打卡、完成待办、收藏 RSS 条目）。
- **P2**：AI 辅助（总结今日、智能归类）。
- **P3**：Agent 自主执行（自动同步、主动提醒）。

### 5. 本地优先 + 可选云同步
- me-os 已是 SQLite 本地优先，符合隐私趋势。
- 外部 API token（GitHub 等）只存本地，不上传。

---

## 五、融入 me-os 的具体方案建议

### 架构：在现有 apps/web 内升级，新增 integration 后端模块

```
me-os/
├── packages/api/src/modules/
│   └── integration/          # 【新增】外部数据源统一接入层
│       ├── routes.ts         # GET /integrations/github, /rss, /calendar
│       ├── github.ts         # GitHub API 封装
│       ├── rss.ts            # RSS 聚合
│       └── routes.test.ts
├── apps/web/src/
│   ├── pages/
│   │   ├── Today.tsx         # 【升级】现有首页，加入外部 widget
│   │   └── Dashboard.tsx     # 【复活/重构】做成完整工作台（bento grid）
│   └── components/
│       └── widgets/          # 【新增】widget 组件库
│           ├── GithubWidget.tsx
│           ├── RssWidget.tsx
│           ├── TodoWidget.tsx
│           ├── HabitWidget.tsx
│           └── ...
```

### 需要对接的信息源清单（先用"每天必看法"做减法）

> 方法论修订：文章的核心建议是——**先拿出一张纸，写下你每天必看的 5-10 个工具/页面，注意是"每天必看"而不是"偶尔会用"**。用这个标准做减法，避免工作台变成杂物间。
> 因此下面的清单不再是"我替你定"，而是**待你确认的候选池**。请按"每天必看"打勾，打勾的才进 P0。

**请先做这一步（你的清单）：** 列出你每天打开电脑必看、必用的 5-10 样东西。例如：邮箱、GitHub、某个文档、某个服务器面板、技术博客……列完后，再对照下面的候选池确认。

**候选信息源池（按你的初步选择，待用"每天必看法"筛选）：**

| 信息源 | 接入方式 | 你每天必看？(Y/N) | 优先级 | 说明 |
|--------|---------|:-:|--------|------|
| **GitHub 项目状态** | GitHub REST API（`/users/{u}/events`、`/repos`） | ? | P0 候选 | 仓库列表、近期 commit、PR/Issue、贡献热力图 |
| **外部信息输入（RSS）** | 后端定时拉取 RSS → 存 SQLite，或直连 | ? | P0 候选 | 技术博客 / Newsletter / 稍后读 |
| **me-os 已有数据** | 现有 API 直调 | ? | P0 候选 | todo/habit/topic/reflection/goal/vision |
| **外部生产力工具** | 各自 API（日历 ICS / Notion / Linear） | ? | P1 候选 | 建议从日历（ICS 订阅）入手，最通用 |
| **快捷导航（书签）** | 前端配置，无需后端 | ? | P0 候选 | 每天必开的链接入口 [文章新增] |

> 只有"你每天必看 = Y"的才定为 P0，其余降级或砍掉。这能避免接入一堆"偶尔会用"的信息源，拖慢 MVP。

### 首屏布局建议（Bento Grid 草图）

> 修订：补入文章点名的两个要素——**快捷导航**（每天必开的链接）和**快速捕捉框**（随手记想法）。这两个是工作台区别于"纯看板"的关键：它不只是看，还能**捕获**。

```
┌──────────────────┬──────────────────┐
│   快捷导航 (书签)   │   快速捕捉框       │  ← 新增：文章点名的两要素
│   每天必开的入口    │   随手记想法/灵感   │
├────────┬─────────┼────────┬─────────┤
│ 问候+愿景 │ 今日待办  │ 习惯打卡 │ 近期目标  │
│(me-os) │(me-os)  │(me-os) │(me-os)  │
├────────┼─────────┼────────┼─────────┤
│GitHub活跃│ RSS信息流 │学习专题  │日程/日历  │
│ (外部)  │ (外部)   │(me-os) │ (外部)  │
├────────┴─────────┴────────┴─────────┤
│          今日反思入口 (me-os)           │
└──────────────────────────────────────┘
```

**对照文章四要素的覆盖检查：**
- ✅ 今天的日历和待办 → 今日待办 + 日程/日历
- ✅ 你最常用的几个链接 → **快捷导航（书签）** [文章点名，原方案遗漏]
- ✅ 一个可以随手记东西的地方 → **快速捕捉框** [文章点名，原方案遗漏]
- ✅ 你关心的数据看板 → GitHub 活跃度 + 习惯打卡 + 近期目标 + 学习专题

---

## 六、推荐参考项目（分级）

### ⭐ 必看（直接借鉴架构）
- **[Glance](https://github.com/glanceapp/glance)** — widget 聚合、多源信息流、单页布局的范本。重点看它的 widget 类型设计和 YAML 配置结构。

### 值得研究（借鉴局部）
- **[Homepage](https://github.com/gethomepage/homepage)** — 100+ 服务集成的 widget 实现方式，config-as-code。
- **[Homarr](https://github.com/ajnart/homarr)** — 拖拽式 bento 布局的交互设计。
- **VivOrdo**（GitHub `life-management` topic）— 同赛道竞品，看它如何聚合多维度。
- **[Flow Dashboard](https://news.ycombinator.com/item?id=...)** — 习惯追踪 + 时间记录的细节。

### 了解即可（远期 Agent 化时再看）
- [Vellum: 8 Best Open-Source Personal AI Assistants 2026](https://www.vellum.ai/blog/best-open-source-personal-ai-assistants)
- [SitePoint: 开源个人 AI Agent 指南](https://www.sitepoint.com/the-rise-of-open-source-personal-ai-agents-a-new-os-paradigm/)
- [dev.to: 10 Best Open-Source AI Agents 2026](https://dev.to/sonotommy/10-best-open-source-ai-agents-for-2026-2l6p)

### 综合目录（持续发现新项目用）
- [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)
- [selfh.st/apps](https://selfh.st/apps/) — 可视化自托管应用目录
- [GitHub topic: life-management](https://github.com/topics/life-management)
- [GitHub topic: habit-tracker](https://github.com/topics/habit-tracker)

---

## 七、关键结论

1. **不要新建项目，融入 me-os。** 你的护城河是"五维反思方法论 + 17 个业务模块"，这是 Glance/Homepage 们永远没有的。工作台只是给这套体系加一个"一页看全 + 接入外部世界"的壳。

2. **核心工作量不大，且 MVP 可以更狠地做减法。** 文章的理念是"形式不重要，能解决问题就行，不是庞大工程，逐渐丰富"。因此 MVP 第一版甚至可以不要 widget 拖拽/全可配置——先硬编码几个核心卡片跑通"看全"，再迭代。前端布局（bento grid）+ 一个 `integration` 后端模块（先接 GitHub + RSS）即可起步。现有 `Dashboard.tsx` 的聚合模式可直接复用演进。

3. **Glance 是最重要的参考。** 把它的 widget 架构思想搬进来，但 widget 的内容用 me-os 的业务数据填充，就形成了"有灵魂的 Glance"。

4. **Agent 暂缓是对的。** 当前的数据基建（把内外数据源接全、结构化）恰恰是未来 Agent 化的前提。先把"看全"做好。

5. **【差异化护城河】本地优先 + 数据自有 = 掌控感。** 这是最该讲清楚的产品卖点，不是技术细节：

   | 维度 | me-os 工作台（你） | 腾讯 WorkBuddy | Glance/Homepage 等自托管 |
   |------|:---:|:---:|:---:|
   | 数据归属 | ✅ **本地 SQLite，完全自有** | ❌ 腾讯云 SaaS | ⚠️ 本地，但无业务数据 |
   | 算法投喂 | ✅ 无，自己决定看什么 | ❌ AI 推送 | ✅ 无 |
   | 业务深度 | ✅ 五维反思 + 17 模块 | ❌ 无方法论 | ❌ 纯导航，无业务 |
   | Agent 能力 | ⏸ 暂缓（未来可加） | ✅ 原生强项 | ❌ 无 |
   | 部署成本 | ✅ 本地一行命令 | ✅ 装客户端即用 | ✅ Docker 即用 |

   文章说"打开的第一个页面是自己设计的、为自己服务的，而不是热搜推送"——这正是 me-os 本地优先架构天然满足的。**WorkBuddy 是"AI 替你干活"，你是"一页看全自己的人生"，方向不同。** 把这一点作为对外叙事的核心。

   参考资料：
   - [腾讯 WorkBuddy 官网](https://www.workbuddy.cn/)（闭源 SaaS，桌面 AI Agent）
   - [IT之家：腾讯版"小龙虾"WorkBuddy 上线](https://www.ithome.com/0/927/230.htm)
   - [Eigent: WorkBuddy AI Review 2026](https://www.eigent.ai/blog/workbuddy-ai-review)

---

## 附：下一步建议动作（待你确认后进入实施规划）

- [ ] **第一步（最重要）：列出你"每天必看"的 5-10 个工具/页面**（参考第五节"每天必看法"，用它给信息源做减法）
- [ ] 确认首屏要放哪些 widget（基于第五节 bento 草图，已补入快捷导航 + 快速捕捉框）
- [ ] 确认 GitHub 接入的认证方式（Personal Access Token）
- [ ] 确认 RSS 源列表（你要订阅哪些）
- [ ] 决定是升级 `Today.tsx` 还是复活重构 `Dashboard.tsx`
- [ ] 进入实施规划（EnterPlanMode），出详细技术方案
