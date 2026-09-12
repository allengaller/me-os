import { Sparkles, Target, Brain } from 'lucide-react';

const pillars = [
  {
    icon: Sparkles,
    title: '数据主权',
    desc: '本地 SQLite 存储架构，连接器在你自己的设备上运行，数据随时完整导出。',
  },
  {
    icon: Target,
    title: 'AI 原生',
    desc: '内置 MCP Server 与 MeLog Standard 开放格式，任何 AI 与工具可程序化读写你的时间线。',
  },
  {
    icon: Brain,
    title: '方法论内置',
    desc: '平衡轮、OKR、GTD 不是模板，而是 36 个数据模型支撑的真实联动闭环。',
  },
];

const modules = [
  { name: 'Today', desc: '今日待办、习惯与反思一站式工作台' },
  { name: '方向', desc: '愿景、领域、目标与关键结果、工作流画布' },
  { name: '行动', desc: '待办看板与习惯打卡' },
  { name: '认知', desc: '课题研究、洞察笔记、阅读清单' },
  { name: '反思', desc: '每日反思与周期复盘，自动汇总行动数据' },
  { name: '资源', desc: '订阅、人脉、健康记录' },
  { name: 'MeLog', desc: '健康/笔记/聊天汇入统一时间线，技能加工' },
  { name: '品牌', desc: '内容流水线、渠道矩阵与作品库' },
];

const phases = [
  { tag: 'Phase 1', name: '开源冷启动', desc: '社区首发、每周 build log、招募贡献者' },
  { tag: 'Phase 2', name: '增长与留存', desc: 'Onboarding 打磨、分享物、云托管 Beta' },
  { tag: 'Phase 3', name: 'MeLog 生态', desc: 'Skill 市场、第三方连接器、开放标准共建' },
  { tag: 'Phase 4', name: '商业化', desc: '云同步订阅、移动端、可持续经营' },
];

export default function GtmSections() {
  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
  };

  return (
    <>
      <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-4">
        {pillars.map((p) => (
          <div key={p.title} className="rounded-xl p-6" style={cardStyle}>
            <p.icon className="w-5 h-5 mb-3" style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {p.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              {p.desc}
            </p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-14">
        <h2
          className="text-2xl font-semibold tracking-tight mb-2 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          七大板块，一个系统
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
          五维框架 + 生活数据汇聚 + 个人品牌经营
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((m) => (
            <div key={m.name} className="rounded-xl p-5" style={cardStyle}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {m.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2
          className="text-2xl font-semibold tracking-tight mb-8 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          路线图
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          {phases.map((ph) => (
            <div key={ph.tag} className="rounded-xl p-5" style={cardStyle}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent)' }}>
                {ph.tag}
              </p>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {ph.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                {ph.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
