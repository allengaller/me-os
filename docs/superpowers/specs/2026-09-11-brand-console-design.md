# 个人品牌控制台（Brand Console）设计文档

- 日期：2026-09-11
- 状态：方向已批准，待实现
- 板块定位：MeOS 第七板块「品牌」，与方向/行动/认知/反思/资源/MeLog 并列

## 1. 背景与目标

曹亚仑个人品牌是所有输出（文案、视频、出版物、App/小程序/Web App）的唯一终点。
MeOS 需要「自媒体控制台」支撑 定位 → 创作 → 分发 →复盘 的闭环。

一期四大能力（已确认）：

1. **品牌资产中枢** — 不变的定位/人设/语调/受众，让所有输出对齐
2. **内容流水线** — 选题 → 创作 → 多平台分发 → 复盘，支持「一鱼多吃」
3. **渠道矩阵与数据** — 平台账号档案 + 手动周期指标录入与趋势
4. **作品库** — 出版物/App/小程序/Web App 等长期工程

已确认的关键决策：

- 独立第七板块（方案 A），导航项「品牌」，路由 `/brand`
- 出版物与自有产品走「作品库」独立建模
- 指标手动周期录入，不接平台 API
- 与认知板块软关联（`ContentItem.topicId → Topic`），创作复盘独立于生活反思
- 品牌理念蓝本（定位/人设/语调等 BrandProfile 字段的取值来源）以 [docs/brand/DESIGN.md](../../brand/DESIGN.md) 为准，板块总览见 docs/BRAND.md

## 2. 非目标（一期不做）

- 不接公众号/抖音/YouTube 等平台数据 API（未来可在 MeLog 连接器体系扩展）
- 不做 AI 文案生成（未来可作为技能接入 MeLog skills 体系）
- 不做 Chrome 扩展离线支持（与 melog 一致，仅远程 API）
- 不做富文本编辑器，内容以字段 + 长文本存储
- 不做定时自动发布

## 3. 数据模型

在 `packages/api/src/prisma/schema.prisma` 新增「品牌 (Brand)」区段，并在 `User` 模型补充反向关系（沿用现有全量罗列风格）。

### BrandProfile — 品牌档案（每用户单例）

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String @unique | 单例约束 |
| mission | String? | 定位宣言：我为谁提供什么独特价值 |
| positioning | String? | 一句话定位 |
| slogan | String? | 口号 |
| personaTags | String? | 人设关键词，逗号分隔 |
| toneOfVoice | String? | 语调规范 |
| targetAudience | String? | 目标受众 |
| visualNotes | String? | 视觉规范备注（头像/配色/字体等） |

### BrandPillar — 内容支柱

| 字段 | 类型 | 说明 |
|---|---|---|
| userId / profileId | String | 归属；profileId 关联 BrandProfile（Cascade） |
| name | String | 如「人生管理系统」「AI 工作流」 |
| description | String? | |
| order | Int @default(0) | |

约束：`@@unique([profileId, name])`

### PlatformChannel — 平台渠道

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String | |
| platform | String | 预置标识：`wechat-mp` / `xiaohongshu` / `wechat-channels` / `douyin` / `zhihu` / `weibo` / `x` / `youtube` / `bilibili` / `custom` |
| name | String | 显示名（同名不同 platform 可共存） |
| handle | String? | 账号名/ID |
| url | String? | 主页链接 |
| positioning | String? | 该平台的差异化定位 |
| cadence | String? | 更新频率（如「每周 2 篇」） |
| status | String @default("active") | `active` / `paused` / `dormant` |
| order | Int @default(0) | |

约束：`@@unique([userId, platform, name])`

### ContentItem — 内容（流水线核心）

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String | |
| title | String | |
| type | String @default("article") | `article` / `short-video` / `long-video` / `thread` / `podcast` / `other` |
| status | String @default("idea") | `idea` / `drafting` / `ready` / `published` / `archived` |
| coreMessage | String? | 核心观点/价值主张 |
| outline | String? | 大纲/脚本要点（长文本） |
| priority | String @default("medium") | `low` / `medium` / `high` |
| publishDue | DateTime? | 计划发布日 |
| pillarId | String? | → BrandPillar，onDelete SetNull |
| topicId | String? | → Topic（软关联认知课题），onDelete SetNull |
| reviewNote | String? | 发布后复盘（什么有效/下次改进） |
| tags | String? | 逗号分隔 |
| publishedAt | DateTime? | 首次分发发布时自动填充 |
| order | Int @default(0) | |

### ContentDistribution — 分发记录（一鱼多吃）

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String | 冗余存储，便于隔离查询 |
| contentId | String | → ContentItem，Cascade |
| channelId | String | → PlatformChannel，Cascade |
| status | String @default("planned") | `planned` / `published` |
| adaptedTitle | String? | 平台适配标题 |
| url | String? | 发布链接 |
| publishedAt | DateTime? | |
| views / likes / comments / shares | Int? | 单篇数据，可选录入 |
| note | String? | |

约束：`@@unique([contentId, channelId])` —— 同内容同渠道一条记录，重复发布时更新。

### Work — 作品库

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String | |
| name | String | |
| type | String @default("book") | `book` / `course` / `app` / `miniprogram` / `webapp` / `other` |
| status | String @default("concept") | `concept` / `in_progress` / `launched` / `maintained` / `archived` |
| description | String? | |
| progress | String? | 进度说明（如「第 3 章」「v0.2 开发中」） |
| url | String? | |
| launchedAt | DateTime? | |
| order | Int @default(0) | |

### MetricSnapshot — 渠道指标快照

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | String | 冗余 |
| channelId | String | → PlatformChannel，Cascade |
| followers | Int | 当前**累计**粉丝数 |
| views / likes / comments / shares | Int? | **本周期增量**（约定：非累计） |
| revenue | Float? | 本周期收入 |
| note | String? | |
| recordedAt | DateTime @default(now()) | |

索引：`@@index([channelId, recordedAt])`。趋势 = 相邻快照 followers 差值；周期产出 = views 等增量字段加总。

## 4. API 设计

新模块 `packages/api/src/modules/brand/`：`routes.ts`（全部 `onRequest: [fastify.authenticate]`，全部按 `userId` 隔离）。复杂聚合（overview）抽到 `service.ts`。REST 前缀 `/api/brand`，在 `server.ts` 注册。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/profile` | 不存在则返回品牌蓝本默认值（前端可直接编辑保存） |
| PUT | `/profile` | upsert |
| GET / POST | `/pillars` | 列表（按 order）/ 创建 |
| PATCH / DELETE | `/pillars/:id` | 更新 / 删除 |
| GET / POST | `/channels` | 列表（按 order）/ 创建 |
| PATCH / DELETE | `/channels/:id` | 更新 / 删除（级联快照与分发记录） |
| GET | `/contents` | `?status=&type=&pillarId=&topicId=&q=` 筛选（q 对 title 做包含匹配），按 order + updatedAt 排序 |
| POST | `/contents` | 创建 |
| GET | `/contents/:id` | 详情，include distributions + pillar + topic(title) |
| PATCH / DELETE | `/contents/:id` | 更新（含状态流转）/ 删除 |
| POST | `/contents/:id/distributions` | 添加分发计划（校验 channelId 归属当前用户） |
| PATCH / DELETE | `/distributions/:id` | 更新（含发布自动化，见 §6）/ 删除 |
| GET / POST | `/works` | 列表 / 创建 |
| PATCH / DELETE | `/works/:id` | 更新 / 删除 |
| POST | `/snapshots` | `{ channelId, followers, views?, likes?, comments?, shares?, revenue?, note? }` |
| GET | `/snapshots` | `?channelId=&limit=` 按时间倒序 |
| GET | `/overview` | 总览聚合，见下 |

`GET /overview` 返回：

```jsonc
{
  "profile": { "slogan": "...", "mission": "..." },
  "pipeline": { "idea": 3, "drafting": 2, "ready": 1, "published": 12, "archived": 0 },
  "publishedThisWeek": 2,
  "publishedThisMonth": 7,
  "channels": [
    {
      "id": "...", "name": "公众号", "platform": "wechat-mp", "status": "active",
      "latest": { "followers": 1200, "views": 3400, "recordedAt": "..." },
      "followerDelta": 45,          // 与上一快照差值；仅一个快照时为 null
      "snapshotCount": 5
    }
  ],
  "trends": [ { "channelId": "...", "name": "公众号", "series": [{ "recordedAt": "...", "followers": 1200 }] } ],
  "pillars": [ { "id": "...", "name": "...", "contentCount": 4 } ]
}
```

校验遵循现有 zod 模式：非法参数 → 400 `{ error, details }`；越权/不存在 → 404；服务器错误 → 500。用 `updateMany`/`deleteMany` + `where: { id, userId }` 防越权（同 reading 模块）。

## 5. 前端设计

导航与路由：`Layout.tsx` navItems 增加品牌项（`/brand`，图标用内联 SVG path，风格同现有项）；`App.tsx` 注册 `<Route path="brand" element={<BrandHub />} />`。数据获取沿用 `lib/api.ts` 的 axios 实例（远程 only，不接 localDB 适配器）。

`pages/BrandHub.tsx`：Hub + Tab 模式（`?tab=` 同步 URL，样式同 CognitionHub），5 个 Tab：

| Tab | 文件 | 内容 |
|---|---|---|
| 总览 | `brand/Overview.tsx` | slogan 头图（无 profile 时引导去资产页）；漏斗卡片（idea/drafting/ready/published 计数）；本周/本月发布数；渠道健康卡（名称、粉丝、增量、快照数）；Recharts 折线图（近 8 个快照 followers 趋势，多渠道）；支柱覆盖列表 |
| 品牌资产 | `brand/Profile.tsx` | BrandProfile 表单（Modal/FormField 复用）；支柱 CRUD 列表 |
| 内容流水线 | `brand/Pipeline.tsx` | 按状态分组的看板列（idea/drafting/ready/published，archived 折叠展示）；卡片显示 type 图标、priority、publishDue；点击开详情 Modal：编辑字段 + 分发矩阵（列出全部渠道，每渠道一行：状态/适配标题/链接/单篇数据/发布按钮）+ reviewNote 复盘区 |
| 渠道与数据 | `brand/Channels.tsx` | 渠道卡片网格（状态徽标、handle、cadence）；预置平台一键添加（PLATFORM_PRESETS 常量，含中文名与分类：图文/视频/国际）；快照录入 Modal；单渠道趋势曲线 |
| 作品库 | `brand/Works.tsx` | 按 status 分组卡片（type 图标、progress、url、launchedAt） |

共享类型添加到 `packages/shared/src/index.ts`（BrandProfile、BrandPillar、PlatformChannel、ContentItem、ContentDistribution、Work、MetricSnapshot 及状态/类型联合），前端 `types` 引用 shared。

预置平台常量 `PLATFORM_PRESETS`（`pages/brand/constants.ts`）：wechat-mp 公众号、xiaohongshu 小红书、wechat-channels 视频号、douyin 抖音、zhihu 知乎、weibo 微博、x X、youtube YouTube、bilibili B站；均可用「自定义平台」绕过。

## 6. 自动化行为

1. **发布自动化**：PATCH 分发记录 `status=published` 且 `publishedAt` 有值（未传则取当前时间）时：
   - 所属内容 `publishedAt` 为空 → 填充分发发布时间
   - 所属内容 `status` 非 `archived` → 置为 `published`
2. **空壳 profile**：GET profile 不存在时返回品牌蓝本默认值（取值与实现见 `packages/api/src/modules/brand/constants.ts`，来源 docs/brand/DESIGN.md §0，不写库）；PUT 时 upsert，create 路径合并蓝本默认值。
3. **内容支柱预置（待确认，暂不实现）**：profile 首次保存时是否默认生成 DESIGN.md §6.1 的四根内容支柱（极致工程方法论 / 田野调查实录 / 自我调教日志 / 公开构建）。目前按「用户自建」处理，确认需求后再实现。

## 7. 错误处理

- 与现有模块一致：`z.ZodError` → 400；`updateMany/deleteMany` 影响行数为 0 → 404；其余 → 500 + `fastify.log.error`
- 外键归属校验：创建分发记录前校验 channelId 属于当前用户；pillarId/topicId 不属当前用户时忽略或 400（取 400，明确报错）

## 8. 测试策略

`packages/api/src/modules/brand/routes.test.ts`，模式仿 `modules/melog/routes.test.ts`。覆盖：

- profile：GET 返回空壳、PUT upsert 二次保存为更新
- contents：创建/筛选/更新/删除、跨用户访问 404
- 分发自动化：发布分发 → 内容 status=published 且 publishedAt 被填充；archived 内容不被改写
- snapshots + overview：两个快照的 followerDelta 计算、pipeline 计数、publishedThisWeek 边界

前端组件不强制新测试（现有页面仅 Login/EmptyState 有测试），保持仓库现状。

## 9. 交付物清单

1. `schema.prisma`：7 个新模型 + User 反向关系；`pnpm db:push` 迁移
2. `packages/api/src/modules/brand/`：routes.ts、service.ts（overview 聚合）、routes.test.ts
3. `packages/api/src/server.ts`：注册 brandRoutes
4. `packages/shared/src/index.ts`：品牌类型
5. `apps/web/src/pages/BrandHub.tsx` + `pages/brand/`（Overview/Profile/Pipeline/Channels/Works/constants）
6. `apps/web/src/components/Layout.tsx`、`App.tsx`：导航与路由
7. `docs/BRAND.md`：个人品牌运营方法论 + 板块说明（定位→内容→分发→复盘闭环，仿 MELOG.md 风格）
8. `README.md`：板块列表与 MVP 功能范围补「品牌板块」

## 10. 实施顺序（供 writing-plans 拆解）

1. Schema + 迁移 → 2. shared 类型 → 3. API 模块（profile/pillars → channels/snapshots → contents/distributions → works → overview）+ 测试 → 4. 前端 Hub 与五页 → 5. 导航/路由 → 6. 文档
