/**
 * MeOS Shared Types
 * 前后端共享的核心类型定义
 */

// ==================== 认证类型 ====================

export interface AuthenticatedUser {
  userId: string;
}

// ==================== 基础类型 ====================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 方向 (Direction) ====================

export interface Vision {
  id: string;
  userId: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  id: string;
  userId: string;
  identifier: string;
  name: string;
  icon?: string;
  weight: number;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'planned' | 'active' | 'completed' | 'abandoned';
export type Priority = 'high' | 'medium' | 'low';

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate?: string;
  endDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  domainId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  keyResults?: KeyResult[];
}

export interface MindsetSlogan {
  id: string;
  userId: string;
  content: string;
  category: string;
  order: number;
  domainId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceWheelScore {
  id: string;
  userId: string;
  domainId: string;
  score: number;
  note?: string;
  createdAt: string;
  domain?: Domain;
}

// ==================== 行动 (Action) ====================

export type TodoStatus = 'inbox' | 'todo' | 'doing' | 'done' | 'cancelled';
export type Urgency = 'urgent' | 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: Urgency;
  dueDate?: string;
  goalId?: string;
  domainId?: string;
  source: string;
  estimatedMinutes?: number;
  energy?: string;
  order: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type HabitFrequency = 'daily' | 'weekly';

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetPerWeek?: number;
  goalId?: string;
  domainId?: string;
  color?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  logs?: HabitLog[];
}

// ==================== 认知 (Cognition) ====================

export type TopicStatus = 'exploring' | 'researching' | 'practicing' | 'breakthrough' | 'archived';

export interface TopicNote {
  id: string;
  topicId: string;
  noteType: string;
  content: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  status: TopicStatus;
  priority: string;
  goalId?: string;
  currentUnderstanding?: string;
  actionPlan?: string;
  createdAt: string;
  updatedAt: string;
  notes?: TopicNote[];
}

export interface InsightNote {
  id: string;
  userId: string;
  content: string;
  topicId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReadingType = 'book' | 'article' | 'video' | 'podcast' | 'course';
export type ReadingStatus = 'want' | 'reading' | 'done' | 'abandoned';

export interface ReadingItem {
  id: string;
  userId: string;
  title: string;
  author?: string;
  type: ReadingType;
  status: ReadingStatus;
  url?: string;
  note?: string;
  rating?: number;
  topicId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 反思 (Reflection) ====================

export interface Reflection {
  id: string;
  userId: string;
  date: string;
  celebrations: string[];
  improvements: string[];
  tomorrow?: string;
  mood?: string;
  tags?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface PeriodicReview {
  id: string;
  userId: string;
  period: ReviewPeriod;
  startDate: string;
  endDate: string;
  achievements: string[];
  challenges: string[];
  insights?: string;
  nextFocus: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 资源 (Resources) ====================

export type RelationType = 'friend' | 'colleague' | 'mentor' | 'family' | 'other';
export type ContactFreq = 'weekly' | 'monthly' | 'quarterly';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  title?: string;
  company?: string;
  relation: RelationType;
  tags?: string[];
  notes?: string;
  contactFreq?: ContactFreq;
  lastContact?: string;
  domainId?: string;
  createdAt: string;
  updatedAt: string;
}

export type HealthRecordType = 'sleep' | 'exercise' | 'weight' | 'mood' | 'energy' | 'water' | 'custom';

export interface HealthRecord {
  id: string;
  userId: string;
  type: HealthRecordType;
  value: number;
  unit: string;
  note?: string;
  recordedAt: string;
  createdAt: string;
}

export interface QuotaDefinition {
  id: string;
  subscriptionId: string;
  name: string;
  unit: string;
  monthlyLimit: number;
  warningThreshold: number;
  criticalThreshold: number;
  order: number;
  quotaType: string;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  provider: string;
  billingCycle: string;
  costPerCycle: number;
  currency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  autoRenew: boolean;
  websiteUrl?: string;
  notes?: string;
  quotas: QuotaDefinition[];
  createdAt: string;
  updatedAt: string;
}

// ==================== MeLog (生活数据汇聚) ====================

export type MeLogCategory = 'health' | 'note' | 'im' | 'media' | 'location' | 'custom';

export const MELOG_CATEGORIES: MeLogCategory[] = ['health', 'note', 'im', 'media', 'location', 'custom'];

export interface MeLogSource {
  id: string;
  userId: string;
  name: string;
  category: MeLogCategory;
  adapter: string;
  endpoint?: string;
  config?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: string;
  syncCursor?: string;
  entryCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** MeLog Standard 统一事件信封（MeLogEntry） */
export interface MeLogEntry {
  id: string;
  userId: string;
  sourceId: string;
  externalId?: string;
  category: MeLogCategory;
  type: string;
  title: string;
  content?: string;
  payload?: string;
  tags?: string;
  actor?: string;
  occurredAt: string;
  createdAt: string;
}

export interface MeLogSkill {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  source: 'builtin' | 'community' | 'custom';
  config?: string;
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeLogRun {
  id: string;
  userId: string;
  skillId: string;
  status: 'running' | 'succeeded' | 'failed';
  periodStart?: string;
  periodEnd?: string;
  summary?: string;
  result?: string;
  stats?: string;
  entryIds?: string;
  createdAt: string;
}

export interface MeLogOverview {
  totalEntries: number;
  last7Days: number;
  last30Days: number;
  byCategory: { category: string; count: number; last7Days: number }[];
  sources: { total: number; connected: number; error: number }[];
  latestRuns: MeLogRun[];
  llm: { configured: boolean; model?: string };
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Re-export pagination utilities
export { getPaginationParams, createPaginatedResponse } from './pagination.js';
export type { PaginationInput, PaginationResult } from './pagination.js';
