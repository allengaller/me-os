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
