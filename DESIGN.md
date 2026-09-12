# MeOS 五维人生管理系统 - 设计文档

## 一、系统概述

MeOS 是一个基于五维模型的个人管理平台，覆盖人生的五个核心维度：

| 维度 | 英文 | 核心问题 | 包含模块 |
|---|---|---|---|
| 方向 | Direction | 我要去哪里 | 愿景、领域、目标、关键结果、心态、平衡轮 |
| 行动 | Action | 我今天做什么 | 待办、习惯、习惯记录 |
| 认知 | Cognition | 我要搞懂什么 | 课题、课题笔记、洞察笔记、阅读清单 |
| 反思 | Reflection | 我做得怎样 | 每日反思、周期复盘 |
| 资源 | Resources | 我用什么做 | 订阅、人脉、健康记录、开发环境 |

在五维核心之上，MeOS 已扩展出三个增量板块与两个聚合入口：

| 板块 | 定位 | 回答的问题 |
|---|---|---|
| **MeLog** | 个人生活数据汇聚层与加工层 | 我的生活数据说了什么 |
| **品牌** | 所有输出的终点与放大器 | 我的输出如何影响世界 |
| **工作流** | 方向维度的可视化编排 | 目标之间如何相互支撑 |
| Today / Workbench | 今日工作台 / 个人工作台 | 我现在的整体状态如何 |

### 五维流转关系

```
方向 → 定义 → 行动（目标拆解为待办/习惯）
行动 → 输入 → 反思（完成情况进入日反思）
反思 → 校准 → 方向（复盘更新目标状态）
方向 → 驱动 → 认知（目标触发课题研究）
认知 → 沉淀 → 反思（洞察进入反思素材）
资源 → 支撑 → 全维度（人脉/健康/工具）
```

## 二、导航结构

```
Today (/)                 今日工作台（默认首页）
Workbench (/workbench)    个人工作台

▸ 方向 (/direction)
    愿景与价值观  /direction（tab: vision）
    领域与平衡    /direction（tab: domains，含平衡轮）
    目标与项目    /direction（tab: goals，含关键结果）
    工作流       /direction（tab: workflow，可视化编排画布）

▸ 行动 (/action)
    待办         /action（tab: todos，inbox/todo/doing/done 看板）
    习惯         /action（tab: habits）

▸ 认知 (/cognition)
    笔记         /cognition（tab: notes，课题笔记）
    阅读         /cognition（tab: reading）
    课题         /cognition（tab: topics）
    洞察         /cognition（tab: insights）

▸ 反思 (/reflection)
    每日反思     /reflection（tab: daily）
    周期复盘     /reflection（tab: periodic）

▸ 资源 (/resources)
    资产管理     /resources（tab: assets，订阅 / 健康 / 开发环境）
    人脉         /resources（tab: contacts）

▸ MeLog (/melog)
    时间线       /melog（tab: timeline）
    数据源       /melog（tab: sources）
    技能         /melog（tab: skills）
    标准         /melog（tab: standard）

▸ 品牌 (/brand)
    总览         /brand（tab: overview）
    品牌资产     /brand（tab: profile）
    内容流水线   /brand（tab: pipeline）
    渠道与数据   /brand（tab: channels）
    作品库       /brand（tab: works）
```

## 三、数据模型

### Direction（方向）

#### Vision（愿景）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| content | String | 愿景内容（Markdown） |
| version | Int @default(1) | 版本号 |
| isActive | Boolean @default(true) | 是否当前活跃愿景 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Domain（领域）[已有]

保持不变。

#### Goal（目标）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| domainId | String | 关联领域 |
| title | String | 目标标题 |
| description | String? | 描述 |
| status | String @default("planned") | planned / active / completed / abandoned |
| priority | String @default("medium") | high / medium / low |
| startDate | DateTime? | 开始日期 |
| endDate | DateTime? | 截止日期 |
| order | Int @default(0) | 排序 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

关联：domain, keyResults[], todos[], habits[], topics[]

#### KeyResult（关键结果）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| goalId | String | 关联目标 |
| title | String | 标题 |
| currentValue | Float @default(0) | 当前值 |
| targetValue | Float | 目标值 |
| unit | String | 单位（kg/次/本/%） |
| startDate | DateTime? | 开始日期 |
| endDate | DateTime? | 截止日期 |
| order | Int @default(0) | 排序 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### MindsetSlogan（心态格言）[已有，增强]

增加可选 `domainId` 字段，关联到具体领域。

#### BalanceWheelScore（平衡轮）[已有，增强]

可从 Goal 完成率自动推算评分。

### Action（行动）

#### Todo（待办）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| title | String | 标题 |
| description | String? | 描述 |
| status | String @default("inbox") | inbox / todo / doing / done / cancelled |
| priority | String @default("medium") | urgent / high / medium / low |
| dueDate | DateTime? | 截止日期 |
| goalId | String? | 关联目标 |
| domainId | String? | 关联领域 |
| source | String @default("manual") | manual / reflection / review |
| estimatedMinutes | Int? | 预估时长（分钟） |
| energy | String? | high / medium / low |
| order | Int @default(0) | 排序 |
| completedAt | DateTime? | 完成时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Habit（习惯）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| title | String | 习惯名称 |
| description | String? | 描述 |
| frequency | String @default("daily") | daily / weekly |
| targetPerWeek | Int? | 每周目标次数 |
| goalId | String? | 关联目标 |
| domainId | String? | 关联领域 |
| color | String? | 显示颜色 |
| isActive | Boolean @default(true) | 是否活跃 |
| order | Int @default(0) | 排序 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### HabitLog（习惯记录）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| habitId | String | 关联习惯 |
| date | DateTime | 打卡日期 |
| note | String? | 备注 |
| createdAt | DateTime | 创建时间 |

约束：@@unique([habitId, date])

### Cognition（认知）

#### Topic（课题）[已有，增强]

- 增加 `goalId` 可选字段，关联目标
- status 枚举增加 `archived` 终态

#### TopicNote（课题笔记）[已有]

保持不变。

#### InsightNote（洞察笔记）[已有，增强]

- 增加 `topicId` 可选字段，关联课题
- 实现 CRUD

#### ReadingItem（阅读清单）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| title | String | 标题 |
| author | String? | 作者 |
| type | String @default("book") | book / article / video / podcast / course |
| status | String @default("want") | want / reading / done / abandoned |
| url | String? | 链接 |
| note | String? | 笔记/摘要 |
| rating | Int? | 1-5 评分 |
| topicId | String? | 关联课题 |
| startDate | DateTime? | 开始阅读日期 |
| endDate | DateTime? | 完成阅读日期 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### Reflection（反思）

#### Reflection（每日反思）[已有，需实现]

- 记录时自动汇总当日 Todo 完成情况 + Habit 打卡状态
- `tomorrow` 字段可一键生成次日 Todo

#### PeriodicReview（周期复盘）[已有，需实现]

- 自动汇总 Goal 进度变化 + Todo 完成率 + Habit 达标率

### Resources（资源）

#### Subscription / QuotaDefinition / MonthlyUsage / QuotaUsage [已有]

保持不变。

#### Contact（人脉）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| name | String | 姓名 |
| title | String? | 职位 |
| company | String? | 公司 |
| relation | String? | friend / colleague / mentor / family / other |
| tags | String? | 标签（JSON 数组） |
| notes | String? | 备注 |
| contactFreq | String? | weekly / monthly / quarterly |
| lastContact | DateTime? | 上次联系时间 |
| domainId | String? | 关联领域 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### HealthRecord（健康记录）[新增]

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String @id | UUID |
| userId | String | 所属用户 |
| type | String | sleep / exercise / weight / mood / energy / water / custom |
| value | Float | 记录值 |
| unit | String | hours / kg / steps / ml / score |
| note | String? | 备注 |
| recordedAt | DateTime | 记录时间 |
| createdAt | DateTime | 创建时间 |

#### DevEnvironment（开发环境）[已有]

纯前端实现，保持现状。

## 四、跨维度联动

| 联动 | 说明 |
|---|---|
| 反思 → 待办 | 每日反思的"明日计划"一键生成 Todo |
| 待办 → 复盘 | 周期复盘自动汇总本周 Todo 完成情况 |
| 习惯 → 复盘 | 周期复盘自动汇总习惯达标率 |
| 目标 → 待办 | Goal 页面可快速创建关联 Todo |
| 目标 → 习惯 | Goal 页面可创建关联 Habit |
| 目标 → 课题 | Goal 页面可创建关联 Topic |
| 目标 → 复盘 | Review 自动展示 KeyResult 进度变化 |
| 课题 → 洞察 | Topic 详情页直接创建 InsightNote |
| 课题 → 阅读 | Topic 详情页添加相关阅读材料 |
| 平衡轮 → 目标 | 领域下 Goal 平均完成率作为平衡轮自动评分参考 |
| 健康记录 → 反思 | 每日反思自动带入当日睡眠/运动数据 |
| 人脉 → 提醒 | 超过 contactFreq 未联系人脉出现在 Dashboard |

## 五、Dashboard 五维交汇设计

Dashboard 应一屏纵览全局：

```
┌─────────────────────────────────────────────────┐
│  今日概览                    2026年5月10日 周日    │
├────────────────────┬────────────────────────────┤
│  方向               │  行动                      │
│  · 3 个活跃目标     │  今日待办: 2/5 已完成       │
│  · 整体进度 62%     │  ┌─────────────────────┐   │
│  [进度条]           │  │ □ 完成MeOS方案设计   │   │
│                    │  │ ■ 晨跑 30min        │   │
│                    │  │ □ 阅读《原则》ch3    │   │
│                    │  └─────────────────────┘   │
│                    │  习惯: ●●●○● 本周 4/5     │
├────────────────────┼────────────────────────────┤
│  认知               │  反思                      │
│  · 活跃课题 2 个    │  · 昨日已反思 ✓           │
│  · 新洞察 3 条      │  · 本周复盘待完成          │
│  · 阅读中: 《原则》 │  · 连续反思 7 天           │
├────────────────────┴────────────────────────────┤
│  资源                                             │
│  · 本月订阅支出 $128.50                           │
│  · 待联系人: 3 人 (超30天未联系)                    │
│  · 近7天平均睡眠 7.2h                             │
└─────────────────────────────────────────────────┘
```

## 六、技术选型

| 需求 | 选型 | 理由 |
|---|---|---|
| 图表 | recharts | 轻量、React 原生、支持响应式 |
| 日期 | date-fns | 函数式、可 tree-shake |
| 图标 | lucide-react（已有） | 统一风格 |
| 画布 | @xyflow/react | 工作流可视化编排（节点/连线/拖拽布局） |
| Markdown | react-markdown | 愿景、反思、MeLog 技能报告的渲染 |
| 本地缓存 | IndexedDB（`localDB.ts`） | 前端离线层，弱网可用 |
| 后端框架 | Fastify（已有） | 高性能 |
| ORM | Prisma（已有） | 类型安全 |
| 数据库 | SQLite（已有） | 轻量个人使用 |

## 七、实施路线

### Phase 0: 基础设施
- Prisma schema 全量更新（所有新模型）
- 导航重构为五维分组（含展开/折叠）
- 引入 recharts + date-fns
- 数据库 migration

### Phase 1: 方向
- 愿景页（单条编辑，版本历史）
- 领域页增强（展示旗下目标概要）
- 目标 CRUD + KeyResult 进度条
- 心态保持现状
- 平衡轮增强（目标完成率参考）

### Phase 2: 行动
- 待办 CRUD + 状态看板（inbox/todo/doing/done）
- 待办关联目标 + 截止日期
- 习惯 CRUD + 打卡日历视图
- 周视图（聚合 Todo dueDate + Habit 频率）

### Phase 3: 反思
- 每日反思实现（三省吾身 + 开放内容）
- 自动汇总当日 Todo/Habit 数据
- tomorrow → 一键生成 Todo
- 周期复盘实现
- 自动汇总 Goal/Todo/Habit 数据

### Phase 4: 认知
- 课题增强（archived、关联 Goal）
- 洞察笔记实现（关联 Topic）
- 阅读清单 CRUD

### Phase 5: 资源
- 订阅保持现状
- 人脉 CRUD + 联系提醒
- 健康记录 CRUD + 趋势图
- 开发环境保持现状

### Phase 6: Dashboard & 统计
- Dashboard 重构为五维交汇视图
- 统计页面（趋势、完成率、连续天数等）

> ✅ Phase 0–6 已全部落地。导航经两轮重构演进为「Today + Workbench + 7 Hub」结构（见 docs/NAVIGATION_REFACTOR*.md）。

## 八、扩展板块设计

> MeLog 的完整产品文档见 [docs/MELOG.md](./docs/MELOG.md)，开放格式规范见 [docs/melog/STANDARD.md](./docs/melog/STANDARD.md)；
> 品牌板块总览见 [docs/BRAND.md](./docs/BRAND.md)，实现设计（API/前端交互）见 [docs/superpowers/specs/2026-09-11-brand-console-design.md](./docs/superpowers/specs/2026-09-11-brand-console-design.md)。

### 8.1 工作流（方向维度）

把五维实体作为节点，在画布上编排成可视化流程图，用于审视目标之间的依赖与支撑关系。

| 模型 | 关键字段 | 说明 |
|---|---|---|
| Workflow | name / description | 一张画布 |
| WorkflowStep | entityType / entityId / label / positionX·Y / width·height | 画布节点，软引用五维实体（vision / goal / keyResult / todo / habit） |
| WorkflowConnection | sourceStepId / targetStepId / sourceHandle / targetHandle | 节点连线（自上而下） |

- API 前缀 `/api/workflows`：画布 CRUD + steps / connections 增删改
- 前端画布基于 @xyflow/react，节点位置与尺寸持久化到后端
- 步骤与实体为软引用（entityType + entityId），不设外键 —— 实体删除不影响画布结构

### 8.2 MeLog（第六板块）

| 模型 | 说明 |
|---|---|
| MeLogSource | 连接器注册表：adapter / category / status / syncCursor；endpoint 仅登记，后端不主动请求外部服务 |
| MeLogEntry | 统一事件信封：按 occurredAt 归一排列，`(sourceId, externalId)` 幂等去重 |
| MeLogSkill | 技能清单：builtin / community / custom；`config.engine` 支持 auto / rule / llm 三档 |
| MeLogRun | 运行记录：Markdown 报告 + stats（实际引擎/模型）+ entryIds 数据血缘 |
| MeLogSchedule | 定时调度：daily（HH:mm）或 interval（intervalHours），API 进程 60s 轮询、错过后补跑 |

关键机制：

- **本地优先**：数据全部写入本地 SQLite；未配置 LLM 端点（`MELOG_LLM_*`）时不外发任何数据
- **MCP Server**：`POST /api/melog/mcp`（JSON-RPC 2.0 over HTTP），工具 `melog_get_overview` / `melog_query_entries` / `melog_ingest_entries` / `melog_run_skill`
- **技能引擎三档**：`auto`（配置了 LLM 就用模型）/ `llm`（失败自动回退规则引擎）/ `rule`（纯规则，零外部依赖）
- **官方连接器**：`packages/connectors`（apple-health 导出解析、chatlog 兼容适配器），`melog-connector` CLI，零运行时依赖

### 8.3 品牌（第七板块）

定位 → 内容 → 分发 → 复盘 闭环：

| 模型 | 说明 |
|---|---|
| BrandProfile | 品牌档案（每用户单例 upsert）：mission / positioning / slogan / personaTags / toneOfVoice / targetAudience / visualNotes |
| BrandPillar | 内容支柱，挂在 BrandProfile 下，`(profileId, name)` 唯一 |
| PlatformChannel | 渠道：预置平台标识（公众号/小红书/B站/抖音等 9 + custom）+ 差异化定位 + 更新节奏 + active / paused / dormant |
| ContentItem | 流水线核心：idea → drafting → ready → published → archived；「一鱼多吃」的母内容 |
| ContentDistribution | 分发记录：`(contentId, channelId)` 唯一、重复发布时更新；记录适配标题与 views / likes / comments / shares |
| Work | 作品库：book / course / app / miniprogram / webapp 等长期工程（concept → launched） |
| MetricSnapshot | 渠道指标快照：followers 为累计值，views / likes / comments / shares / revenue 为本周期增量 |

### 8.4 扩展板块与五维的联动

| 联动 | 说明 |
|---|---|
| 工作流 ← 五维实体 | 画布节点软引用 vision / goal / keyResult / todo / habit，把方向维度串成一张图 |
| 认知 → 品牌 | ContentItem.topicId 软关联课题（Topic），课题研究直接供给内容选题 |
| MeLog ↔ AI 客户端 | 通过 MCP 工具与 Ingest API，外部 AI / 连接器可读写时间线（见标准文档） |

## 九、设计系统（Hallmark）

本节是前端的**锁定设计系统**（2026-09-12 起）。所有页面视觉改动读取本节；令牌的唯一实现位于 `apps/web/src/tokens.css`，页面一律通过 `var(--token)` 引用，禁止内联裸色值。

### 9.1 Genre 与结构

- **Genre**: modern-minimal（专业个人 dashboard）
- **应用页宏结构**: Workbench 家族 —— 功能优先、标题克制、卡片即分隔
- **导航**: N3 side-rail（左侧固定栏，信息架构不变）

### 9.2 色彩（OKLCH，anchor hue 260）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--color-paper` | `oklch(97.3% 0.004 260)` | 应用底色 |
| `--color-paper-2/3` | `oklch(95.4%/92.8% ...)` | 次级/三级底色、hover |
| `--color-surface` | `oklch(99.4% 0.002 260)` | 卡片表面 |
| `--color-ink` | `oklch(22% 0.016 260)` | 主文字（对比度 ≥ 12:1） |
| `--color-ink-2` | `oklch(44% 0.014 260)` | 次文字（≥ 7:1） |
| `--color-ink-3` | `oklch(54% 0.014 260)` | 弱文字/标签（≥ 4.5:1） |
| `--color-accent` | `oklch(48% 0.13 260)` | 静谧靛蓝：激活态/进度/焦点，面积 ≤ 5% |
| `--color-accent-soft` | `oklch(95.2% 0.022 260)` | 激活态软底 |
| `--color-success/-soft` 等 | 语义色 | 成功/警告/错误及其软底 |

规则：无纯黑/纯白；强调色是荧光笔不是色块；灰阶带 260 色相微染。

### 9.3 字体

| 角色 | 栈 | 说明 |
|---|---|---|
| Display（标题/数字） | `Space Grotesk` + `PingFang SC` → `Noto Sans SC` → `Microsoft YaHei` | 中文走系统黑体，杜绝衬线宋体回退 |
| Body | `DM Sans` + 同上 CJK 栈 | 正文 15px，行高 1.65 |
| Mono | `JetBrains Mono` | 时间/技术标签 |

- 数字一律 `font-variant-numeric: tabular-nums`（`.text-num` 工具类），统计数字禁止衬线体
- 正文最小字号 12px（`--text-xs`），11px 及以下禁用
- 中文标题 `font-weight: 600` + `letter-spacing: -0.01em`

### 9.4 间距 / 圆角 / 动效

- 4pt 间距令牌 `--space-3xs…--space-xl`
- 圆角 `--radius-sm 6 / md 10 / lg 14 / xl 20`
- 动效：motion-cut；仅 transform/opacity；`--ease-out` 为主；`prefers-reduced-motion` 降级为 ≤150ms 淡入
- 焦点环 `--color-focus`，禁止动画焦点环出现过程

### 9.5 页面共享与差异

**必须共享**：MeOS 字标、accent 及其用法、字体栈、按钮声音（主=墨底填充/次=灰底/幽灵=透明）、`.card` 卡片语言。

**允许差异**：各 hub 页内部的布局密度与分组方式；仪表盘类页面可用统计带（stat band）+ 双列列表。

### 9.6 Exports

令牌的唯一事实来源：`apps/web/src/tokens.css`（含旧变量名 `--color-text-*`/`--color-bg-*` 的兼容映射，hub 页无需改名即可继承）。
