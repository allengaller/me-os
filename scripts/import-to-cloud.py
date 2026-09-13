#!/usr/bin/env python3
"""把本地 SQLite 转成云端 PostgreSQL 的 INSERT 脚本。

模式：
  curated     只导你亲手写、且连接器无法重生成的数据
  full        导全部，但剔除 isMock=1 的 seed 行
  full-all    一行不落全导（仅用于对照，不建议）

转换规则（见 docs/档案/工程/设计/2026-09-13云数据库迁移设计.md §3）：
  SQLite 的 DateTime 存成 integer epoch 毫秒 → 转 UTC ISO 字符串
  Boolean 存成 0/1                      → 转 true/false
  JSON-in-text 列                       → ::jsonb
  7 张子表的 userId 由父表派生

产物只写 /tmp，不落仓库：里面是生活数据。
"""
import re, sqlite3, sys, os

SRC = 'packages/api/src/prisma/meos.db'
SCHEMA = 'packages/api/src/prisma/schema.cloud.prisma'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'curated'
OUT = f'/tmp/meos_import_{MODE}.sql'

TABLES = [
    ('User', 'users'), ('Vision', 'visions'), ('Domain', 'domains'), ('Goal', 'goals'),
    ('KeyResult', 'key_results'), ('MindsetSlogan', 'mindset_slogans'),
    ('BalanceWheelScore', 'balance_wheel_scores'), ('Todo', 'todos'), ('Habit', 'habits'),
    ('HabitLog', 'habit_logs'), ('Topic', 'topics'), ('TopicNote', 'topic_notes'),
    ('InsightNote', 'insight_notes'), ('ReadingItem', 'reading_items'),
    ('Reflection', 'reflections'), ('PeriodicReview', 'periodic_reviews'),
    ('Subscription', 'subscriptions'), ('QuotaDefinition', 'quota_definitions'),
    ('MonthlyUsage', 'monthly_usages'), ('QuotaUsage', 'quota_usages'),
    ('Contact', 'contacts'), ('HealthRecord', 'health_records'),
    ('MeLogSource', 'melog_sources'), ('MeLogEntry', 'melog_entries'),
    ('MeLogSkill', 'melog_skills'), ('MeLogRun', 'melog_runs'),
    ('MeLogSchedule', 'melog_schedules'), ('Workflow', 'workflows'),
    ('WorkflowStep', 'workflow_steps'), ('WorkflowConnection', 'workflow_connections'),
    ('BrandProfile', 'brand_profiles'), ('BrandPillar', 'brand_pillars'),
    ('PlatformChannel', 'platform_channels'), ('ContentItem', 'content_items'),
    ('ContentDistribution', 'content_distributions'), ('Work', 'works'),
    ('MetricSnapshot', 'metric_snapshots'),
]

CHILD_PARENT = {  # 子表 → (父表 model, 父表外键列)
    'KeyResult': ('Goal', 'goalId'), 'HabitLog': ('Habit', 'habitId'),
    'MonthlyUsage': ('Subscription', 'subscriptionId'),
    'QuotaDefinition': ('Subscription', 'subscriptionId'),
    'QuotaUsage': ('MonthlyUsage', 'monthlyUsageId'),
    'WorkflowStep': ('Workflow', 'workflowId'),
    'WorkflowConnection': ('Workflow', 'workflowId'),
}

JSON_COLS = {('MeLogSource', 'config'), ('MeLogEntry', 'payload'),
             ('MeLogSkill', 'config'), ('MeLogRun', 'stats'),
             ('MeLogRun', 'entryIds'), ('Subscription', 'config'),
             ('PeriodicReview', 'dataSummary')}

# curated 模式白名单：模型 → 额外过滤条件（None 表示整表都要）
CURATED = {
    'User': None, 'Vision': None, 'Domain': None, 'Goal': None, 'Todo': None,
    'Habit': None, 'Reflection': None, 'Subscription': None,
    'MeLogSource': None, 'MeLogSkill': None, 'HealthRecord': None,
    'MeLogEntry': "sourceId != (SELECT id FROM MeLogSource WHERE adapter='dida365')",
}

src_text = open(SCHEMA, encoding='utf-8').read()
types = {}
for m in re.finditer(r'(?m)^model (\w+) \{(.*?)^\}', src_text, re.S):
    name, body = m.group(1), m.group(2)
    fields = {}
    for ln in body.split('\n'):
        fm = re.match(r'^\s+(\w+)\s+(String|Int|Float|Boolean|DateTime|Json)(\?)?', ln)
        if fm:
            fields[fm.group(1)] = fm.group(2)
    types[name] = fields

db = sqlite3.connect(f'file:{SRC}?mode=ro', uri=True)
db.row_factory = sqlite3.Row


def lit(v, kind):
    if v is None:
        return 'NULL'
    if kind == 'Boolean':
        return 'true' if v else 'false'
    if kind == 'DateTime':
        import datetime
        return "'" + datetime.datetime.fromtimestamp(v / 1000.0, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f') + "+00'::timestamptz"
    if kind == 'Float':
        return repr(float(v))
    if kind == 'Int':
        return str(int(v))
    if kind == 'Json':
        s = str(v).replace("'", "''")
        return f"'{s}'::jsonb"
    s = str(v).replace('\x00', '').replace("'", "''")
    return "'" + s + "'"


derived = {}   # (子表 model, 行 id) -> userId
owner_of = {}  # 父表 model -> {id: userId}
counts, total = [], 0
out = ['-- 由 scripts/import-to-cloud.py 生成，mode=' + MODE,
       'BEGIN;']

for model, table in TABLES:
    cols = [r[1] for r in db.execute(f'PRAGMA table_info("{model}")')]
    ft = types[model]
    q = f'SELECT * FROM "{model}"'
    if MODE == 'curated':
        if model not in CURATED:
            counts.append((model, table, 0, '跳过'))
            continue
        cond = CURATED[model]
        if cond:
            q += ' WHERE ' + cond
    if MODE in ('curated', 'full') and ('isMock' in cols):
        q += (' AND ' if 'WHERE' in q else ' WHERE ') + 'isMock = 0'
    rows = list(db.execute(q))

    written, orphans = 0, 0
    for r in rows:
        if model in CHILD_PARENT:
            parent, fk = CHILD_PARENT[model]
            owner = owner_of.get(parent, {}).get(r[fk])
            if owner is None:
                orphans += 1
                continue
            names = cols + ['userId']
            vals = [lit(r[c], ft.get(c, 'String')) for c in cols] + [lit(owner, 'String')]
            owner_of.setdefault(model, {})[r['id']] = owner
        else:
            names = cols
            vals = [lit(r[c], ft.get(c, 'String')) for c in cols]
            if 'userId' in cols:
                owner_of.setdefault(model, {})[r['id']] = r['userId']
        collist = ', '.join(f'"{c}"' for c in names)
        out.append(f'INSERT INTO "{table}" ({collist}) VALUES ({", ".join(vals)});')
        written += 1
        total += 1
    counts.append((model, table, written, f'orphan {orphans}' if orphans else ''))

out.append('COMMIT;')
open(OUT, 'w', encoding='utf-8').write('\n'.join(out) + '\n')

print(f'模式 {MODE} → {OUT}  ({os.path.getsize(OUT)} B, {total} 行)')
for model, table, n, note in counts:
    src_n = db.execute(f'SELECT count(*) FROM "{model}"').fetchone()[0]
    if n != src_n or note:
        print(f'  {model:<20} {table:<24} 导 {n:>4} / 源 {src_n:>4} {note}')
