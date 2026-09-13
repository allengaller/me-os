import { localDB } from './localDB';

export const DEMO_EMAIL = 'demo@meos.local';
export const DEMO_PASSWORD = 'demo123456';
const DEMO_NAME = '演示用户';

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return toDateStr(d);
};

const agoIso = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// 旧版演示账号（标记机制上线前创建的）没有 mock 标记；登录时一次性补标，之后不再重复。
const MOCK_MARK_VERSION_KEY = 'meos-demo-mock-marked-v1';

export async function ensureDemoAccount() {
  try {
    const res = await localDB.auth.login(DEMO_EMAIL, DEMO_PASSWORD);
    if (!localStorage.getItem(MOCK_MARK_VERSION_KEY)) {
      await markAllDemoRecordsMock();
      localStorage.setItem(MOCK_MARK_VERSION_KEY, '1');
    }
    return res;
  } catch {
    const reg = await localDB.auth.register(DEMO_NAME, DEMO_EMAIL, DEMO_PASSWORD);
    await seedDemoData();
    localStorage.setItem(MOCK_MARK_VERSION_KEY, '1');
    return reg;
  }
}

async function seedDemoData() {
  const { domains } = await localDB.domains.getAll();
  const dom = (order: number) => domains.find((d) => d.order === order)?.id || '';

  await localDB.visions.create({
    content:
      '持续产出真实价值：让 MeOS 成为被真正使用的开源人生操作系统，身体、认知与作品始终在线，把每一段经历变成方法。',
  });

  const goalMeos = await localDB.goals.create({
    title: 'MeOS 开源发布',
    status: 'active',
    priority: 'high',
    startDate: agoIso(30),
    endDate: '2026-10-01T00:00:00.000Z',
  });
  await localDB.goals.createKeyResult(goalMeos.goal.id, { title: 'GitHub Star', targetValue: 500, currentValue: 120, unit: '个' });
  await localDB.goals.createKeyResult(goalMeos.goal.id, { title: '第三方连接器', targetValue: 3, currentValue: 1, unit: '个' });

  const goalRun = await localDB.goals.create({
    title: '每周 4 次晨跑',
    status: 'active',
    priority: 'medium',
    startDate: agoIso(60),
  });
  await localDB.goals.createKeyResult(goalRun.goal.id, { title: '周跑步次数', targetValue: 4, currentValue: 2, unit: '次' });

  const goalBook = await localDB.goals.create({
    title: '精读《原则》',
    status: 'completed',
    priority: 'low',
    startDate: agoIso(120),
    endDate: agoIso(10),
  });
  await localDB.goals.createKeyResult(goalBook.goal.id, { title: '读书笔记', targetValue: 52, currentValue: 52, unit: '篇' });

  await localDB.todos.create({ title: '发布 MeOS v0.1 tag 与 changelog', status: 'done', priority: 'high' });
  await localDB.todos.create({ title: '整理 GTM 渠道物料', status: 'done', priority: 'medium' });
  await localDB.todos.create({ title: '写 MeLog 标准 v0.2 草案', status: 'doing', priority: 'high' });
  await localDB.todos.create({ title: '晨跑 30 分钟', status: 'todo', priority: 'medium' });
  await localDB.todos.create({ title: '回复用户 issue', status: 'todo', priority: 'medium' });
  await localDB.todos.create({ title: '研究 Tauri 桌面端方案', status: 'inbox', priority: 'low' });

  const habitRun = await localDB.habits.create({ title: '晨跑', frequency: 'daily', color: '#3B82F6' });
  const habitRead = await localDB.habits.create({ title: '阅读 30 分钟', frequency: 'daily', color: '#10B981' });
  const habitReflect = await localDB.habits.create({ title: '记录每日反思', frequency: 'daily', color: '#F59E0B' });
  for (let i = 0; i < 7; i++) {
    if (i !== 2 && i !== 5) await localDB.habits.toggleLog(habitRun.habit.id, { date: dayStr(i) });
    await localDB.habits.toggleLog(habitRead.habit.id, { date: dayStr(i) });
    await localDB.habits.toggleLog(habitReflect.habit.id, { date: dayStr(i) });
  }

  await localDB.balanceWheel.saveScores([
    { domainId: dom(0), score: 7 },
    { domainId: dom(1), score: 5 },
    { domainId: dom(2), score: 6 },
    { domainId: dom(3), score: 8 },
    { domainId: dom(4), score: 4 },
    { domainId: dom(5), score: 7 },
    { domainId: dom(6), score: 5 },
    { domainId: dom(7), score: 6 },
  ]);

  await localDB.reflections.create({
    content: '晨跑 5 公里后状态很好；MeOS 单页演示版上线，首页即产品。明日：完成 GTM 物料并回复 issue。',
    date: dayStr(0),
    mood: '好',
  });
  await localDB.reflections.create({
    content: '访谈《园丁》分镜定稿，拍摄日待定晴天。复盘：现场环境不可控，需要双机位备份素材。',
    date: dayStr(1),
    mood: '平静',
  });

  await localDB.reviews.create({
    period: 'weekly',
    content: '本周完成 MeOS 单页融合与 Meoo 发布，推进 GTM 发布清单 3/8；访谈第一期进入拍摄筹备。',
    startDate: dayStr(6),
    endDate: dayStr(0),
  });

  const topic = await localDB.topics.create({
    title: '本地优先个人数据架构',
    description: '研究 local-first 与数据主权方向的技术选型与产品化路径',
    category: 'tech',
    status: 'active',
    priority: 'high',
    currentUnderstanding: 'SQLite + IndexedDB 双形态已跑通，MCP 是关键差异化。',
    actionPlan: '产出 MeLog Standard v0.2 草案。',
  });
  await localDB.insights.create({
    title: '数据主权是产品而非口号',
    content: '让用户随时导出，比任何隐私承诺都可信。',
    topicId: topic.topic.id,
  });
  await localDB.insights.create({
    title: '标准比功能更持久',
    content: '开放格式让社区贡献成为可能，MeLog Standard 是护城河。',
    tags: '生态',
  });

  await localDB.readingItems.create({
    title: '原则',
    author: 'Ray Dalio',
    type: 'book',
    status: 'done',
    rating: 5,
    note: '极度求真与极度透明的权衡。',
  });
  await localDB.readingItems.create({
    title: 'Local-First Software: You Own Your Data',
    author: 'Ink & Switch',
    type: 'article',
    status: 'reading',
    url: 'https://www.inkandswitch.com/local-first/',
  });

  await localDB.contacts.create({
    name: '老周',
    role: '导师',
    tags: ['mentor'],
    notes: '每季度深聊一次，做职业方向校准。',
    lastContact: agoIso(20),
  });
  await localDB.contacts.create({
    name: '阿黎',
    role: '合作者',
    company: '独立工作室',
    tags: ['collab'],
    notes: '访谈节目剪辑合作候选。',
    lastContact: agoIso(6),
  });

  for (let i = 0; i < 7; i++) {
    await localDB.healthRecords.create({
      type: 'sleep',
      value: 6.5 + ((i * 37) % 10) / 10,
      unit: 'hours',
      date: dayStr(i),
      recordedAt: agoIso(i, 8),
    });
  }
  await localDB.healthRecords.create({ type: 'weight', value: 68, unit: 'kg', date: dayStr(0) });

  await localDB.subscriptions.create({
    name: 'DeepSeek API',
    provider: 'DeepSeek',
    billingCycle: 'monthly',
    costPerCycle: 20,
    currency: 'CNY',
    isActive: true,
    autoRenew: true,
  });
  await localDB.subscriptions.create({
    name: 'iCloud+',
    provider: 'Apple',
    billingCycle: 'monthly',
    costPerCycle: 6,
    currency: 'CNY',
    isActive: true,
    autoRenew: true,
  });

  await localDB.mindsets.create({ content: '输出即学习：讲不清楚就还没想清楚。', category: 'learning', order: 0, pinned: false });
  await localDB.mindsets.create({ content: '先跑通，再打磨：演示优先于完美。', category: 'execution', order: 1, pinned: false });

  await markAllDemoRecordsMock();
}

/** 演示种子生成的每条记录都打 mock: true（数据层标记）。
 *  页面据此显示 mock 徽标；用户认领后前端写 mock: false，徽标消失。 */
async function markAllDemoRecordsMock() {
  const mark = async (
    getAll: () => Promise<Record<string, unknown>>,
    key: string,
    update: (id: string, data: { mock: boolean }) => Promise<unknown>,
  ) => {
    const res = (await getAll()) as Record<string, Array<{ id: string; mock?: boolean }> | undefined>;
    for (const item of res[key] ?? []) {
      if (item.mock === false) continue; // 已认领，不重标
      if (item.mock === true) continue; // 已标记
      await update(item.id, { mock: true });
    }
  };

  await mark(localDB.todos.getAll, 'todos', (id, d) => localDB.todos.update(id, d));
  await mark(localDB.habits.getAll, 'habits', (id, d) => localDB.habits.update(id, d));
  await mark(localDB.goals.getAll, 'goals', (id, d) => localDB.goals.update(id, d));
  await mark(localDB.reflections.getAll, 'reflections', (id, d) => localDB.reflections.update(id, d));
  await mark(localDB.reviews.getAll, 'reviews', (id, d) => localDB.reviews.update(id, d));
  await mark(localDB.topics.getAll, 'topics', (id, d) => localDB.topics.update(id, d));
  await mark(localDB.insights.getAll, 'insights', (id, d) => localDB.insights.update(id, d));
  await mark(localDB.readingItems.getAll, 'items', (id, d) => localDB.readingItems.update(id, d));
  await mark(localDB.contacts.getAll, 'contacts', (id, d) => localDB.contacts.update(id, d));
  await mark(() => localDB.healthRecords.getAll(), 'records', (id, d) => localDB.healthRecords.update(id, d));
  await mark(localDB.subscriptions.getAll, 'subscriptions', (id, d) => localDB.subscriptions.update(id, d));
  await mark(localDB.mindsets.getAll, 'slogans', (id, d) => localDB.mindsets.update(id, d));

  const { vision } = await localDB.visions.getActive();
  if (vision && vision.mock !== true && vision.mock !== false) {
    await localDB.visions.update(vision.id, { mock: true });
  }
}