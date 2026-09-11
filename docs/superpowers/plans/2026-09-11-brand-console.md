# 个人品牌控制台（Brand Console）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 MeOS 新增第七板块「品牌」——个人品牌控制台，覆盖品牌资产、内容流水线（一鱼多吃）、渠道矩阵与指标、作品库。

**Architecture:** 仿 MeLog 先例：`packages/api/src/modules/brand/` 新模块（Fastify + zod + Prisma，远程 only），`apps/web` 新增 BrandHub + 5 个 Tab 子页，导航与路由注册，配套方法论文档。

**Tech Stack:** Fastify 4 + Prisma 5 + zod 3 + SQLite；React 18 + react-router 6 + TailwindCSS + Recharts；vitest（真库集成测试，`buildTestApp`）。

**Spec:** `docs/superpowers/specs/2026-09-11-brand-console-design.md`（执行前必读，本计划从 spec 推导）

## Global Constraints

- Node 18-20 LTS，pnpm >= 8（README 明确 Node 22 有兼容问题）
- 所有 brand 路由必须 `onRequest: [fastify.authenticate]`，所有查询按 `userId` 隔离
- 写操作用 `updateMany`/`deleteMany` + `where: { id, userId }` 防越权（同 reading 模块模式）
- zod 校验失败 → 400 `{ error: 'Invalid parameters', details }`；不存在/越权 → 404；其余 → 500 + `fastify.log.error`
- Prisma 唯一约束冲突（P2002）→ 400 `'记录已存在'`
- 不做 Chrome 扩展离线支持：前端只走 `lib/api.ts` 的 axios 实例（URL 相对 `/api` 前缀，如 `api.get('/brand/overview')`）
- 不接平台 API、不做 AI 文案生成、不做富文本编辑器、不做发布自动化
- 前端 UI 中文，复用现有 `card`/`btn btn-primary` class 与 CSS 变量主题，组件复用 Modal/FormField/EmptyState/LoadingSpinner
- 提交信息用 conventional commits（feat:/test:/docs:）
- MetricSnapshot 语义：`followers` 为当前累计值；`views/likes/comments/shares/revenue` 为本周期增量（录入者自定周期，如周更）

## 文件结构

```
packages/api/src/
├── prisma/schema.prisma              # 修改：+7 模型，User/Topic 反向关系
├── server.ts                          # 修改：注册 brandRoutes
└── modules/brand/
    ├── routes.ts                      # 创建：全部 REST 端点
    ├── service.ts                     # 创建：getBrandOverview 聚合
    └── routes.test.ts                 # 创建：集成测试（随任务逐段追加）

packages/shared/src/index.ts           # 修改：品牌类型

apps/web/src/
├── App.tsx                            # 修改：/brand 路由
├── components/Layout.tsx              # 修改：导航项「品牌」
└── pages/
    ├── BrandHub.tsx                   # 创建：Hub + 5 Tab
    └── brand/
        ├── constants.ts               # 创建：平台预置/标签字典
        ├── Overview.tsx               # 创建：总览
        ├── Profile.tsx                # 创建：品牌资产
        ├── Pipeline.tsx               # 创建：内容流水线
        ├── Channels.tsx               # 创建：渠道与数据
        └── Works.tsx                  # 创建：作品库

docs/BRAND.md                          # 创建：方法论文档
README.md                              # 修改：板块清单
```

---

### Task 1: Prisma Schema — 品牌 7 模型

**Files:**
- Modify: `packages/api/src/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma 模型 `BrandProfile`、`BrandPillar`、`PlatformChannel`、`ContentItem`、`ContentDistribution`、`Work`、`MetricSnapshot`，及 User 上的反向关系字段。后续所有任务的 `prisma.brandProfile` 等调用依赖此步的 `db:push`（会自动重新生成 client）。

- [ ] **Step 1: 在 schema.prisma 的 User 模型中追加反向关系**

在 User 模型的 `melogSchedules MeLogSchedule[]` 之后追加：

```prisma
  brandProfile       BrandProfile?
  brandPillars       BrandPillar[]
  brandChannels      PlatformChannel[]
  brandContents      ContentItem[]
  brandDistributions ContentDistribution[]
  works              Work[]
  metricSnapshots    MetricSnapshot[]
```

- [ ] **Step 2: 给 Topic 模型追加反向关系**

在 Topic 模型的 `readingItems ReadingItem[]` 之后追加：

```prisma
  brandContents ContentItem[]
```

- [ ] **Step 3: 在 schema.prisma 末尾（WorkflowConnection 之后）追加品牌区段**

```prisma
// ==================== 品牌 (Brand) ====================

// 品牌档案：每用户单例（upsert）
model BrandProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  mission        String? // 定位宣言：我为谁提供什么独特价值
  positioning    String? // 一句话定位
  slogan         String?
  personaTags    String? // 人设关键词，逗号分隔
  toneOfVoice    String? // 语调规范
  targetAudience String?
  visualNotes    String? // 视觉规范备注（头像/配色/字体等）
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  pillars BrandPillar[]
}

// 内容支柱
model BrandPillar {
  id          String   @id @default(uuid())
  userId      String
  profileId   String
  name        String
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  profile  BrandProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  contents ContentItem[]

  @@unique([profileId, name])
  @@index([userId])
}

// 平台渠道
model PlatformChannel {
  id          String   @id @default(uuid())
  userId      String
  platform    String // 预置标识：wechat-mp / xiaohongshu / wechat-channels / douyin / zhihu / weibo / x / youtube / bilibili / custom
  name        String
  handle      String? // 账号名/ID
  url         String? // 主页链接
  positioning String? // 该平台的差异化定位
  cadence     String? // 更新频率（如「每周 2 篇」）
  status      String   @default("active") // active | paused | dormant
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshots     MetricSnapshot[]
  distributions ContentDistribution[]

  @@unique([userId, platform, name])
  @@index([userId, status])
}

// 内容（流水线核心）
model ContentItem {
  id          String    @id @default(uuid())
  userId      String
  title       String
  type        String    @default("article") // article | short-video | long-video | thread | podcast | other
  status      String    @default("idea") // idea | drafting | ready | published | archived
  coreMessage String? // 核心观点/价值主张
  outline     String? // 大纲/脚本要点
  priority    String    @default("medium") // low | medium | high
  publishDue  DateTime? // 计划发布日
  pillarId    String?
  topicId     String? // 软关联认知板块课题
  reviewNote  String? // 发布后复盘
  tags        String? // 逗号分隔
  publishedAt DateTime? // 首次分发发布时自动填充
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  pillar        BrandPillar?          @relation(fields: [pillarId], references: [id], onDelete: SetNull)
  topic         Topic?                @relation(fields: [topicId], references: [id], onDelete: SetNull)
  distributions ContentDistribution[]

  @@index([userId, status])
  @@index([pillarId])
  @@index([topicId])
}

// 分发记录（一鱼多吃）：同内容同渠道一条，重复发布时更新
model ContentDistribution {
  id           String    @id @default(uuid())
  userId       String // 冗余存储，便于隔离查询
  contentId    String
  channelId    String
  status       String    @default("planned") // planned | published
  adaptedTitle String? // 平台适配标题
  url          String?
  publishedAt  DateTime?
  views        Int?
  likes        Int?
  comments     Int?
  shares       Int?
  note         String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  content ContentItem     @relation(fields: [contentId], references: [id], onDelete: Cascade)
  channel PlatformChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([contentId, channelId])
  @@index([channelId])
}

// 作品库：书 / 课程 / App / 小程序 / Web App 等长期工程
model Work {
  id          String    @id @default(uuid())
  userId      String
  name        String
  type        String    @default("book") // book | course | app | miniprogram | webapp | other
  status      String    @default("concept") // concept | in_progress | launched | maintained | archived
  description String?
  progress    String? // 进度说明（如「第 3 章」「v0.2 开发中」）
  url         String?
  launchedAt  DateTime?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}

// 渠道指标快照：followers 为累计值，views/likes/comments/shares/revenue 为本周期增量
model MetricSnapshot {
  id         String   @id @default(uuid())
  userId     String // 冗余
  channelId  String
  followers  Int
  views      Int?
  likes      Int?
  comments   Int?
  shares     Int?
  revenue    Float?
  note       String?
  recordedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel PlatformChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@index([channelId, recordedAt])
}
```

- [ ] **Step 4: 推送迁移并重新生成 client**

Run: `pnpm --filter @meos/api db:push`
Expected: `Your database is now in sync with your schema.`（db:push 默认会重新生成 Prisma client）

- [ ] **Step 5: 验证 client 已包含新模型**

Run: `grep -c "brandProfile\|metricSnapshot" packages/api/node_modules/.prisma/client/index.d.ts || grep -rc "brandProfile" node_modules/.prisma/client/index.d.ts`
Expected: 输出非零计数。若找不到文件，用 `grep -rl "BrandProfile" packages/api/node_modules/@prisma/client` 确认。

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/prisma/schema.prisma
git commit -m "feat: 品牌板块数据模型（7 模型 + User/Topic 反向关系）"
```

---

### Task 2: Shared 类型

**Files:**
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: `ContentStatus`、`ContentType`、`ChannelStatus`、`DistributionStatus`、`WorkType`、`WorkStatus` 联合类型；`BrandProfile`、`BrandPillar`、`PlatformChannel`、`ContentItem`、`ContentDistribution`、`Work`、`MetricSnapshot`、`BrandOverview` 接口。前端页面（Task 8-12）`import type { ... } from '@meos/shared'` 依赖此步 `pnpm --filter @meos/shared build` 产出的 `dist/index.d.ts`。

- [ ] **Step 1: 在 `packages/shared/src/index.ts` 的 `// ==================== API 响应类型 ====================` 注释之前插入品牌区段**

```ts
// ==================== 品牌 (Brand) ====================

export type ContentStatus = 'idea' | 'drafting' | 'ready' | 'published' | 'archived';
export type ContentType = 'article' | 'short-video' | 'long-video' | 'thread' | 'podcast' | 'other';
export type ChannelStatus = 'active' | 'paused' | 'dormant';
export type DistributionStatus = 'planned' | 'published';
export type WorkType = 'book' | 'course' | 'app' | 'miniprogram' | 'webapp' | 'other';
export type WorkStatus = 'concept' | 'in_progress' | 'launched' | 'maintained' | 'archived';

export interface BrandProfile {
  id?: string;
  userId?: string;
  mission?: string | null;
  positioning?: string | null;
  slogan?: string | null;
  personaTags?: string | null;
  toneOfVoice?: string | null;
  targetAudience?: string | null;
  visualNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandPillar {
  id: string;
  userId: string;
  profileId: string;
  name: string;
  description?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformChannel {
  id: string;
  userId: string;
  platform: string;
  name: string;
  handle?: string | null;
  url?: string | null;
  positioning?: string | null;
  cadence?: string | null;
  status: ChannelStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentDistribution {
  id: string;
  userId: string;
  contentId: string;
  channelId: string;
  status: DistributionStatus;
  adaptedTitle?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  channel?: PlatformChannel;
}

export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  coreMessage?: string | null;
  outline?: string | null;
  priority: 'low' | 'medium' | 'high';
  publishDue?: string | null;
  pillarId?: string | null;
  topicId?: string | null;
  reviewNote?: string | null;
  tags?: string | null;
  publishedAt?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  pillar?: BrandPillar | null;
  topic?: { id: string; title: string } | null;
  distributions?: ContentDistribution[];
}

export interface Work {
  id: string;
  userId: string;
  name: string;
  type: WorkType;
  status: WorkStatus;
  description?: string | null;
  progress?: string | null;
  url?: string | null;
  launchedAt?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetricSnapshot {
  id: string;
  userId: string;
  channelId: string;
  followers: number;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  revenue?: number | null;
  note?: string | null;
  recordedAt: string;
  createdAt: string;
}

export interface BrandOverview {
  profile: { slogan?: string | null; mission?: string | null } | null;
  pipeline: Record<ContentStatus, number>;
  publishedThisWeek: number;
  publishedThisMonth: number;
  channels: {
    id: string;
    name: string;
    platform: string;
    status: ChannelStatus;
    latest: { followers: number; views: number | null; recordedAt: string } | null;
    followerDelta: number | null;
    snapshotCount: number;
  }[];
  trends: { channelId: string; name: string; series: { recordedAt: string; followers: number }[] }[];
  pillars: { id: string; name: string; contentCount: number }[];
}
```

- [ ] **Step 2: 构建并验证类型**

Run: `pnpm --filter @meos/shared build && grep -c "BrandOverview" packages/shared/dist/index.d.ts`
Expected: 构建成功，输出非零计数。

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/index.ts
git commit -m "feat: shared 品牌类型定义"
```

---

### Task 3: Brand API 脚手架 — 品牌档案 + 内容支柱 + 注册

**Files:**
- Create: `packages/api/src/modules/brand/routes.ts`
- Create: `packages/api/src/modules/brand/routes.test.ts`
- Modify: `packages/api/src/server.ts`

**Interfaces:**
- Consumes: Task 1 的 Prisma 模型；Task 2 无 API 依赖
- Produces: `brandRoutes: FastifyPluginAsync`（`/api/brand` 前缀），端点 `GET/PUT /profile`、`GET/POST /pillars`、`PATCH/DELETE /pillars/:id`；模块级 `handleError(fastify, error, reply)` 与 `ensureProfile(userId)`（Task 4-7 的路由复用同一个文件和 helper）

- [ ] **Step 1: 写失败测试 — 创建 `packages/api/src/modules/brand/routes.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildTestApp } from '../../test-utils.js';
import { brandRoutes } from './routes.js';

const prisma = new PrismaClient();
const USER_ID = 'brand-test-user';

async function cleanupUserData() {
  await prisma.metricSnapshot.deleteMany({ where: { userId: USER_ID } });
  await prisma.contentDistribution.deleteMany({ where: { userId: USER_ID } });
  await prisma.contentItem.deleteMany({ where: { userId: USER_ID } });
  await prisma.platformChannel.deleteMany({ where: { userId: USER_ID } });
  await prisma.brandPillar.deleteMany({ where: { userId: USER_ID } });
  await prisma.brandProfile.deleteMany({ where: { userId: USER_ID } });
  await prisma.work.deleteMany({ where: { userId: USER_ID } });
}

async function cleanupAll() {
  await cleanupUserData();
  await prisma.user.deleteMany({ where: { id: USER_ID } });
}

describe('Brand Routes', () => {
  beforeAll(async () => {
    await cleanupAll();
    await prisma.user.create({
      data: { id: USER_ID, email: 'brand-test@example.com', password: 'hashed', name: 'Brand Test' },
    });
  });

  beforeEach(async () => {
    await cleanupUserData();
  });

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  });

  async function createApp(userId: string = USER_ID) {
    const app = await buildTestApp({ userId });
    await app.register(brandRoutes, { prefix: '/api/brand' });
    await app.ready();
    return app;
  }

  describe('品牌档案', () => {
    it('GET /profile 无记录时返回空壳', async () => {
      const app = await createApp();
      const res = await app.inject({ method: 'GET', url: '/api/brand/profile' });
      expect(res.statusCode).toBe(200);
      expect(res.json().profile.slogan).toBeNull();
      expect(res.json().profile.mission).toBeNull();
    });

    it('PUT /profile upsert：创建后再更新仍是单条', async () => {
      const app = await createApp();
      const first = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: '用系统经营人生' },
      });
      expect(first.statusCode).toBe(200);
      expect(first.json().profile.slogan).toBe('用系统经营人生');

      const second = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: '曹亚仑：人生系统构建者', mission: '帮创业者用系统经营人生' },
      });
      expect(second.json().profile.slogan).toBe('曹亚仑：人生系统构建者');

      const list = await prisma.brandProfile.findMany({ where: { userId: USER_ID } });
      expect(list).toHaveLength(1);
      expect(list[0].mission).toBe('帮创业者用系统经营人生');
    });

    it('PUT /profile 非法字段返回 400', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: 123 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('内容支柱', () => {
    it('创建、列表、删除支柱', async () => {
      const app = await createApp();
      const created = await app.inject({
        method: 'POST',
        url: '/api/brand/pillars',
        payload: { name: '人生管理系统' },
      });
      expect(created.statusCode).toBe(201);
      const id = created.json().pillar.id;

      const list = await app.inject({ method: 'GET', url: '/api/brand/pillars' });
      expect(list.json().pillars).toHaveLength(1);
      expect(list.json().pillars[0].name).toBe('人生管理系统');

      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/pillars/${id}` });
      expect(removed.json().success).toBe(true);
    });

    it('同名支柱返回 400', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/pillars', payload: { name: 'AI 工作流' } });
      const dup = await app.inject({ method: 'POST', url: '/api/brand/pillars', payload: { name: 'AI 工作流' } });
      expect(dup.statusCode).toBe(400);
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: FAIL — `Cannot find module './routes.js'`

- [ ] **Step 3: 创建 `packages/api/src/modules/brand/routes.ts`（本任务先实现 profile + pillars，结构含后续任务的 helper）**

```ts
import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const contentTypes = ['article', 'short-video', 'long-video', 'thread', 'podcast', 'other'] as const;
const contentStatuses = ['idea', 'drafting', 'ready', 'published', 'archived'] as const;
const priorities = ['low', 'medium', 'high'] as const;
const channelStatuses = ['active', 'paused', 'dormant'] as const;
const distributionStatuses = ['planned', 'published'] as const;
const workTypes = ['book', 'course', 'app', 'miniprogram', 'webapp', 'other'] as const;
const workStatuses = ['concept', 'in_progress', 'launched', 'maintained', 'archived'] as const;

const profileSchema = z.object({
  mission: z.string().max(5000).optional().nullable(),
  positioning: z.string().max(500).optional().nullable(),
  slogan: z.string().max(200).optional().nullable(),
  personaTags: z.string().max(500).optional().nullable(),
  toneOfVoice: z.string().max(2000).optional().nullable(),
  targetAudience: z.string().max(2000).optional().nullable(),
  visualNotes: z.string().max(2000).optional().nullable(),
});

const pillarCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  order: z.number().int().optional(),
});

const pillarUpdateSchema = pillarCreateSchema.partial();

async function handleError(fastify: FastifyInstance, error: unknown, reply: FastifyReply) {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return reply.code(400).send({ error: '记录已存在' });
  }
  fastify.log.error(error);
  return reply.code(500).send({ error: 'Server error' });
}

async function ensureProfile(userId: string) {
  const existing = await prisma.brandProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.brandProfile.create({ data: { userId } });
}

export const brandRoutes: FastifyPluginAsync = async (fastify) => {
  // ---------- 品牌档案 ----------
  fastify.get('/profile', { onRequest: [fastify.authenticate] }, async (request) => {
    const profile = await prisma.brandProfile.findUnique({ where: { userId: request.user.userId } });
    if (profile) return { profile };
    return {
      profile: {
        userId: request.user.userId,
        mission: null,
        positioning: null,
        slogan: null,
        personaTags: null,
        toneOfVoice: null,
        targetAudience: null,
        visualNotes: null,
      },
    };
  });

  fastify.put('/profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = profileSchema.parse(request.body);
      const profile = await prisma.brandProfile.upsert({
        where: { userId: request.user.userId },
        update: data,
        create: { ...data, userId: request.user.userId },
      });
      return { profile };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 内容支柱 ----------
  fastify.get('/pillars', { onRequest: [fastify.authenticate] }, async (request) => {
    const pillars = await prisma.brandPillar.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { pillars };
  });

  fastify.post('/pillars', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = pillarCreateSchema.parse(request.body);
      const profile = await ensureProfile(request.user.userId);
      const pillar = await prisma.brandPillar.create({
        data: { ...data, userId: request.user.userId, profileId: profile.id },
      });
      return reply.code(201).send({ pillar });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/pillars/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = pillarUpdateSchema.parse(request.body);
      const result = await prisma.brandPillar.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Pillar not found' });
      const pillar = await prisma.brandPillar.findUnique({ where: { id } });
      return { pillar };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/pillars/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.brandPillar.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Pillar not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: PASS，6 个用例全绿

- [ ] **Step 5: 在 `packages/api/src/server.ts` 注册路由**

在 `import { melogRoutes } from './modules/melog/routes.js';` 之后加：

```ts
import { brandRoutes } from './modules/brand/routes.js';
```

在 `await server.register(melogRoutes, { prefix: '/api/melog' });` 之后加：

```ts
await server.register(brandRoutes, { prefix: '/api/brand' });
```

- [ ] **Step 6: 验证整体可编译**

Run: `pnpm --filter @meos/api exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/modules/brand packages/api/src/server.ts
git commit -m "feat: 品牌 API 脚手架（品牌档案 + 内容支柱）"
```

---

### Task 4: Brand API — 渠道 + 指标快照

**Files:**
- Modify: `packages/api/src/modules/brand/routes.ts`
- Modify: `packages/api/src/modules/brand/routes.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `handleError`；Prisma 模型 `PlatformChannel`、`MetricSnapshot`
- Produces: 端点 `GET/POST /channels`、`PATCH/DELETE /channels/:id`、`POST /snapshots`、`GET /snapshots?channelId=&limit=`。Task 5 的分发矩阵与 Task 7 的 overview 依赖渠道与快照数据。

- [ ] **Step 1: 在 routes.test.ts 的 `describe('内容支柱', ...)` 块之后追加测试**

```ts
  describe('渠道与快照', () => {
    it('创建渠道并录入两个快照', async () => {
      const app = await createApp();
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'wechat-mp', name: '公众号', handle: 'caoyalun', cadence: '每周 1 篇' },
      });
      expect(channel.statusCode).toBe(201);
      const channelId = channel.json().channel.id;

      const s1 = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId, followers: 100 },
      });
      expect(s1.statusCode).toBe(201);

      const s2 = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId, followers: 150, views: 500, likes: 60, revenue: 12.5 },
      });
      expect(s2.statusCode).toBe(201);

      const list = await app.inject({
        method: 'GET',
        url: `/api/brand/snapshots?channelId=${channelId}`,
      });
      expect(list.json().snapshots).toHaveLength(2);
      expect(list.json().snapshots[0].followers).toBe(150); // 按 recordedAt 倒序
    });

    it('快照必须归属当前用户的渠道', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId: 'nonexistent', followers: 10 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('同平台同名渠道冲突返回 400', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/channels', payload: { platform: 'x', name: 'X 主号' } });
      const dup = await app.inject({ method: 'POST', url: '/api/brand/channels', payload: { platform: 'x', name: 'X 主号' } });
      expect(dup.statusCode).toBe(400);
    });

    it('更新与删除渠道', async () => {
      const app = await createApp();
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'xiaohongshu', name: '小红书' },
      });
      const id = channel.json().channel.id;
      const patched = await app.inject({
        method: 'PATCH',
        url: `/api/brand/channels/${id}`,
        payload: { status: 'paused' },
      });
      expect(patched.json().channel.status).toBe('paused');
      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/channels/${id}` });
      expect(removed.json().success).toBe(true);
    });
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: FAIL — 新用例 404（路由不存在）

- [ ] **Step 3: 在 routes.ts 的 `const workStatuses = ...` 之后追加 schema，在 pillars 路由之后追加路由**

schema（与现有常量放一起）：

```ts
const channelCreateSchema = z.object({
  platform: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  handle: z.string().max(200).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  positioning: z.string().max(2000).optional().nullable(),
  cadence: z.string().max(100).optional().nullable(),
  status: z.enum(channelStatuses).optional(),
  order: z.number().int().optional(),
});

const channelUpdateSchema = channelCreateSchema.partial();

const snapshotCreateSchema = z.object({
  channelId: z.string().min(1),
  followers: z.number().int().min(0),
  views: z.number().int().min(0).optional().nullable(),
  likes: z.number().int().min(0).optional().nullable(),
  comments: z.number().int().min(0).optional().nullable(),
  shares: z.number().int().min(0).optional().nullable(),
  revenue: z.number().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const listSnapshotsSchema = z.object({
  channelId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
```

路由（插入到 `// ---------- 内容支柱 ----------` 区段之后）：

```ts
  // ---------- 平台渠道 ----------
  fastify.get('/channels', { onRequest: [fastify.authenticate] }, async (request) => {
    const channels = await prisma.platformChannel.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { channels };
  });

  fastify.post('/channels', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = channelCreateSchema.parse(request.body);
      const channel = await prisma.platformChannel.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ channel });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/channels/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = channelUpdateSchema.parse(request.body);
      const result = await prisma.platformChannel.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Channel not found' });
      const channel = await prisma.platformChannel.findUnique({ where: { id } });
      return { channel };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/channels/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.platformChannel.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Channel not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 指标快照 ----------
  fastify.post('/snapshots', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = snapshotCreateSchema.parse(request.body);
      const channel = await prisma.platformChannel.findFirst({
        where: { id: data.channelId, userId: request.user.userId },
        select: { id: true },
      });
      if (!channel) return reply.code(400).send({ error: '渠道不存在' });
      const snapshot = await prisma.metricSnapshot.create({
        data: {
          userId: request.user.userId,
          channelId: data.channelId,
          followers: data.followers,
          views: data.views,
          likes: data.likes,
          comments: data.comments,
          shares: data.shares,
          revenue: data.revenue,
          note: data.note,
        },
      });
      return reply.code(201).send({ snapshot });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.get('/snapshots', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const query = listSnapshotsSchema.parse(request.query);
      const snapshots = await prisma.metricSnapshot.findMany({
        where: {
          userId: request.user.userId,
          ...(query.channelId ? { channelId: query.channelId } : {}),
        },
        orderBy: { recordedAt: 'desc' },
        take: query.limit ?? 30,
      });
      return { snapshots };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: PASS，全部用例绿

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/modules/brand
git commit -m "feat: 品牌 API 渠道与指标快照"
```

---

### Task 5: Brand API — 内容流水线 + 分发（一鱼多吃 + 发布自动化）

**Files:**
- Modify: `packages/api/src/modules/brand/routes.ts`
- Modify: `packages/api/src/modules/brand/routes.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `handleError`；Task 4 的渠道端点（测试里需要先建渠道）
- Produces: 端点 `GET /contents`、`POST /contents`、`GET /contents/:id`、`PATCH /contents/:id`、`DELETE /contents/:id`、`POST /contents/:id/distributions`、`PATCH /distributions/:id`、`DELETE /distributions/:id`。发布自动化：分发置 `published` 时自动将所属内容置 `published` 并补 `publishedAt`（archived 内容除外）。Task 7 overview 依赖 content 数据。

- [ ] **Step 1: 在 routes.test.ts 追加测试**

```ts
  describe('内容与分发', () => {
    async function seedChannel(app: Awaited<ReturnType<typeof createApp>>) {
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'wechat-mp', name: '公众号' },
      });
      return channel.json().channel.id as string;
    }

    it('内容 CRUD 与状态筛选', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: '五维度框架解读', status: 'drafting' } });
      const idea = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: 'MeLog 发布宣言' } });
      expect(idea.statusCode).toBe(201);
      const ideaId = idea.json().content.id;

      const drafting = await app.inject({ method: 'GET', url: '/api/brand/contents?status=drafting' });
      expect(drafting.json().contents).toHaveLength(1);
      expect(drafting.json().contents[0].title).toBe('五维度框架解读');

      const search = await app.inject({ method: 'GET', url: '/api/brand/contents?q=MeLog' });
      expect(search.json().contents).toHaveLength(1);

      const patched = await app.inject({
        method: 'PATCH',
        url: `/api/brand/contents/${ideaId}`,
        payload: { priority: 'high', coreMessage: '生活数据应该汇聚而不是散落' },
      });
      expect(patched.json().content.priority).toBe('high');

      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/contents/${ideaId}` });
      expect(removed.json().success).toBe(true);
    });

    it('pillarId 不属于当前用户时返回 400', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: 'T', pillarId: 'nonexistent' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('发布分发自动完成内容', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: '人生操作系统', status: 'ready' },
      });
      const contentId = content.json().content.id;

      const dist = await app.inject({
        method: 'POST',
        url: `/api/brand/contents/${contentId}/distributions`,
        payload: { channelId, adaptedTitle: '我为什么做 MeOS' },
      });
      expect(dist.statusCode).toBe(201);
      const distId = dist.json().distribution.id;

      const published = await app.inject({
        method: 'PATCH',
        url: `/api/brand/distributions/${distId}`,
        payload: { status: 'published', url: 'https://mp.weixin.qq.com/s/xxx', views: 1200, likes: 88 },
      });
      expect(published.json().distribution.status).toBe('published');
      expect(published.json().distribution.publishedAt).not.toBeNull();

      const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
      expect(item!.status).toBe('published');
      expect(item!.publishedAt).not.toBeNull();
    });

    it('归档内容不被发布自动化改写', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: '旧稿', status: 'archived' },
      });
      const contentId = content.json().content.id;
      const dist = await app.inject({
        method: 'POST',
        url: `/api/brand/contents/${contentId}/distributions`,
        payload: { channelId },
      });
      await app.inject({
        method: 'PATCH',
        url: `/api/brand/distributions/${dist.json().distribution.id}`,
        payload: { status: 'published' },
      });
      const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
      expect(item!.status).toBe('archived');
      expect(item!.publishedAt).toBeNull();
    });

    it('同内容同渠道重复添加返回 400', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: 'T' } });
      const contentId = content.json().content.id;
      await app.inject({ method: 'POST', url: `/api/brand/contents/${contentId}/distributions`, payload: { channelId } });
      const dup = await app.inject({ method: 'POST', url: `/api/brand/contents/${contentId}/distributions`, payload: { channelId } });
      expect(dup.statusCode).toBe(400);
    });

    it('跨用户访问返回 404', async () => {
      const app = await createApp();
      const content = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: '我的内容' } });
      const contentId = content.json().content.id;

      const otherApp = await createApp('brand-other-user');
      const res = await otherApp.inject({ method: 'GET', url: `/api/brand/contents/${contentId}` });
      expect(res.statusCode).toBe(404);
    });
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: FAIL — contents 路由 404

- [ ] **Step 3: 在 routes.ts 追加 schema**

```ts
const contentCreateSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(contentTypes).optional(),
  status: z.enum(contentStatuses).optional(),
  coreMessage: z.string().max(2000).optional().nullable(),
  outline: z.string().max(50000).optional().nullable(),
  priority: z.enum(priorities).optional(),
  publishDue: z.coerce.date().optional().nullable(),
  pillarId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  reviewNote: z.string().max(10000).optional().nullable(),
  order: z.number().int().optional(),
});

const contentUpdateSchema = contentCreateSchema.partial();

const listContentsSchema = z.object({
  status: z.enum(contentStatuses).optional(),
  type: z.enum(contentTypes).optional(),
  pillarId: z.string().optional(),
  topicId: z.string().optional(),
  q: z.string().optional(),
});

const distributionCreateSchema = z.object({
  channelId: z.string().min(1),
  adaptedTitle: z.string().max(300).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

const distributionUpdateSchema = z.object({
  status: z.enum(distributionStatuses).optional(),
  adaptedTitle: z.string().max(300).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  views: z.number().int().min(0).optional().nullable(),
  likes: z.number().int().min(0).optional().nullable(),
  comments: z.number().int().min(0).optional().nullable(),
  shares: z.number().int().min(0).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});
```

- [ ] **Step 4: 在 routes.ts 追加归属校验 helper（放 ensureProfile 之后）**

```ts
async function assertRefOwned(
  model: 'brandPillar' | 'topic',
  id: string,
  userId: string,
): Promise<boolean> {
  if (model === 'brandPillar') {
    const found = await prisma.brandPillar.findFirst({ where: { id, userId }, select: { id: true } });
    return Boolean(found);
  }
  const found = await prisma.topic.findFirst({ where: { id, userId }, select: { id: true } });
  return Boolean(found);
}
```

- [ ] **Step 5: 在 routes.ts 快照路由之后追加内容与分发路由**

```ts
  // ---------- 内容流水线 ----------
  fastify.get('/contents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const query = listContentsSchema.parse(request.query);
      const where: Prisma.ContentItemWhereInput = { userId: request.user.userId };
      if (query.status) where.status = query.status;
      if (query.type) where.type = query.type;
      if (query.pillarId) where.pillarId = query.pillarId;
      if (query.topicId) where.topicId = query.topicId;
      if (query.q) where.title = { contains: query.q };

      const contents = await prisma.contentItem.findMany({
        where,
        orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
        include: {
          pillar: true,
          topic: { select: { id: true, title: true } },
          _count: { select: { distributions: true } },
        },
      });
      return { contents };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.post('/contents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = contentCreateSchema.parse(request.body);
      if (data.pillarId && !(await assertRefOwned('brandPillar', data.pillarId, request.user.userId))) {
        return reply.code(400).send({ error: '内容支柱不存在' });
      }
      if (data.topicId && !(await assertRefOwned('topic', data.topicId, request.user.userId))) {
        return reply.code(400).send({ error: '课题不存在' });
      }
      const content = await prisma.contentItem.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ content });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.get('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const content = await prisma.contentItem.findFirst({
        where: { id, userId: request.user.userId },
        include: {
          distributions: { include: { channel: true }, orderBy: { createdAt: 'asc' } },
          pillar: true,
          topic: { select: { id: true, title: true } },
        },
      });
      if (!content) return reply.code(404).send({ error: 'Content not found' });
      return { content };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = contentUpdateSchema.parse(request.body);
      if (data.pillarId && !(await assertRefOwned('brandPillar', data.pillarId, request.user.userId))) {
        return reply.code(400).send({ error: '内容支柱不存在' });
      }
      if (data.topicId && !(await assertRefOwned('topic', data.topicId, request.user.userId))) {
        return reply.code(400).send({ error: '课题不存在' });
      }
      const result = await prisma.contentItem.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Content not found' });
      const content = await prisma.contentItem.findUnique({ where: { id } });
      return { content };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.contentItem.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Content not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 分发记录（一鱼多吃） ----------
  fastify.post('/contents/:id/distributions', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = distributionCreateSchema.parse(request.body);
      const content = await prisma.contentItem.findFirst({
        where: { id, userId: request.user.userId },
        select: { id: true },
      });
      if (!content) return reply.code(404).send({ error: 'Content not found' });
      const channel = await prisma.platformChannel.findFirst({
        where: { id: data.channelId, userId: request.user.userId },
        select: { id: true },
      });
      if (!channel) return reply.code(400).send({ error: '渠道不存在' });
      const dup = await prisma.contentDistribution.findUnique({
        where: { contentId_channelId: { contentId: id, channelId: data.channelId } },
      });
      if (dup) return reply.code(400).send({ error: '该渠道已有分发记录' });
      const distribution = await prisma.contentDistribution.create({
        data: {
          userId: request.user.userId,
          contentId: id,
          channelId: data.channelId,
          adaptedTitle: data.adaptedTitle,
          note: data.note,
        },
        include: { channel: true },
      });
      return reply.code(201).send({ distribution });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/distributions/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = distributionUpdateSchema.parse(request.body);
      const existing = await prisma.contentDistribution.findFirst({
        where: { id, userId: request.user.userId },
        include: { content: true },
      });
      if (!existing) return reply.code(404).send({ error: 'Distribution not found' });

      const updateData: Prisma.ContentDistributionUpdateInput = { ...data };
      if (data.status === 'published') {
        const publishedAt = data.publishedAt ?? existing.publishedAt ?? new Date();
        updateData.publishedAt = publishedAt;
        // 发布自动化：归档内容除外，首个渠道发布即完成内容
        if (existing.content.status !== 'archived') {
          await prisma.contentItem.update({
            where: { id: existing.contentId },
            data: {
              status: 'published',
              ...(existing.content.publishedAt ? {} : { publishedAt }),
            },
          });
        }
      }
      const distribution = await prisma.contentDistribution.update({
        where: { id },
        data: updateData,
        include: { channel: true },
      });
      return { distribution };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/distributions/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.contentDistribution.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Distribution not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
```

- [ ] **Step 6: 运行测试确认通过**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: PASS，全部用例绿（含发布自动化与跨用户 404）

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/modules/brand
git commit -m "feat: 品牌 API 内容流水线与一鱼多吃分发（含发布自动化）"
```

---

### Task 6: Brand API — 作品库

**Files:**
- Modify: `packages/api/src/modules/brand/routes.ts`
- Modify: `packages/api/src/modules/brand/routes.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `handleError`
- Produces: 端点 `GET/POST /works`、`PATCH/DELETE /works/:id`

- [ ] **Step 1: 在 routes.test.ts 追加测试**

```ts
  describe('作品库', () => {
    it('创建、更新、列表、删除作品', async () => {
      const app = await createApp();
      const created = await app.inject({
        method: 'POST',
        url: '/api/brand/works',
        payload: { name: '《人生操作系统》', type: 'book', status: 'in_progress', progress: '第 3 章' },
      });
      expect(created.statusCode).toBe(201);
      const id = created.json().work.id;

      const patched = await app.inject({
        method: 'PATCH',
        url: `/api/brand/works/${id}`,
        payload: { status: 'launched', launchedAt: new Date().toISOString(), url: 'https://example.com/book' },
      });
      expect(patched.json().work.status).toBe('launched');
      expect(patched.json().work.launchedAt).not.toBeNull();

      const list = await app.inject({ method: 'GET', url: '/api/brand/works' });
      expect(list.json().works).toHaveLength(1);

      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/works/${id}` });
      expect(removed.json().success).toBe(true);
    });
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: FAIL — works 路由 404

- [ ] **Step 3: 在 routes.ts 追加 schema 与路由**

schema：

```ts
const workCreateSchema = z.object({
  name: z.string().min(1).max(300),
  type: z.enum(workTypes).optional(),
  status: z.enum(workStatuses).optional(),
  description: z.string().max(5000).optional().nullable(),
  progress: z.string().max(2000).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  launchedAt: z.coerce.date().optional().nullable(),
  order: z.number().int().optional(),
});

const workUpdateSchema = workCreateSchema.partial();
```

路由（插入到分发路由之后）：

```ts
  // ---------- 作品库 ----------
  fastify.get('/works', { onRequest: [fastify.authenticate] }, async (request) => {
    const works = await prisma.work.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { works };
  });

  fastify.post('/works', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = workCreateSchema.parse(request.body);
      const work = await prisma.work.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ work });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/works/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = workUpdateSchema.parse(request.body);
      const result = await prisma.work.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Work not found' });
      const work = await prisma.work.findUnique({ where: { id } });
      return { work };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/works/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.work.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Work not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: PASS，全部用例绿

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/modules/brand
git commit -m "feat: 品牌 API 作品库"
```

---

### Task 7: Brand API — 总览聚合 service

**Files:**
- Create: `packages/api/src/modules/brand/service.ts`
- Modify: `packages/api/src/modules/brand/routes.ts`
- Modify: `packages/api/src/modules/brand/routes.test.ts`

**Interfaces:**
- Consumes: Prisma 模型（Task 1）
- Produces: `getBrandOverview(userId: string)`，返回 spec §4 定义的 `{ profile, pipeline, publishedThisWeek, publishedThisMonth, channels, trends, pillars }`；routes.ts 的 `GET /overview` 端点

- [ ] **Step 1: 在 routes.test.ts 追加测试**

```ts
  describe('总览', () => {
    it('聚合漏斗、发布数、渠道增量与支柱覆盖', async () => {
      const app = await createApp();
      await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: '用系统经营人生' },
      });
      const pillar = await app.inject({ method: 'POST', url: '/api/brand/pillars', payload: { name: '人生管理系统' } });
      const pillarId = pillar.json().pillar.id;

      await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: '选题 A' } });
      await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: '已发 B', status: 'published', publishedAt: new Date().toISOString(), pillarId },
      });

      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'youtube', name: 'YouTube' },
      });
      const channelId = channel.json().channel.id;
      await app.inject({ method: 'POST', url: '/api/brand/snapshots', payload: { channelId, followers: 100 } });
      await app.inject({ method: 'POST', url: '/api/brand/snapshots', payload: { channelId, followers: 150, views: 800 } });

      const res = await app.inject({ method: 'GET', url: '/api/brand/overview' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.profile.slogan).toBe('用系统经营人生');
      expect(body.pipeline.idea).toBe(1);
      expect(body.pipeline.published).toBe(1);
      expect(body.publishedThisWeek).toBe(1);
      expect(body.channels[0].latest.followers).toBe(150);
      expect(body.channels[0].followerDelta).toBe(50);
      expect(body.trends[0].series).toHaveLength(2);
      expect(body.pillars[0].contentCount).toBe(1);
    });

    it('空数据时返回零值结构', async () => {
      const app = await createApp();
      const res = await app.inject({ method: 'GET', url: '/api/brand/overview' });
      expect(res.json().pipeline).toEqual({ idea: 0, drafting: 0, ready: 0, published: 0, archived: 0 });
      expect(res.json().channels).toEqual([]);
      expect(res.json().profile).toBeNull();
    });
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: FAIL — overview 路由 404

- [ ] **Step 3: 创建 `packages/api/src/modules/brand/service.ts`**

```ts
import { prisma } from '../../lib/prisma.js';

/**
 * 品牌总览聚合：流水线漏斗、发布节奏、渠道健康（粉丝增量）与支柱覆盖。
 * 快照语义：followers 累计、views 等为周期增量，增量对比取相邻两次快照。
 */
export async function getBrandOverview(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [profile, statusGroups, publishedThisWeek, publishedThisMonth, channels, pillars] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { userId } }),
    prisma.contentItem.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.contentItem.count({ where: { userId, publishedAt: { gte: weekAgo } } }),
    prisma.contentItem.count({ where: { userId, publishedAt: { gte: monthAgo } } }),
    prisma.platformChannel.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { snapshots: { orderBy: { recordedAt: 'desc' }, take: 8 } },
    }),
    prisma.brandPillar.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { contents: true } } },
    }),
  ]);

  const pipeline: Record<string, number> = { idea: 0, drafting: 0, ready: 0, published: 0, archived: 0 };
  for (const row of statusGroups) {
    pipeline[row.status] = row._count._all;
  }

  const channelSummaries = channels.map((channel) => {
    const latest = channel.snapshots[0] ?? null;
    const previous = channel.snapshots[1] ?? null;
    return {
      id: channel.id,
      name: channel.name,
      platform: channel.platform,
      status: channel.status,
      latest: latest
        ? { followers: latest.followers, views: latest.views, recordedAt: latest.recordedAt }
        : null,
      followerDelta: latest && previous ? latest.followers - previous.followers : null,
      snapshotCount: channel.snapshots.length,
    };
  });

  const trends = channels
    .filter((c) => c.snapshots.length > 0)
    .map((c) => ({
      channelId: c.id,
      name: c.name,
      series: [...c.snapshots].reverse().map((s) => ({ recordedAt: s.recordedAt, followers: s.followers })),
    }));

  return {
    profile: profile ? { slogan: profile.slogan, mission: profile.mission } : null,
    pipeline,
    publishedThisWeek,
    publishedThisMonth,
    channels: channelSummaries,
    trends,
    pillars: pillars.map((p) => ({ id: p.id, name: p.name, contentCount: p._count.contents })),
  };
}
```

- [ ] **Step 4: 在 routes.ts 顶部加 import，并追加 overview 路由**

import 区加：

```ts
import { getBrandOverview } from './service.js';
```

路由（文件末尾、`};` 之前）：

```ts
  // ---------- 总览 ----------
  fastify.get('/overview', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const overview = await getBrandOverview(request.user.userId);
      return overview;
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
```

- [ ] **Step 5: 运行全部 brand 测试确认通过**

Run: `pnpm --filter @meos/api exec vitest run src/modules/brand/routes.test.ts`
Expected: PASS，全部用例绿

- [ ] **Step 6: 整体类型检查 + 全量后端测试**

Run: `pnpm --filter @meos/api exec tsc --noEmit && pnpm --filter @meos/api exec vitest run`
Expected: 无类型错误；brand 与既有测试（melog 等）全绿

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/modules/brand
git commit -m "feat: 品牌 API 总览聚合"
```

---

### Task 8: 前端 — constants + BrandHub + 总览页

**Files:**
- Create: `apps/web/src/pages/brand/constants.ts`
- Create: `apps/web/src/pages/BrandHub.tsx`
- Create: `apps/web/src/pages/brand/Overview.tsx`

**Interfaces:**
- Consumes: `@meos/shared` 的 `BrandOverview`、`BrandProfile` 等（Task 2）；`api.get('/brand/overview')`（Task 7）
- Produces: `BrandHub` 默认导出（Task 13 路由引用）；`PLATFORM_PRESETS`、`CONTENT_STATUS_LABELS`、`CONTENT_TYPE_LABELS`、`CONTENT_TYPE_ICONS`、`WORK_TYPE_LABELS`、`WORK_STATUS_LABELS`、`CHANNEL_STATUS_LABELS`（Task 9-12 复用）；Tab key：`overview | profile | pipeline | channels | works`

- [ ] **Step 1: 创建 `apps/web/src/pages/brand/constants.ts`**

```tsx
import { FileText, Video, MessageSquare, Mic, Sparkles, BookOpen, GraduationCap, Smartphone, Globe, AppWindow, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PlatformPreset {
  key: string;
  name: string;
  group: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  { key: 'wechat-mp', name: '公众号', group: '图文' },
  { key: 'xiaohongshu', name: '小红书', group: '图文' },
  { key: 'zhihu', name: '知乎', group: '图文' },
  { key: 'weibo', name: '微博', group: '图文' },
  { key: 'wechat-channels', name: '视频号', group: '视频' },
  { key: 'douyin', name: '抖音', group: '视频' },
  { key: 'bilibili', name: 'B站', group: '视频' },
  { key: 'x', name: 'X', group: '国际' },
  { key: 'youtube', name: 'YouTube', group: '国际' },
];

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  idea: '选题',
  drafting: '创作中',
  ready: '待发布',
  published: '已发布',
  archived: '归档',
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: '图文',
  'short-video': '短视频',
  'long-video': '长视频',
  thread: '动态/Thread',
  podcast: '播客',
  other: '其他',
};

export const CONTENT_TYPE_ICONS: Record<string, LucideIcon> = {
  article: FileText,
  'short-video': Video,
  'long-video': Video,
  thread: MessageSquare,
  podcast: Mic,
  other: Sparkles,
};

export const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };

export const CHANNEL_STATUS_LABELS: Record<string, string> = {
  active: '运营中',
  paused: '暂停',
  dormant: '休眠',
};

export const WORK_TYPE_LABELS: Record<string, string> = {
  book: '书籍',
  course: '课程',
  app: 'App',
  miniprogram: '小程序',
  webapp: 'Web App',
  other: '其他',
};

export const WORK_TYPE_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  course: GraduationCap,
  app: Smartphone,
  miniprogram: AppWindow,
  webapp: Globe,
  other: HelpCircle,
};

export const WORK_STATUS_LABELS: Record<string, string> = {
  concept: '构想',
  in_progress: '进行中',
  launched: '已发布',
  maintained: '维护中',
  archived: '归档',
};

export const WORK_STATUS_ORDER = ['concept', 'in_progress', 'launched', 'maintained', 'archived'] as const;
```

- [ ] **Step 2: 创建 `apps/web/src/pages/BrandHub.tsx`（Tab 模式与 CognitionHub 完全一致）**

```tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Gem, GitBranch, Radio, Package } from 'lucide-react';
import Overview from './brand/Overview';
import Profile from './brand/Profile';
import Pipeline from './brand/Pipeline';
import Channels from './brand/Channels';
import Works from './brand/Works';

type TabKey = 'overview' | 'profile' | 'pipeline' | 'channels' | 'works';

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'profile', label: '品牌资产', icon: Gem },
  { key: 'pipeline', label: '内容流水线', icon: GitBranch },
  { key: 'channels', label: '渠道与数据', icon: Radio },
  { key: 'works', label: '作品库', icon: Package },
];

export default function BrandHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1
          className="text-3xl mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
          }}
        >
          品牌
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          定位、创作、分发与复盘——经营你唯一的品牌：你自己
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab.key ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <Overview />}
      {activeTab === 'profile' && <Profile />}
      {activeTab === 'pipeline' && <Pipeline />}
      {activeTab === 'channels' && <Channels />}
      {activeTab === 'works' && <Works />}
    </div>
  );
}
```

- [ ] **Step 3: 创建 `apps/web/src/pages/brand/Overview.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import type { BrandOverview } from '@meos/shared';

const FUNNEL: { key: string; label: string }[] = [
  { key: 'idea', label: '选题' },
  { key: 'drafting', label: '创作中' },
  { key: 'ready', label: '待发布' },
  { key: 'published', label: '已发布' },
];

const CHANNEL_STATUS_COLORS: Record<string, string> = { active: '#10b981', paused: '#f59e0b', dormant: '#94a3b8' };
const LINE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Overview() {
  const [data, setData] = useState<BrandOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/brand/overview');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  if (!data) return <EmptyState title="加载失败" description="无法获取品牌总览，请确认后端已启动" />;

  const maxLength = Math.max(0, ...data.trends.map((t) => t.series.length));
  const chartData = Array.from({ length: maxLength }, (_, i) => {
    const row: Record<string, string | number> = { point: `#${i + 1}` };
    for (const t of data.trends) {
      if (t.series[i]) row[t.name] = t.series[i].followers;
    }
    return row;
  });

  return (
    <div className="page-enter space-y-6">
      <div className="card p-6">
        {data.profile?.slogan ? (
          <>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {data.profile.slogan}
            </h2>
            {data.profile.mission && (
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {data.profile.mission}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title="还没有品牌定位"
            description="先到「品牌资产」写下定位宣言和 slogan，让所有输出对齐"
            action={
              <Link to="/brand?tab=profile" className="btn btn-primary text-sm">
                去完善品牌资产
              </Link>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '本周发布', value: data.publishedThisWeek },
          { label: '本月发布', value: data.publishedThisMonth },
          {
            label: '选题池',
            value: (data.pipeline.idea || 0) + (data.pipeline.drafting || 0) + (data.pipeline.ready || 0),
          },
          { label: '活跃渠道', value: data.channels.filter((c) => c.status === 'active').length },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {card.label}
            </p>
            <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">内容漏斗</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FUNNEL.map((f) => (
            <div key={f.key} className="card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {f.label}
              </p>
              <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                {data.pipeline[f.key] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.channels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">渠道健康</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.channels.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${CHANNEL_STATUS_COLORS[c.status]}22`, color: CHANNEL_STATUS_COLORS[c.status] }}
                  >
                    {c.status}
                  </span>
                </div>
                {c.latest ? (
                  <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                    {c.latest.followers}
                    <span className="text-xs ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      粉丝
                    </span>
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    暂无数据，去录入快照
                  </p>
                )}
                {c.followerDelta !== null && (
                  <p className="text-xs mt-1" style={{ color: c.followerDelta >= 0 ? '#10b981' : '#ef4444' }}>
                    {c.followerDelta >= 0 ? '+' : ''}
                    {c.followerDelta} 较上次
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div>
          <h3 className="text-sm font-medium mb-3">粉丝趋势</h3>
          <div className="card p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="point" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {data.trends.map((t, i) => (
                  <Line
                    key={t.channelId}
                    type="monotone"
                    dataKey={t.name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.pillars.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">内容支柱覆盖</h3>
          <div className="flex flex-wrap gap-2">
            {data.pillars.map((p) => (
              <div key={p.id} className="card px-3 py-2 text-xs">
                {p.name} · {p.contentCount} 篇
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 类型检查**

Run: `pnpm --filter @meos/web exec tsc --noEmit`
Expected: 无错误（Pipeline/Channels/Works/Profile 尚未创建，BrandHub 引用会报错——本步允许这 4 个缺失模块报错，其余不得有错；若报错干扰，可先建 4 个占位 `export default function X() { return null; }` 并在本 Task 提交，Task 9-12 覆盖实现）

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/brand apps/web/src/pages/BrandHub.tsx
git commit -m "feat: 品牌 Hub 与总览页"
```

---

### Task 9: 前端 — 品牌资产页

**Files:**
- Create: `apps/web/src/pages/brand/Profile.tsx`

**Interfaces:**
- Consumes: `api.get/put('/brand/profile')`、`api.get/post/delete('/brand/pillars')`（Task 3-4）；`@meos/shared` 的 `BrandProfile`、`BrandPillar`；`FormField` 组件（props: `label, error?, required?, children`）
- Produces: Profile 默认导出（BrandHub 已引用）

- [ ] **Step 1: 创建 `apps/web/src/pages/brand/Profile.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import api from '../../lib/api';
import FormField from '../../components/FormField';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { BrandPillar, BrandProfile } from '@meos/shared';

const FIELDS: { key: keyof BrandProfile; label: string; textarea?: boolean; placeholder: string }[] = [
  { key: 'mission', label: '定位宣言', textarea: true, placeholder: '我为谁提供什么独特价值？' },
  { key: 'positioning', label: '一句话定位', placeholder: '如：帮创业者用系统经营人生' },
  { key: 'slogan', label: 'Slogan', placeholder: '如：用系统经营人生' },
  { key: 'personaTags', label: '人设关键词', placeholder: '逗号分隔，如：系统思维、长期主义、builder' },
  { key: 'targetAudience', label: '目标受众', textarea: true, placeholder: '他们在乎什么？在哪里？' },
  { key: 'toneOfVoice', label: '语调规范', textarea: true, placeholder: '理性、直接、有温度；避免夸大' },
  { key: 'visualNotes', label: '视觉规范', textarea: true, placeholder: '头像、配色、字体等约定' },
];

export default function Profile() {
  const [profile, setProfile] = useState<Partial<BrandProfile>>({});
  const [pillars, setPillars] = useState<BrandPillar[]>([]);
  const [newPillar, setNewPillar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, pillarsRes] = await Promise.all([
        api.get('/brand/profile'),
        api.get('/brand/pillars'),
      ]);
      setProfile(profileRes.data.profile || {});
      setPillars(pillarsRes.data.pillars || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setJustSaved(false);
    try {
      const payload = Object.fromEntries(FIELDS.map((f) => [f.key, profile[f.key] ?? null]));
      const res = await api.put('/brand/profile', payload);
      setProfile(res.data.profile);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPillar = async () => {
    const name = newPillar.trim();
    if (!name) return;
    try {
      await api.post('/brand/pillars', { name });
      setNewPillar('');
      const res = await api.get('/brand/pillars');
      setPillars(res.data.pillars || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePillar = async (id: string) => {
    try {
      await api.delete(`/brand/pillars/${id}`);
      setPillars((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl">
      <div className="card p-6 mb-6">
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <FormField key={field.key} label={field.label}>
              {field.textarea ? (
                <textarea
                  value={(profile[field.key] as string) || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="input-field"
                />
              ) : (
                <input
                  type="text"
                  value={(profile[field.key] as string) || ''}
                  onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="input-field"
                />
              )}
            </FormField>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {justSaved ? (
              <>
                <Check size={14} /> 已保存
              </>
            ) : saving ? (
              '保存中...'
            ) : (
              '保存品牌资产'
            )}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-medium mb-1">内容支柱</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
          3-5 个长期内容方向，选题时挂靠，保证输出不散
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPillar();
              }
            }}
            placeholder="如：人生管理系统"
            className="input-field flex-1"
          />
          <button onClick={handleAddPillar} disabled={!newPillar.trim()} className="btn btn-primary text-sm">
            <Plus size={14} /> 添加
          </button>
        </div>
        {pillars.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            还没有内容支柱
          </p>
        ) : (
          <div className="space-y-2">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div>
                  <span className="text-sm">{pillar.name}</span>
                  {pillar.description && (
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      {pillar.description}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePillar(pillar.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`删除支柱 ${pillar.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

注意：若项目没有 `input-field` 全局 class，先在 `apps/web/src/index.css` 检查；不存在时改用与 Notes.tsx 一致的内联样式（`className="w-full text-sm bg-transparent outline-none"` 配合样式容器）或现有表单 class。以 `grep -n "input-field" apps/web/src/index.css` 的结果为准，二选一并保持同文件内一致。

- [ ] **Step 2: 类型检查**

Run: `pnpm --filter @meos/web exec tsc --noEmit`
Expected: Profile.tsx 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brand/Profile.tsx
git commit -m "feat: 品牌资产页（档案表单 + 内容支柱）"
```

---

### Task 10: 前端 — 内容流水线页

**Files:**
- Create: `apps/web/src/pages/brand/Pipeline.tsx`

**Interfaces:**
- Consumes: Task 5 全部 contents/distributions 端点；Task 4 的 `/brand/channels`；Task 3 的 `/brand/pillars`；`/topics`（已有端点，取课题下拉）；Task 8 的 constants
- Produces: Pipeline 默认导出（BrandHub 已引用）

- [ ] **Step 1: 创建 `apps/web/src/pages/brand/Pipeline.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import EmptyState from '../../components/EmptyState';
import { CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, CONTENT_TYPE_ICONS, PRIORITY_LABELS } from './brand/constants';
import type { BrandPillar, ContentDistribution, ContentItem, PlatformChannel } from '@meos/shared';

const COLUMNS = ['idea', 'drafting', 'ready', 'published'] as const;

interface TopicOption {
  id: string;
  title: string;
}

const emptyForm = {
  title: '',
  type: 'article',
  priority: 'medium',
  pillarId: '',
  topicId: '',
  publishDue: '',
  coreMessage: '',
  outline: '',
  reviewNote: '',
};

export default function Pipeline() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [channels, setChannels] = useState<PlatformChannel[]>([]);
  const [pillars, setPillars] = useState<BrandPillar[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const [contentsRes, channelsRes, pillarsRes, topicsRes] = await Promise.all([
        api.get('/brand/contents'),
        api.get('/brand/channels'),
        api.get('/brand/pillars'),
        api.get('/topics'),
      ]);
      setContents(contentsRes.data.contents || []);
      setChannels(channelsRes.data.channels || []);
      setPillars(pillarsRes.data.pillars || []);
      setTopics(topicsRes.data.topics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (content: ContentItem) => {
    try {
      const res = await api.get(`/brand/contents/${content.id}`);
      const full: ContentItem = res.data.content;
      setEditing(full);
      setForm({
        title: full.title,
        type: full.type,
        priority: full.priority,
        pillarId: full.pillarId || '',
        topicId: full.topicId || '',
        publishDue: full.publishDue ? full.publishDue.slice(0, 10) : '',
        coreMessage: full.coreMessage || '',
        outline: full.outline || '',
        reviewNote: full.reviewNote || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAdd = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    try {
      await api.post('/brand/contents', { title });
      setQuickTitle('');
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await api.patch(`/brand/contents/${editing.id}`, {
        title: form.title,
        type: form.type,
        priority: form.priority,
        pillarId: form.pillarId || null,
        topicId: form.topicId || null,
        publishDue: form.publishDue || null,
        coreMessage: form.coreMessage || null,
        outline: form.outline || null,
        reviewNote: form.reviewNote || null,
      });
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await api.delete(`/brand/contents/${editing.id}`);
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (content: ContentItem, status: string) => {
    try {
      await api.patch(`/brand/contents/${content.id}`, { status });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDistribution = async (contentId: string, channelId: string) => {
    try {
      await api.post(`/brand/contents/${contentId}/distributions`, { channelId });
      await openDetail({ ...editing!, id: contentId } as ContentItem);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatchDistribution = async (dist: ContentDistribution, payload: Record<string, unknown>) => {
    try {
      await api.patch(`/brand/distributions/${dist.id}`, payload);
      if (editing) await openDetail(editing);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDistribution = async (distId: string) => {
    try {
      await api.delete(`/brand/distributions/${distId}`);
      if (editing) await openDetail(editing);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="card p-4 mb-6 flex gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          placeholder="记一个选题，回车入池..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button onClick={handleQuickAdd} disabled={!quickTitle.trim()} className="btn btn-primary text-sm">
          <Plus size={14} /> 入池
        </button>
      </div>

      {contents.length === 0 ? (
        <EmptyState icon={<Plus size={28} />} title="选题池是空的" description="上面输入框记下第一个选题" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((status) => {
            const items = contents.filter((c) => c.status === status);
            const archived = contents.filter((c) => c.status === 'archived').length;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {CONTENT_STATUS_LABELS[status]} · {items.length}
                  </span>
                  {status === 'published' && archived > 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      归档 {archived}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((content) => {
                    const Icon = CONTENT_TYPE_ICONS[content.type] || CONTENT_TYPE_ICONS.other;
                    return (
                      <button
                        key={content.id}
                        onClick={() => openDetail(content)}
                        className="card p-3 w-full text-left hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{CONTENT_TYPE_LABELS[content.type]}</span>
                          {content.priority === 'high' && (
                            <span className="text-xs px-1.5 rounded bg-red-50 text-red-600">{PRIORITY_LABELS.high}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {content.title}
                        </p>
                        {content.publishDue && (
                          <p className="text-xs mt-1 text-amber-600">计划 {content.publishDue.slice(0, 10)}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          {content.distributions?.length ?? 0} 个渠道
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="内容详情" maxWidth="max-w-2xl">
        {editing && (
          <div className="space-y-4">
            <FormField label="标题" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="类型">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="input-field"
                >
                  {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="优先级">
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="input-field"
                >
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="内容支柱">
                <select
                  value={form.pillarId}
                  onChange={(e) => setForm((f) => ({ ...f, pillarId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">未挂靠</option>
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="关联课题（认知板块）">
                <select
                  value={form.topicId}
                  onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">不关联</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="计划发布日">
                <input
                  type="date"
                  value={form.publishDue}
                  onChange={(e) => setForm((f) => ({ ...f, publishDue: e.target.value }))}
                  className="input-field"
                />
              </FormField>
              <FormField label="当前状态">
                <select
                  value={editing.status}
                  onChange={(e) => handleStatus(editing, e.target.value)}
                  className="input-field"
                >
                  {Object.entries(CONTENT_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="核心观点">
              <input
                type="text"
                value={form.coreMessage}
                onChange={(e) => setForm((f) => ({ ...f, coreMessage: e.target.value }))}
                placeholder="这条内容要让读者记住的一句话"
                className="input-field"
              />
            </FormField>
            <FormField label="大纲 / 脚本要点">
              <textarea
                value={form.outline}
                onChange={(e) => setForm((f) => ({ ...f, outline: e.target.value }))}
                rows={5}
                className="input-field"
              />
            </FormField>
            <FormField label="发布复盘（什么有效 / 下次改进）">
              <textarea
                value={form.reviewNote}
                onChange={(e) => setForm((f) => ({ ...f, reviewNote: e.target.value }))}
                rows={3}
                className="input-field"
              />
            </FormField>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">分发矩阵（一鱼多吃）</p>
              <div className="space-y-2">
                {channels.map((channel) => {
                  const dist = editing.distributions?.find((d) => d.channelId === channel.id);
                  return (
                    <div key={channel.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{channel.name}</span>
                        {dist ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: dist.status === 'published' ? '#10b981' : 'var(--color-text-tertiary)' }}>
                              {dist.status === 'published' ? '已发布' : '计划中'}
                            </span>
                            {dist.status !== 'published' && (
                              <button
                                onClick={() => handlePatchDistribution(dist, { status: 'published' })}
                                className="btn btn-primary text-xs px-2 py-1"
                              >
                                标记发布
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDistribution(dist.id)}
                              className="text-slate-400 hover:text-red-500"
                              aria-label="删除分发记录"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddDistribution(editing.id, channel.id)}
                            className="btn text-xs px-2 py-1"
                            style={{ border: '1px solid var(--color-border, #e2e8f0)' }}
                          >
                            <Plus size={12} /> 加入分发
                          </button>
                        )}
                      </div>
                      {dist && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            defaultValue={dist.adaptedTitle || ''}
                            placeholder="平台适配标题"
                            className="text-xs px-2 py-1 rounded border bg-white"
                            onBlur={(e) => {
                              if (e.target.value !== (dist.adaptedTitle || '')) {
                                handlePatchDistribution(dist, { adaptedTitle: e.target.value || null });
                              }
                            }}
                          />
                          <input
                            type="text"
                            defaultValue={dist.url || ''}
                            placeholder="发布链接"
                            className="text-xs px-2 py-1 rounded border bg-white"
                            onBlur={(e) => {
                              if (e.target.value !== (dist.url || '')) {
                                handlePatchDistribution(dist, { url: e.target.value || null });
                              }
                            }}
                          />
                          <input
                            type="number"
                            defaultValue={dist.views ?? ''}
                            placeholder="阅读/播放"
                            className="text-xs px-2 py-1 rounded border bg-white"
                            onBlur={(e) => {
                              const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              if (v !== dist.views) handlePatchDistribution(dist, { views: v });
                            }}
                          />
                          <input
                            type="number"
                            defaultValue={dist.likes ?? ''}
                            placeholder="点赞"
                            className="text-xs px-2 py-1 rounded border bg-white"
                            onBlur={(e) => {
                              const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              if (v !== dist.likes) handlePatchDistribution(dist, { likes: v });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {channels.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    还没有渠道，先到「渠道与数据」添加平台账号
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-600">
                删除内容
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="btn text-sm">
                  取消
                </button>
                <button onClick={handleSave} className="btn btn-primary text-sm">
                  <ExternalLink size={14} /> 保存
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm --filter @meos/web exec tsc --noEmit`
Expected: Pipeline.tsx 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brand/Pipeline.tsx
git commit -m "feat: 内容流水线页（看板 + 分发矩阵 + 复盘）"
```

---

### Task 11: 前端 — 渠道与数据页

**Files:**
- Create: `apps/web/src/pages/brand/Channels.tsx`

**Interfaces:**
- Consumes: Task 4 的 `/brand/channels`、`/brand/snapshots`；Task 8 的 `PLATFORM_PRESETS`、`CHANNEL_STATUS_LABELS`；`Modal`、`EmptyState`；Recharts
- Produces: Channels 默认导出（BrandHub 已引用）

- [ ] **Step 1: 创建 `apps/web/src/pages/brand/Channels.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import EmptyState from '../../components/EmptyState';
import { CHANNEL_STATUS_LABELS, PLATFORM_PRESETS } from './constants';
import type { MetricSnapshot, PlatformChannel } from '@meos/shared';

const emptyChannelForm = { platform: 'custom', name: '', handle: '', cadence: '', positioning: '' };
const emptySnapshotForm = { followers: '', views: '', likes: '', comments: '', shares: '', revenue: '', note: '' };

export default function Channels() {
  const [channels, setChannels] = useState<PlatformChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [channelForm, setChannelForm] = useState(emptyChannelForm);
  const [snapshotFor, setSnapshotFor] = useState<PlatformChannel | null>(null);
  const [snapshotForm, setSnapshotForm] = useState(emptySnapshotForm);
  const [trendFor, setTrendFor] = useState<PlatformChannel | null>(null);
  const [trendSnapshots, setTrendSnapshots] = useState<MetricSnapshot[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/brand/channels');
      setChannels(res.data.channels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddChannel = async () => {
    if (!channelForm.name.trim()) return;
    try {
      await api.post('/brand/channels', {
        platform: channelForm.platform,
        name: channelForm.name.trim(),
        handle: channelForm.handle || null,
        cadence: channelForm.cadence || null,
        positioning: channelForm.positioning || null,
      });
      setAdding(false);
      setChannelForm(emptyChannelForm);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const openSnapshot = (channel: PlatformChannel) => {
    setSnapshotFor(channel);
    setSnapshotForm(emptySnapshotForm);
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotFor || snapshotForm.followers === '') return;
    try {
      await api.post('/brand/snapshots', {
        channelId: snapshotFor.id,
        followers: parseInt(snapshotForm.followers, 10),
        views: snapshotForm.views === '' ? null : parseInt(snapshotForm.views, 10),
        likes: snapshotForm.likes === '' ? null : parseInt(snapshotForm.likes, 10),
        comments: snapshotForm.comments === '' ? null : parseInt(snapshotForm.comments, 10),
        shares: snapshotForm.shares === '' ? null : parseInt(snapshotForm.shares, 10),
        revenue: snapshotForm.revenue === '' ? null : parseFloat(snapshotForm.revenue),
        note: snapshotForm.note || null,
      });
      setSnapshotFor(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const openTrend = async (channel: PlatformChannel) => {
    try {
      const res = await api.get(`/brand/snapshots?channelId=${channel.id}&limit=30`);
      setTrendSnapshots(res.data.snapshots || []);
      setTrendFor(channel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await api.delete(`/brand/channels/${id}`);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (channel: PlatformChannel) => {
    try {
      const next = channel.status === 'active' ? 'paused' : 'active';
      await api.patch(`/brand/channels/${channel.id}`, { status: next });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    );
  }

  const trendData = [...trendSnapshots].reverse().map((s) => ({
    date: new Date(s.recordedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    followers: s.followers,
  }));

  return (
    <div className="page-enter">
      <div className="flex justify-end mb-4">
        <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
          <Plus size={14} /> 添加渠道
        </button>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          title="还没有平台渠道"
          description="添加公众号、小红书、X、YouTube 等账号，开始追踪"
          action={
            <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
              添加渠道
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {channel.name}
                  </p>
                  {channel.handle && (
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      @{channel.handle}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      channel.status === 'active' ? '#d1fae5' : channel.status === 'paused' ? '#fef3c7' : '#f1f5f9',
                    color: channel.status === 'active' ? '#065f46' : channel.status === 'paused' ? '#92400e' : '#64748b',
                  }}
                >
                  {CHANNEL_STATUS_LABELS[channel.status]}
                </span>
              </div>
              {channel.cadence && (
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  节奏：{channel.cadence}
                </p>
              )}
              {channel.positioning && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {channel.positioning}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => openSnapshot(channel)} className="btn btn-primary text-xs px-2 py-1">
                  <Plus size={12} /> 录入快照
                </button>
                <button onClick={() => openTrend(channel)} className="btn text-xs px-2 py-1">
                  <LineChartIcon size={12} /> 趋势
                </button>
                <button onClick={() => toggleStatus(channel)} className="btn text-xs px-2 py-1">
                  {channel.status === 'active' ? '暂停' : '恢复'}
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="text-slate-400 hover:text-red-500 ml-auto"
                  aria-label={`删除渠道 ${channel.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="添加渠道">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">选择平台</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setChannelForm((f) => ({ ...f, platform: preset.key, name: preset.name }))}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: channelForm.platform === preset.key ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
                    color: channelForm.platform === preset.key ? '#fff' : 'var(--color-text-primary)',
                  }}
                >
                  {preset.name}
                </button>
              ))}
              <button
                onClick={() => setChannelForm((f) => ({ ...f, platform: 'custom', name: '' }))}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: channelForm.platform === 'custom' ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
                  color: channelForm.platform === 'custom' ? '#fff' : 'var(--color-text-primary)',
                }}
              >
                自定义
              </button>
            </div>
          </div>
          <FormField label="显示名" required>
            <input
              type="text"
              value={channelForm.name}
              onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="如：公众号主号"
              className="input-field"
            />
          </FormField>
          <FormField label="账号 / Handle">
            <input
              type="text"
              value={channelForm.handle}
              onChange={(e) => setChannelForm((f) => ({ ...f, handle: e.target.value }))}
              className="input-field"
            />
          </FormField>
          <FormField label="更新节奏">
            <input
              type="text"
              value={channelForm.cadence}
              onChange={(e) => setChannelForm((f) => ({ ...f, cadence: e.target.value }))}
              placeholder="如：每周 2 篇"
              className="input-field"
            />
          </FormField>
          <FormField label="平台差异化定位">
            <textarea
              value={channelForm.positioning}
              onChange={(e) => setChannelForm((f) => ({ ...f, positioning: e.target.value }))}
              rows={2}
              placeholder="这个平台主打什么内容、什么人群"
              className="input-field"
            />
          </FormField>
          <div className="flex justify-end">
            <button onClick={handleAddChannel} disabled={!channelForm.name.trim()} className="btn btn-primary text-sm">
              添加
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!snapshotFor} onClose={() => setSnapshotFor(null)} title={`录入快照 · ${snapshotFor?.name || ''}`}>
        <div className="space-y-3">
          <FormField label="粉丝数（当前累计）" required>
            <input
              type="number"
              value={snapshotForm.followers}
              onChange={(e) => setSnapshotForm((f) => ({ ...f, followers: e.target.value }))}
              className="input-field"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="阅读/播放（本周期）">
              <input
                type="number"
                value={snapshotForm.views}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, views: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <FormField label="点赞（本周期）">
              <input
                type="number"
                value={snapshotForm.likes}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, likes: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <FormField label="评论（本周期）">
              <input
                type="number"
                value={snapshotForm.comments}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, comments: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <FormField label="转发/分享（本周期）">
              <input
                type="number"
                value={snapshotForm.shares}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, shares: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <FormField label="收入（本周期）">
              <input
                type="number"
                value={snapshotForm.revenue}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, revenue: e.target.value }))}
                className="input-field"
              />
            </FormField>
            <FormField label="备注">
              <input
                type="text"
                value={snapshotForm.note}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, note: e.target.value }))}
                className="input-field"
              />
            </FormField>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            增量字段填「自上次快照以来」的数值；建议固定周期（如每周日）录入。
          </p>
          <div className="flex justify-end">
            <button onClick={handleSaveSnapshot} disabled={snapshotForm.followers === ''} className="btn btn-primary text-sm">
              保存快照
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!trendFor} onClose={() => setTrendFor(null)} title={`粉丝趋势 · ${trendFor?.name || ''}`}>
        {trendData.length < 2 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            至少需要两次快照才能看趋势
          </p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm --filter @meos/web exec tsc --noEmit`
Expected: Channels.tsx 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brand/Channels.tsx
git commit -m "feat: 渠道与数据页（平台矩阵 + 快照 + 趋势）"
```

---

### Task 12: 前端 — 作品库页

**Files:**
- Create: `apps/web/src/pages/brand/Works.tsx`

**Interfaces:**
- Consumes: Task 6 的 `/brand/works` 端点；Task 8 的 `WORK_TYPE_LABELS`、`WORK_TYPE_ICONS`、`WORK_STATUS_LABELS`、`WORK_STATUS_ORDER`；`Modal`、`FormField`、`EmptyState`
- Produces: Works 默认导出（BrandHub 已引用）

- [ ] **Step 1: 创建 `apps/web/src/pages/brand/Works.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import EmptyState from '../../components/EmptyState';
import { WORK_TYPE_LABELS, WORK_TYPE_ICONS, WORK_STATUS_LABELS, WORK_STATUS_ORDER } from './constants';
import type { Work } from '@meos/shared';

const emptyForm = {
  name: '',
  type: 'book',
  status: 'concept',
  description: '',
  progress: '',
  url: '',
  launchedAt: '',
};

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Work | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/brand/works');
      setWorks(res.data.works || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (work: Work) => {
    setEditing(work);
    setForm({
      name: work.name,
      type: work.type,
      status: work.status,
      description: work.description || '',
      progress: work.progress || '',
      url: work.url || '',
      launchedAt: work.launchedAt ? work.launchedAt.slice(0, 10) : '',
    });
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await api.post('/brand/works', {
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        description: form.description || null,
        progress: form.progress || null,
        url: form.url || null,
      });
      setCreating(false);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await api.patch(`/brand/works/${editing.id}`, {
        name: form.name,
        type: form.type,
        status: form.status,
        description: form.description || null,
        progress: form.progress || null,
        url: form.url || null,
        launchedAt: form.launchedAt || null,
      });
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await api.delete(`/brand/works/${editing.id}`);
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    );
  }

  const renderForm = (isCreate: boolean) => (
    <div className="space-y-4">
      <FormField label="作品名" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="如：《人生操作系统》 / MeOS App"
          className="input-field"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="类型">
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field">
            {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="状态">
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input-field">
            {Object.entries(WORK_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="进度说明">
          <input
            type="text"
            value={form.progress}
            onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
            placeholder="如：第 3 章 / v0.2 开发中"
            className="input-field"
          />
        </FormField>
        <FormField label="发布日期">
          <input
            type="date"
            value={form.launchedAt}
            onChange={(e) => setForm((f) => ({ ...f, launchedAt: e.target.value }))}
            className="input-field"
          />
        </FormField>
      </div>
      <FormField label="链接">
        <input
          type="text"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="https://"
          className="input-field"
        />
      </FormField>
      <FormField label="描述">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="input-field"
        />
      </FormField>
      <div className="flex justify-between">
        {!isCreate && (
          <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-600">
            删除作品
          </button>
        )}
        <button onClick={isCreate ? handleCreate : handleSave} disabled={!form.name.trim()} className="btn btn-primary text-sm ml-auto">
          {isCreate ? '创建作品' : '保存'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-enter">
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="btn btn-primary text-sm">
          <Plus size={14} /> 新作品
        </button>
      </div>

      {works.length === 0 ? (
        <EmptyState
          title="作品库是空的"
          description="书、课程、App、小程序——它们都是品牌的长线资产"
          action={
            <button onClick={openCreate} className="btn btn-primary text-sm">
              添加第一个作品
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {WORK_STATUS_ORDER.map((status) => {
            const items = works.filter((w) => w.status === status);
            if (items.length === 0) return null;
            return (
              <div key={status}>
                <h3 className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {WORK_STATUS_LABELS[status]} · {items.length}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((work) => {
                    const Icon = WORK_TYPE_ICONS[work.type] || WORK_TYPE_ICONS.other;
                    return (
                      <button key={work.id} onClick={() => openEdit(work)} className="card p-4 text-left hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={15} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{WORK_TYPE_LABELS[work.type]}</span>
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {work.name}
                        </p>
                        {work.progress && (
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {work.progress}
                          </p>
                        )}
                        {work.url && (
                          <p className="text-xs mt-1 text-indigo-500 flex items-center gap-1">
                            <ExternalLink size={11} /> 链接
                          </p>
                        )}
                        {work.launchedAt && (
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            发布于 {work.launchedAt.slice(0, 10)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="新作品">
        {renderForm(true)}
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="作品详情">
        {renderForm(false)}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm --filter @meos/web exec tsc --noEmit`
Expected: 无错误（所有品牌页面已齐）

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brand/Works.tsx
git commit -m "feat: 作品库页"
```

---

### Task 13: 导航与路由接线 + 全量构建

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Consumes: Task 8 的 `BrandHub` 默认导出
- Produces: 侧边导航出现「品牌」项；`/brand` 路由可访问

- [ ] **Step 1: 在 Layout.tsx 的 navItems 中，MeLog 项之后追加品牌项**

```ts
  {
    label: '品牌',
    path: '/brand',
    icon: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
```

- [ ] **Step 2: 在 App.tsx 注册路由**

在 `import { MeLogHub } ...`（MeLogHub 的 import 行）之后加：

```ts
import BrandHub from './pages/BrandHub';
```

在 `<Route path="melog" element={<MeLogHub />} />` 之后加：

```tsx
          <Route path="brand" element={<BrandHub />} />
```

- [ ] **Step 3: 全量类型检查与构建**

Run: `pnpm --filter @meos/web build`
Expected: tsc 无错误，vite build 成功

- [ ] **Step 4: 手动冒烟验证（启动前后端）**

Run: 根目录 `pnpm dev`，浏览器打开 `http://localhost:5173`，注册/登录后：
1. 侧边栏出现「品牌」，进入 `/brand` 显示总览空态
2. 「品牌资产」填 slogan 保存后回到总览，slogan 头图出现
3. 「渠道与数据」添加公众号渠道、录入两次快照，趋势图出现两点
4. 「内容流水线」快速入池一个选题 → 打开详情 → 加入分发 → 标记发布 → 内容进入「已发布」列，总览本周发布 +1
5. 「作品库」添加一个作品并编辑状态

Expected: 全部可用；浏览器控制台无红色错误

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/Layout.tsx apps/web/src/App.tsx
git commit -m "feat: 品牌板块导航与路由接线"
```

---

### Task 14: 文档 — BRAND.md + README

**Files:**
- Create: `docs/BRAND.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: 已实现的功能面（Task 1-13）
- Produces: 方法论文档与 README 更新

- [ ] **Step 1: 创建 `docs/BRAND.md`**

```markdown
# 品牌 — 个人品牌控制台板块

> 所有输出只有一个终点：曹亚仑这个品牌。文案、视频、出版物、App、小程序、Web App，
> 都是同一个品牌的表达。品牌板块把 定位 → 创作 → 分发 → 复盘 的闭环装进 MeOS。

## 定位

- **不是又一个新媒体日历工具**，而是「个人品牌操作系统」的内容与资产中枢。
- 品牌板块是 MeOS 的第七个板块（方向 / 行动 / 认知 / 反思 / 资源 / MeLog / **品牌**）。
- 与认知板块软关联：认知是向内输入，品牌是向外输出；选题可挂靠课题（Topic），
  让沉淀的思考成为内容的源泉。

## 闭环模型

```
定位（品牌资产） → 选题（流水线入池） → 创作（大纲/核心观点）
      ↑                                        ↓
复盘（reviewNote + 数据） ← 分发（一鱼多吃，多平台） ← 发布
```

## 五个子页

### 总览
品牌 slogan 头图、内容漏斗（选题/创作中/待发布/已发布）、本周与本月发布数、
渠道健康卡（粉丝数与增量）、粉丝趋势折线图、支柱覆盖。

### 品牌资产
不变的东西：定位宣言、一句话定位、slogan、人设关键词、目标受众、语调规范、视觉规范。
内容支柱（Content Pillars）：3-5 个长期方向，所有选题挂靠支柱，保证输出不散。

### 内容流水线
状态机：`选题 → 创作中 → 待发布 → 已发布`（可归档）。
一鱼多吃：一个内容对多个渠道各有一条分发记录（适配标题、发布链接、单篇数据）。
发布自动化：任一渠道标记发布，内容即完成（归档内容除外）。
发布后填写复盘（什么有效 / 下次改进）。

### 渠道与数据
平台矩阵：公众号、小红书、视频号、抖音、知乎、微博、X、YouTube、B站 + 自定义。
每个渠道记录账号、更新节奏与差异化定位（active / paused / dormant）。
指标快照：手动周期录入（建议每周固定时间），`followers` 记累计，
`views/likes/comments/shares/revenue` 记本周期增量；趋势由相邻快照差值计算。

### 作品库
书、课程、App、小程序、Web App 都是品牌的长线资产。
状态机：`构想 → 进行中 → 已发布 → 维护中`（可归档），记录进度与链接。

## API 一览

REST 前缀：`/api/brand`（全部需认证）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET / PUT | `/profile` | 品牌档案（空壳返回 / upsert） |
| GET / POST | `/pillars` | 内容支柱列表 / 创建 |
| PATCH / DELETE | `/pillars/:id` | 更新 / 删除支柱 |
| GET / POST | `/channels` | 渠道列表 / 创建 |
| PATCH / DELETE | `/channels/:id` | 更新 / 删除渠道 |
| GET / POST | `/contents` | 内容列表（status/type/pillarId/topicId/q）/ 创建 |
| GET / PATCH / DELETE | `/contents/:id` | 内容详情（含分发）/ 更新 / 删除 |
| POST | `/contents/:id/distributions` | 添加分发记录 |
| PATCH / DELETE | `/distributions/:id` | 更新（含发布自动化）/ 删除 |
| GET / POST | `/works` | 作品列表 / 创建 |
| PATCH / DELETE | `/works/:id` | 更新 / 删除作品 |
| POST | `/snapshots` | 录入指标快照 |
| GET | `/snapshots` | `?channelId=&limit=` 快照查询 |
| GET | `/overview` | 总览聚合 |

## 运营最佳实践（内置于产品设计）

1. **定位先行**：先写完品牌资产再开选题，避免内容漂移
2. **支柱约束**：选题必须挂支柱；不在支柱内的想法先放选题池不展开
3. **一鱼多吃**：长内容（图文/长视频）先做，再拆短视频、动态、Thread
4. **固定复盘节拍**：每周录一次渠道快照；每篇发布后 48 小时内填 reviewNote
5. **看增量不看绝对值**：趋势图与 followerDelta 比 follower 总数更有行动价值
```

- [ ] **Step 2: 更新 `README.md`**

在 `## MVP 功能范围（阶段一）` 中 MeLog 板块条目之后追加一行：

```markdown
- ✅ **品牌板块** — 个人品牌控制台：品牌资产中枢、内容流水线（一鱼多吃多平台分发）、渠道矩阵与指标追踪、作品库（出版物/App/小程序/Web App），详见 [docs/BRAND.md](./docs/BRAND.md)
```

- [ ] **Step 3: Commit**

```bash
git add docs/BRAND.md README.md
git commit -m "docs: 品牌板块方法论文档与 README 更新"
```

---

## Self-Review 记录

- **Spec 覆盖**：spec §3 七模型 → Task 1；§4 全部端点 → Task 3-7；§5 五 Tab + 导航 → Task 8-13；§6 自动化与空壳 profile → Task 3/5；§7 错误处理 → 全局约束 + handleError；§8 测试 → Task 3-7；§9 交付物含 docs → Task 14。无缺口。
- **占位符扫描**：所有步骤含真实代码；Task 9 的 `input-field` class 提供了明确的核实与替代方案（grep + 内联样式），非占位符。
- **类型一致性**：`getBrandOverview` 在 Task 7 定义并被同任务路由引用；`handleError`/`ensureProfile` 在 Task 3 定义、后续任务复用；前端 constants 的导出名与 Task 9-12 的 import 一一核对（`PLATFORM_PRESETS`、`CONTENT_STATUS_LABELS`、`CONTENT_TYPE_LABELS`、`CONTENT_TYPE_ICONS`、`PRIORITY_LABELS`、`CHANNEL_STATUS_LABELS`、`WORK_TYPE_LABELS`、`WORK_TYPE_ICONS`、`WORK_STATUS_LABELS`、`WORK_STATUS_ORDER`）。
