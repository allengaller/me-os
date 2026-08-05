import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sunrise, Sun, Sunset, Moon, Target, Circle, BookOpen } from 'lucide-react';
import QuickNav from '../components/widgets/QuickNav';
import TodoWidget, { type Todo } from '../components/widgets/TodoWidget';
import HabitWidget, { type Habit } from '../components/widgets/HabitWidget';
import QuickCapture from '../components/widgets/QuickCapture';
import GithubWidget, { type GithubActivity } from '../components/widgets/GithubWidget';
import GoalWidget, { type Goal } from '../components/widgets/GoalWidget';
import RssWidget, { type RssItem } from '../components/widgets/RssWidget';
import TopicWidget, { type Topic } from '../components/widgets/TopicWidget';
import CalendarWidget, { type CalendarEvent } from '../components/widgets/CalendarWidget';
import ReflectionCta from '../components/widgets/ReflectionCta';

/* ── Mock 数据 ── 未来切换为 api.get() 调用时，替换此对象即可 ── */

const mockTodos: Todo[] = [
  { id: '1', title: '完成工作台原型设计', status: 'todo', priority: 'high' },
  { id: '2', title: '回复客户的方案邮件', status: 'todo', priority: 'urgent' },
  { id: '3', title: '阅读《深度工作》第三章', status: 'todo', priority: 'medium' },
  { id: '4', title: '整理本周技术笔记', status: 'todo', priority: 'low' },
  { id: '5', title: '修复登录页样式 bug', status: 'done', priority: 'medium' },
];

const mockHabits: Habit[] = [
  { id: 'h1', title: '晨间冥想', color: '#7C3AED', done: true },
  { id: 'h2', title: '阅读 30 分钟', color: '#2563EB', done: true },
  { id: 'h3', title: '运动健身', color: '#16A34A', done: false },
  { id: 'h4', title: '日记复盘', color: '#EA580C', done: false },
];

const mockGithub: GithubActivity = {
  repos: [
    { name: 'me-os', stars: 42, lastActive: '2h' },
    { name: 'workbench-demo', stars: 18, lastActive: '1d' },
    { name: 'dotfiles', stars: 7, lastActive: '3d' },
  ],
  weeklyCommits: [3, 8, 12, 6, 9, 4, 2],
  totalCommits: 44,
};

const mockGoals: Goal[] = [
  { id: 'g1', title: '完成 me-os 工作台 MVP', progress: 65 },
  { id: 'g2', title: '每月精读 2 本书', progress: 40 },
  { id: 'g3', title: '坚持写作输出', progress: 25 },
];

const mockRss: RssItem[] = [
  { id: 'r1', title: 'Agent 时代的个人知识管理：从 Zettelkasten 到 AI 辅助', source: '阮一峰周刊', time: '2h', url: '#' },
  { id: 'r2', title: '为什么 self-hosted 正在重新流行', source: 'Hacker News', time: '5h', url: '#' },
  { id: 'r3', title: 'Bento Grid 布局的设计哲学与实践', source: 'CSS-Tricks', time: '8h', url: '#' },
  { id: 'r4', title: '2026 年值得关注的 10 个开源项目', source: 'dev.to', time: '12h', url: '#' },
  { id: 'r5', title: '如何构建你的第二个大脑', source: '少数派', time: '1d', url: '#' },
];

const mockTopics: Topic[] = [
  { id: 't1', title: 'Agent 架构与工作流', status: 'researching', noteCount: 8 },
  { id: 't2', title: '系统化产品设计', status: 'exploring', noteCount: 3 },
  { id: 't3', title: 'React 性能优化', status: 'practicing', noteCount: 12 },
];

const mockCalendar: CalendarEvent[] = [
  { id: 'c1', title: '团队周会', time: '10:00', type: 'meeting' },
  { id: 'c2', title: '方案评审', time: '14:30', type: 'meeting' },
  { id: 'c3', title: '交付工作台原型', time: '17:00', type: 'task' },
];

/* ── 辅助：时段问候（复用 Today.tsx 逻辑） ── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { text: '夜深了', icon: Moon, sub: '注意休息' };
  if (hour < 9) return { text: '早上好', icon: Sunrise, sub: '从最重要的事开始' };
  if (hour < 12) return { text: '上午好', icon: Sun, sub: '保持专注，高效产出' };
  if (hour < 14) return { text: '中午好', icon: Sun, sub: '适当休息，补充能量' };
  if (hour < 18) return { text: '下午好', icon: Sun, sub: '收尾今日，规划明日' };
  return { text: '晚上好', icon: Sunset, sub: '回顾今天，放松身心' };
}

/* ── 主页面 ── */

export default function Workbench() {
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const pendingCount = mockTodos.filter((t) => t.status !== 'done').length;
  const habitDone = mockHabits.filter((h) => h.done).length;
  const activeTopics = mockTopics.length;

  return (
    <div className="page-enter max-w-7xl mx-auto">
      {/* ── Hero 区 ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <GreetingIcon size={22} style={{ color: 'var(--color-text-tertiary)' }} />
          <h1
            className="text-3xl"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
            }}
          >
            {greeting.text}
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {greeting.sub} · {format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}
        </p>
      </div>

      {/* ── 核心指标胶囊 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Target, label: '活跃目标', value: mockGoals.length, color: 'var(--color-text-primary)' },
          { icon: Circle, label: '待办', value: pendingCount, color: '#EA580C' },
          { icon: BookOpen, label: '专题', value: activeTopics, color: '#7C3AED' },
          { icon: Sun, label: '打卡进度', value: `${habitDone}/${mockHabits.length}`, color: '#16A34A' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`card p-4 stagger-${i + 1}`}
              style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={12} style={{ color: stat.color }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 快捷导航 ── */}
      <div className="mb-6">
        <QuickNav />
      </div>

      {/* ── Bento Grid 主体 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6">
        {/* 第一排：待办 / 习惯 / 快速捕捉（各 4 列） */}
        <div className="lg:col-span-4 stagger-1" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <TodoWidget todos={mockTodos} />
        </div>
        <div className="lg:col-span-4 stagger-2" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <HabitWidget habits={mockHabits} />
        </div>
        <div className="lg:col-span-4 stagger-3" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <QuickCapture />
        </div>

        {/* 第二排：GitHub（8 列）/ 近期目标（4 列） */}
        <div className="lg:col-span-8 stagger-3" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <GithubWidget data={mockGithub} />
        </div>
        <div className="lg:col-span-4 stagger-4" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <GoalWidget goals={mockGoals} />
        </div>

        {/* 第三排：RSS / 专题 / 日程（各 4 列） */}
        <div className="lg:col-span-4 stagger-4" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <RssWidget items={mockRss} />
        </div>
        <div className="lg:col-span-4 stagger-5" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <TopicWidget topics={mockTopics} />
        </div>
        <div className="lg:col-span-4 stagger-5" style={{ animationName: 'fadeSlideUp', animationDuration: 'var(--duration-slow)', animationTimingFunction: 'var(--ease-out)', animationFillMode: 'both' }}>
          <CalendarWidget events={mockCalendar} />
        </div>
      </div>

      {/* ── 反思入口 ── */}
      <ReflectionCta done={false} />
    </div>
  );
}
