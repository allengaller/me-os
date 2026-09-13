#!/usr/bin/env python3
"""由 schema.prisma (sqlite) 派生 schema.cloud.prisma (postgresql)。

改动只有三类，逐条可核：
  1. datasource provider sqlite → postgresql
  2. 每个 model 追加 @@map("<snake_case 复数>")
  3. 7 个 JSON-in-text 列 String → Json（PG 侧落 jsonb）
  4. 7 张无属主字段的子表补 userId，让 RLS 能统一按 user_id 隔离
  5. users.password 放开 NOT NULL（改走 Supabase Auth，旧 bcrypt 哈希仍可带过来）
"""
import re

SRC = 'packages/api/src/prisma/schema.prisma'
DST = 'packages/api/src/prisma/schema.cloud.prisma'

TABLES = {
    'User': 'users', 'Vision': 'visions', 'Domain': 'domains', 'Goal': 'goals',
    'KeyResult': 'key_results', 'MindsetSlogan': 'mindset_slogans',
    'BalanceWheelScore': 'balance_wheel_scores', 'Todo': 'todos', 'Habit': 'habits',
    'HabitLog': 'habit_logs', 'Topic': 'topics', 'TopicNote': 'topic_notes',
    'InsightNote': 'insight_notes', 'ReadingItem': 'reading_items',
    'Reflection': 'reflections', 'PeriodicReview': 'periodic_reviews',
    'Subscription': 'subscriptions', 'QuotaDefinition': 'quota_definitions',
    'MonthlyUsage': 'monthly_usages', 'QuotaUsage': 'quota_usages',
    'Contact': 'contacts', 'HealthRecord': 'health_records',
    'MeLogSource': 'melog_sources', 'MeLogEntry': 'melog_entries',
    'MeLogSkill': 'melog_skills', 'MeLogRun': 'melog_runs',
    'MeLogSchedule': 'melog_schedules', 'Workflow': 'workflows',
    'WorkflowStep': 'workflow_steps', 'WorkflowConnection': 'workflow_connections',
    'BrandProfile': 'brand_profiles', 'BrandPillar': 'brand_pillars',
    'PlatformChannel': 'platform_channels', 'ContentItem': 'content_items',
    'ContentDistribution': 'content_distributions', 'Work': 'works',
    'MetricSnapshot': 'metric_snapshots',
}

JSON_COLS = {
    ('MeLogSource', 'config'), ('MeLogEntry', 'payload'), ('MeLogSkill', 'config'),
    ('MeLogRun', 'stats'), ('MeLogRun', 'entryIds'), ('Subscription', 'config'),
    ('PeriodicReview', 'dataSummary'),
}

CHILD_WITHOUT_USER = ['KeyResult', 'HabitLog', 'MonthlyUsage', 'QuotaDefinition',
                      'QuotaUsage', 'WorkflowStep', 'WorkflowConnection']

text = open(SRC, encoding='utf-8').read()
text = text.replace('provider = "sqlite"', 'provider = "postgresql"')
text = text.replace('url      = "file:./meos.db"', 'url      = env("DATABASE_URL")')
text = text.replace('// Prisma Schema for MeOS\n// 五维人生管理系统数据模型',
                    '// Prisma Schema for MeOS — 云端 PostgreSQL 变体\n'
                    '// 由 scripts/gen-cloud-schema.py 从 schema.prisma 派生，改模型请改那边')

blocks = re.split(r'(?m)^(model \w+ \{)', text)
out = [blocks[0]]

for i in range(1, len(blocks), 2):
    name = re.match(r'model (\w+)', blocks[i]).group(1)
    body = blocks[i + 1]
    lines = body.split('\n')
    done_map = False
    result = []
    for ln in lines:
        if ln.startswith('}'):
            if name in CHILD_WITHOUT_USER:
                result.append('  userId    String')
                result.append('')
            result.append(f'  @@map("{TABLES[name]}")')
            if name in CHILD_WITHOUT_USER:
                result.append('  @@index([userId])')
            result.append(ln)
            done_map = True
            continue
        fm = re.match(r'^(\s+)(\w+)(\s+)(String)(\??)(.*)$', ln)
        if fm and (name, fm.group(2)) in JSON_COLS:
            ln = f'{fm.group(1)}{fm.group(2)}{fm.group(3)}Json{fm.group(5)}{fm.group(6)}'
        if name == 'User' and re.match(r'^\s+password\s+String\s*$', ln):
            ln = re.sub(r'String\s*$', 'String?', ln)
        result.append(ln)
    assert done_map, name
    out.append(blocks[i] + '\n'.join(result))

text = ''.join(out)
open(DST, 'w', encoding='utf-8').write(text)

n_models = len(re.findall(r'(?m)^model ', text))
n_maps = len(re.findall(r'@@map\(', text))
n_json = len(re.findall(r'(?m)^\s+\w+\s+Json\??', text))

blocks_new = dict(re.findall(r'(?m)^model (\w+) \{(.*?)^\}', text, re.S))
missing = [m for m in CHILD_WITHOUT_USER if 'userId' not in blocks_new[m]]
added = sum(1 for m in CHILD_WITHOUT_USER if 'userId' not in
            dict(re.findall(r'(?m)^model (\w+) \{(.*?)^\}',
                            open(SRC, encoding='utf-8').read(), re.S))[m])
print(f'model={n_models} map={n_maps} json={n_json} 补 userId={added}')
assert n_models == n_maps == len(TABLES) == 37, '表数不符'
assert n_json == len(JSON_COLS), 'Json 列数不符'
assert not missing and added == len(CHILD_WITHOUT_USER), f'子表补列异常 {missing}'
print('OK →', DST)
