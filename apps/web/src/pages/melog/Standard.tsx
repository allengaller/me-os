import { FileBadge, Inbox, Wrench, PackageOpen } from 'lucide-react';

/**
 * MeLog Standard v0.1 摘要页。
 * 完整规范见仓库 docs/melog/STANDARD.md。
 */

const SECTIONS = [
  {
    icon: Inbox,
    title: '1. 统一事件信封（MeLogEntry）',
    description: '所有来源的数据都归一为同一种条目结构，是时间线与技能的最小数据单元',
    fields: [
      ['category', '分类：health / note / im / media / location / custom'],
      ['type', '细分类型：sleep / steps / chat-message / markdown-doc …（由连接器命名空间约定）'],
      ['title', '一行摘要（必填）'],
      ['content', '正文文本，可选'],
      ['payload', 'JSON 字符串，结构化数据，如 {"value":7.5,"unit":"hours"}'],
      ['actor', '参与者 / 作者，IM 场景为发送者'],
      ['tags', '逗号分隔标签'],
      ['occurredAt', '发生时间 ISO 8601（必填）'],
      ['externalId', '来源系统唯一 ID，用于幂等去重（推荐）'],
    ],
  },
  {
    icon: Wrench,
    title: '2. Ingest API（写入规范）',
    description: '任何连接器只需实现一次 HTTP POST，即可接入 MeLog 生态',
    fields: [
      ['POST /api/melog/ingest', '{ source: { adapter, name, category }, entries: MeLogEntry[] }'],
      ['幂等', '以 (adapter+name, externalId) 去重，重复推送不会产生重复条目'],
      ['批量', '单次最多 500 条，连接器可按游标增量同步'],
      ['本地优先', '数据写入本地 SQLite，MeOS 不做云端转发'],
    ],
  },
  {
    icon: FileBadge,
    title: '3. MCP 接口（模型上下文协议）',
    description: 'MeLog 自带 MCP Server（JSON-RPC over HTTP，POST /api/melog/mcp），AI 客户端可直接读写',
    fields: [
      ['melog_get_overview', '获取分类统计、数据源健康状态、最近技能运行'],
      ['melog_query_entries', '按分类 / 来源 / 时间 / 关键词查询统一时间线'],
      ['melog_ingest_entries', '按 MeLog Standard 批量写入条目（幂等）'],
      ['melog_run_skill', '运行一个技能并返回 Markdown 报告'],
      ['外部接入', 'chatlog 等 MCP Server 也可以作为连接器，把数据转换后推入 Ingest API'],
    ],
  },
  {
    icon: PackageOpen,
    title: '4. Skill 清单格式（分发规范）',
    description: '技能以清单（manifest）描述，内置技能与社区技能使用同一格式',
    fields: [
      ['slug', '全局唯一标识，如 health-insight'],
      ['version', '语义化版本，如 0.1.0'],
      ['source', 'builtin / community / custom'],
      ['inputs', 'periodStart / periodEnd 或 days'],
      ['output', 'summary + result(Markdown) + stats(JSON) + entryIds（数据血缘）'],
    ],
  },
];

export default function Standard() {
  return (
    <div className="max-w-3xl">
      <div
        className="rounded-xl p-5 mb-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
      >
        <h3 className="text-base font-medium mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          MeLog Standard v0.1
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          一个开放的、社区共建的个人生活数据格式：把健康、笔记、IM 聊天记录等数据孤岛，
          用统一信封汇入本地时间线，通过 MCP 与 Skills 让 AI 和工具读写。
          标准先行，实现随后 —— 完整规范见仓库 docs/melog/STANDARD.md。
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <section.icon size={15} style={{ color: 'var(--color-text-tertiary)' }} />
              <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {section.title}
              </h4>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              {section.description}
            </p>
            <div className="space-y-1.5">
              {section.fields.map(([field, description]) => (
                <div key={field} className="flex gap-3 text-xs">
                  <code
                    className="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 w-44 truncate"
                    style={{ fontSize: '10px' }}
                  >
                    {field}
                  </code>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
