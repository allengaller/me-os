import { Heart, FileText, MessageCircle, Film, MapPin, Shapes } from 'lucide-react';

export type MeLogCategory = 'health' | 'note' | 'im' | 'media' | 'location' | 'custom';

export const MELOG_CATEGORY_LIST: MeLogCategory[] = ['health', 'note', 'im', 'media', 'location', 'custom'];

export const CATEGORY_META: Record<MeLogCategory, { label: string; icon: typeof Heart; color: string; bg: string }> = {
  health: { label: '健康', icon: Heart, color: '#e11d48', bg: 'rgba(225,29,72,0.08)' },
  note: { label: '笔记', icon: FileText, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  im: { label: '沟通', icon: MessageCircle, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  media: { label: '媒体', icon: Film, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  location: { label: '足迹', icon: MapPin, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  custom: { label: '其他', icon: Shapes, color: '#475569', bg: 'rgba(71,85,105,0.08)' },
};

export const SOURCE_STATUS_META: Record<string, { label: string; color: string }> = {
  connected: { label: '已连接', color: '#10b981' },
  disconnected: { label: '未连接', color: '#94a3b8' },
  error: { label: '异常', color: '#ef4444' },
};

/** 连接器目录：与 MeLog Standard 的 adapter 命名保持一致 */
export const ADAPTER_PRESETS: { adapter: string; name: string; category: MeLogCategory; description: string }[] = [
  { adapter: 'chatlog', name: 'chatlog', category: 'im', description: '微信 / QQ 等本地聊天记录解密与同步（开源 chatlog 项目）' },
  { adapter: 'apple-health', name: 'Apple HealthKit', category: 'health', description: '苹果健康导出数据：睡眠、步数、心率、运动' },
  { adapter: 'huawei-health', name: '华为运动健康', category: 'health', description: '华为运动健康导出数据' },
  { adapter: 'obsidian', name: 'Obsidian', category: 'note', description: '本地 Markdown 笔记库同步' },
  { adapter: 'notion', name: 'Notion', category: 'note', description: 'Notion 页面与数据库' },
  { adapter: 'webhook', name: '自定义 Webhook', category: 'custom', description: '任意脚本 / MCP Server 按 MeLog Standard 推送' },
];

export function formatTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
