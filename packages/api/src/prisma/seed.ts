/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BRAND_MOCK_USER_ID, ensureBrandMockUser, seedBrandMockData } from './seed-brand.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@meos.app' },
    update: {},
    create: {
      email: 'demo@meos.app',
      password: hashedPassword,
      name: 'Demo User',
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create default domains
  const defaultDomains = [
    { identifier: 'Career', name: '职业发展', icon: '💼', order: 1 },
    { identifier: 'Health', name: '身心健康', icon: '💪', order: 2 },
    { identifier: 'Family', name: '家庭关系', icon: '👨‍👩‍👧‍👦', order: 3 },
    { identifier: 'Finance', name: '财务状况', icon: '💰', order: 4 },
    { identifier: 'Learning', name: '学习成长', icon: '📚', order: 5 },
    { identifier: 'Social', name: '社交人际', icon: '🤝', order: 6 },
    { identifier: 'Leisure', name: '休闲娱乐', icon: '🎮', order: 7 },
    { identifier: 'Spirituality', name: '精神世界', icon: '🧘', order: 8 },
  ];

  for (const domain of defaultDomains) {
    await prisma.domain.upsert({
      where: {
        userId_identifier: { userId: user.id, identifier: domain.identifier },
      },
      update: {},
      create: { ...domain, userId: user.id },
    });
  }
  console.log('✅ Created 8 default domains');

  // Create sample goal
  const careerDomain = await prisma.domain.findFirst({
    where: { userId: user.id, identifier: 'Career' },
  });

  if (careerDomain) {
    await prisma.goal.upsert({
      where: { id: 'seed-goal-1' },
      update: {},
      create: {
        id: 'seed-goal-1',
        userId: user.id,
        domainId: careerDomain.id,
        title: '完成项目架构设计',
        description: '设计 MeOS 系统的整体架构',
        status: 'active',
        priority: 'high',
        order: 1,
      },
    });
    console.log('✅ Created sample goal');
  }

  // Create sample todo
  await prisma.todo.upsert({
    where: { id: 'seed-todo-1' },
    update: {},
    create: {
      id: 'seed-todo-1',
      userId: user.id,
      title: '编写技术文档',
      description: '整理系统设计文档',
      status: 'todo',
      priority: 'medium',
      source: 'manual',
      order: 1,
    },
  });
  console.log('✅ Created sample todo');

  // Create sample habit
  await prisma.habit.upsert({
    where: { id: 'seed-habit-1' },
    update: {},
    create: {
      id: 'seed-habit-1',
      userId: user.id,
      title: '每日阅读',
      description: '每天阅读 30 分钟',
      frequency: 'daily',
      targetPerWeek: 7,
      isActive: true,
      order: 1,
    },
  });
  console.log('✅ Created sample habit');

  // Create sample subscription
  await prisma.subscription.upsert({
    where: { id: 'seed-sub-1' },
    update: {},
    create: {
      id: 'seed-sub-1',
      userId: user.id,
      name: 'GitHub Pro',
      provider: 'GitHub',
      billingCycle: 'monthly',
      costPerCycle: 4,
      currency: 'USD',
      startDate: new Date().toISOString(),
      isActive: true,
      autoRenew: true,
    },
  });
  console.log('✅ Created sample subscription');

  // Create sample reflection
  await prisma.reflection.upsert({
    where: { id: 'seed-reflection-1' },
    update: {},
    create: {
      id: 'seed-reflection-1',
      userId: user.id,
      date: new Date(),
      celebrations: '["完成了重要功能开发", "获得了用户反馈"]',
      improvements: '["需要提高代码质量", "减少会议时间"]',
      tomorrow: '继续开发核心功能',
      mood: 'good',
    },
  });
  console.log('✅ Created sample reflection');

  // ==================== MeLog 示例数据 ====================

  const melogWechat = await prisma.meLogSource.upsert({
    where: { userId_adapter_name: { userId: user.id, adapter: 'chatlog', name: '微信聊天记录' } },
    update: {},
    create: {
      userId: user.id,
      name: '微信聊天记录',
      category: 'im',
      adapter: 'chatlog',
      endpoint: 'http://localhost:5030',
      status: 'connected',
    },
  });

  const melogHealth = await prisma.meLogSource.upsert({
    where: { userId_adapter_name: { userId: user.id, adapter: 'apple-health', name: 'Apple 健康' } },
    update: {},
    create: {
      userId: user.id,
      name: 'Apple 健康',
      category: 'health',
      adapter: 'apple-health',
      status: 'disconnected',
    },
  });

  const melogObsidian = await prisma.meLogSource.upsert({
    where: { userId_adapter_name: { userId: user.id, adapter: 'obsidian', name: 'Obsidian 笔记' } },
    update: {},
    create: {
      userId: user.id,
      name: 'Obsidian 笔记',
      category: 'note',
      adapter: 'obsidian',
      status: 'connected',
    },
  });

  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const melogEntries = [
    {
      sourceId: melogHealth.id,
      externalId: 'seed-health-sleep-1',
      category: 'health',
      type: 'sleep',
      title: '睡眠 6.2 小时',
      payload: JSON.stringify({ value: 6.2, unit: 'hours' }),
      occurredAt: new Date(now - 1 * day),
    },
    {
      sourceId: melogHealth.id,
      externalId: 'seed-health-exercise-1',
      category: 'health',
      type: 'exercise',
      title: '跑步 30 分钟',
      payload: JSON.stringify({ value: 30, unit: 'minutes' }),
      tags: '跑步',
      occurredAt: new Date(now - 1 * day),
    },
    {
      sourceId: melogHealth.id,
      externalId: 'seed-health-sleep-2',
      category: 'health',
      type: 'sleep',
      title: '睡眠 7.8 小时',
      payload: JSON.stringify({ value: 7.8, unit: 'hours' }),
      occurredAt: new Date(now - 2 * day),
    },
    {
      sourceId: melogWechat.id,
      externalId: 'seed-im-1',
      category: 'im',
      type: 'chat-message',
      title: '与老张的对话',
      content: '最近项目上线压力有点大，感觉好累，晚上也睡不好',
      actor: '我',
      occurredAt: new Date(now - 1 * day + 3 * 3600 * 1000),
    },
    {
      sourceId: melogWechat.id,
      externalId: 'seed-im-2',
      category: 'im',
      type: 'chat-message',
      title: '与妈妈的对话',
      content: '这周末回家吃饭吗？给你做了你爱吃的红烧肉',
      actor: '妈妈',
      occurredAt: new Date(now - 2 * day),
    },
    {
      sourceId: melogObsidian.id,
      externalId: 'seed-note-1',
      category: 'note',
      type: 'markdown-doc',
      title: 'MeLog 标准设计笔记',
      content: '整理 MeLog Standard 的数据信封设计：统一时间线、幂等 ingest、技能清单格式。关键词：MCP、数据孤岛、local-first',
      tags: 'melog,设计,架构',
      occurredAt: new Date(now - 1 * day),
    },
    {
      sourceId: melogObsidian.id,
      externalId: 'seed-note-2',
      category: 'note',
      type: 'markdown-doc',
      title: '读书笔记：卡片写作法',
      content: '用卡片盒方法沉淀永久笔记，与 MeOS 的认知板块主题相关联',
      tags: '读书,知识管理',
      occurredAt: new Date(now - 3 * day),
    },
  ];

  for (const entry of melogEntries) {
    await prisma.meLogEntry.upsert({
      where: { sourceId_externalId: { sourceId: entry.sourceId, externalId: entry.externalId! } },
      update: {},
      create: { ...entry, userId: user.id },
    });
  }

  for (const source of [melogWechat, melogHealth, melogObsidian]) {
    await prisma.meLogSource.update({
      where: { id: source.id },
      data: { entryCount: await prisma.meLogEntry.count({ where: { sourceId: source.id } }), lastSyncAt: new Date() },
    });
  }

  // 安装内置技能（幂等）
  for (const skill of [
    { slug: 'health-insight', name: '健康洞察', description: '关联健康指标与聊天记录中的情绪表达，识别压力信号' },
    { slug: 'knowledge-recall', name: '知识回顾', description: '总结本期笔记重点关键词，并关联聊天记录中的相关讨论' },
    { slug: 'life-recap', name: '生活复盘', description: '把一段时间内的健康、沟通、笔记等条目汇总成每日复盘报告' },
  ]) {
    await prisma.meLogSkill.upsert({
      where: { userId_slug: { userId: user.id, slug: skill.slug } },
      update: {},
      create: { userId: user.id, ...skill, version: '0.1.0', source: 'builtin' },
    });
  }
  console.log('✅ Created MeLog demo data (3 sources, 7 entries, 3 builtin skills)');

  // ==================== 品牌板块示例数据 ====================
  // 品牌面板在 dev 模式固定以 mock-user-1 身份访问（src/server.ts 认证旁路），数据种给该用户；
  // 同时补齐该用户的 User 行，否则 dev 模式写库会因外键约束失败。
  await ensureBrandMockUser(prisma);
  await seedBrandMockData(prisma, BRAND_MOCK_USER_ID);
  console.log('✅ Created Brand demo data (mock-user-1: 4 pillars, 7 channels, 9 contents, 4 works)');
  console.log('   数据源：src/prisma/brand-seed-data.ts，可直接修改后重新运行 pnpm db:seed:brand');

  console.log('\n🎉 Database seed completed!');
  console.log('\n📋 Demo credentials:');
  console.log('   Email: demo@meos.app');
  console.log('   Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });