/**
 * Supabase 适配器：实现 LocalDBAdapter 同一接口，把请求翻译成 PostgREST。
 * 与 apps/web/src/lib/api.ts 的 localDBAdapter 并列；在生产构建里替换后者。
 *
 * 形状契约（与 apps/web/src/lib/localDB.ts 对齐）：
 *   list   → { <entity>: T[] }
 *   getOne → T
 *   create → { <entity>: T }
 *   update → { <entity>: T }
 *   delete → { success: true }
 *
 * 嵌套关系用 supabase-js 资源嵌入语法：`select('*, logs:habit_logs(*)')`，
 * 子表别名取前端的字段名（camelCase），PostgREST 会按别名返回。
 */
import { supabase } from '../supabase/client';

// 动态表名绕开 supabase-js 的字面量 union 类型检查；auth 路径仍走 supabase 自身。
const sb = () => supabase as any;

// 实体 → 表名（snake_case）。与 packages/api/src/prisma/schema.cloud.prisma 的 @@map 一致。
const TABLE: Record<string, string> = {
  domains: 'domains',
  mindsets: 'mindset_slogans',
  'balance-wheel': 'balance_wheel_scores',
  reflections: 'reflections',
  reviews: 'periodic_reviews',
  insights: 'insight_notes',
  subscriptions: 'subscriptions',
  topics: 'topics',
  todos: 'todos',
  habits: 'habits',
  goals: 'goals',
  visions: 'visions',
  contacts: 'contacts',
  reading: 'reading_items',
  health: 'health_records',
  workflows: 'workflows',
  melog: 'melog_entries',
  melogSources: 'melog_sources',
  melogSkills: 'melog_skills',
};

// list 端点需要的嵌套 select 子句；空 = 不嵌入。
const EMBED: Record<string, string> = {
  habits: '*, logs:habit_logs(*)',
  topics: '*, notes:topic_notes(*)',
  workflows: '*, steps:workflow_steps(*), connections:workflow_connections(*)',
  goals: '*, keyResults:key_results(*)',
  subscriptions: '*, quotas:quota_definitions(*)',
};

interface Adapter {
  get: (url: string) => Promise<{ data: unknown }>;
  post: (url: string, data?: unknown) => Promise<{ data: unknown }>;
  patch: (url: string, data?: unknown) => Promise<{ data: unknown }>;
  delete: (url: string) => Promise<{ data: unknown }>;
  request: (url: string, method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', data?: unknown) => Promise<unknown>;
  handleAuth: (segments: string[], data?: unknown) => Promise<unknown>;
}

function unwrap<T>(entity: string, data: T | T[]): { [k: string]: T | T[] } {
  // list 形态：{ domains: [...] }；单条：{ domain: {...} }
  const list = entity.endsWith('s') ? entity : entity + 's';
  return Array.isArray(data) ? { [list]: data } : { [entity]: data };
}

function err(message: string, status = 400): Error {
  return Object.assign(new Error(message), { response: { data: { error: message } }, status });
}

function tableOf(entity: string): string {
  const t = TABLE[entity];
  if (!t) throw err(`未配置实体到表的映射：${entity}`, 501);
  return t;
}

export const supabaseAdapter: Adapter = {
  async get(url: string) {
    return { data: await this.request(url, 'GET') };
  },
  async post(url: string, data?: unknown) {
    return { data: await this.request(url, 'POST', data) };
  },
  async patch(url: string, data?: unknown) {
    return { data: await this.request(url, 'PATCH', data) };
  },
  async delete(url: string) {
    return { data: await this.request(url, 'DELETE') };
  },

  async request(url, method = 'GET', data?) {
    const path = url.split('?')[0];
    const segs = path.split('/').filter(Boolean);
    const entity = segs[0];
    const id = segs[1];

    if (url.startsWith('/auth/')) return this.handleAuth(segs, data);

    if (method === 'GET' && entity === 'balance-wheel' && segs[1] === 'history') {
      const { data: rows } = await supabase
        .from('balance_wheel_scores')
        .select('*')
        .order('createdAt', { ascending: false });
      return { history: rows ?? [] };
    }
    if (entity === 'health' && segs[1] === 'summary') {
      const days = parseInt(new URL(url, 'http://x').searchParams.get('days') || '7', 10);
      const since = new Date(Date.now() - days * 86400e3).toISOString();
      const { data: rows } = await supabase
        .from('health_records')
        .select('type,value,unit,recordedAt')
        .gte('recordedAt', since);
      return { summary: aggregateHealth(rows ?? []) };
    }
    if (entity === 'subscriptions' && segs.includes('dashboard') && segs.includes('summary')) {
      throw err('subscriptions.dashboard.summary 暂未迁移到 supabase 适配器', 501);
    }

    const table = tableOf(entity);

    if (method === 'GET' && !id) {
      const sel = EMBED[entity] || '*';
      const { data: rows, error } = await sb()
        .from(table)
        .select(sel)
        .order('createdAt', { ascending: false });
      if (error) throw err(error.message);
      return unwrap(entity, rows ?? []);
    }
    if (method === 'GET' && id) {
      const { data: row, error } = await sb().from(table).select('*').eq('id', id).single();
      if (error) throw err(error.message);
      return unwrap(entity, row);
    }
    if (method === 'POST' && !id) {
      const { data: row, error } = await sb().from(table).insert({ userId: await currentUid(), ...(data as Record<string, unknown>) }).select();
      if (error) throw err(error.message);
      const arr = row ?? [];
      return unwrap(entity, arr[0] ?? arr);
    }
    if (method === 'PATCH' && id) {
      const { data: row, error } = await sb().from(table).update(data as Record<string, unknown>).eq('id', id).select();
      if (error) throw err(error.message);
      const arr = row ?? [];
      return unwrap(entity, arr[0] ?? arr);
    }
    if (method === 'DELETE' && id) {
      const { error } = await sb().from(table).delete().eq('id', id);
      if (error) throw err(error.message);
      return { success: true };
    }
    throw err(`未实现的 supabase 适配器路由：${method} ${url}`, 501);
  },

  async handleAuth(segs, data) {
    const action = segs[1];
    const d = (data ?? {}) as Record<string, string>;
    if (action === 'login') {
      const { data: r, error } = await supabase.auth.signInWithPassword({
        email: d.email,
        password: d.password,
      });
      if (error || !r.user) throw err(error?.message ?? '登录失败', 401);
      await ensureProfile(r.user.id, d.email);
      return { user: profileOf(r.user) };
    }
    if (action === 'register') {
      // Meoo 默认关闭公开注册，由平台/运维通过 admin 接口建账号；
      // 这里前端 register 路径仅做"已有账号后首次登录"。
      throw err('请通过 meoo cloud admin 创建账号，再回到登录页。', 403);
    }
    if (action === 'me') {
      const { data: r } = await supabase.auth.getUser();
      if (!r.user) throw err('Not authenticated', 401);
      return { user: profileOf(r.user) };
    }
    throw err(`未知 auth 动作：${action}`, 404);
  },
};

async function currentUid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw err('请先登录', 401);
  return data.user.id;
}

async function ensureProfile(uid: string, email: string): Promise<void> {
  const { data } = await sb().from('users').select('id').eq('id', uid).maybeSingle();
  if (!data) {
    const now = new Date().toISOString();
    await sb().from('users').insert({
      id: uid,
      email,
      name: email.split('@')[0],
      updatedAt: now,
    });
  }
}

function profileOf(u: { id: string; email?: string | null; created_at?: string }): unknown {
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.email ?? '').split('@')[0],
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}

interface HealthRow {
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

function aggregateHealth(rows: HealthRow[]): unknown {
  const byType: Record<string, { count: number; sum: number; latest: number; unit: string }> = {};
  for (const r of rows) {
    const t = (byType[r.type] ??= { count: 0, sum: 0, latest: 0, unit: r.unit });
    t.count++; t.sum += r.value; t.latest = r.value;
  }
  return Object.entries(byType).map(([type, v]) => ({
    type,
    avg: v.count ? v.sum / v.count : 0,
    latest: v.latest,
    unit: v.unit,
    count: v.count,
  }));
}