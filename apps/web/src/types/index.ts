export interface Domain {
  id: string;
  userId: string;
  identifier: string;
  name: string;
  icon: string | null;
  weight: number;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  domainId: string;
  title: string;
  description: string | null;
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  priority: 'high' | 'medium' | 'low';
  startDate: string | null;
  endDate: string | null;
  order: number;
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
  domain?: Domain;
  keyResults?: KeyResult[];
  todos?: Todo[];
  habits?: Habit[];
  topics?: Topic[];
}

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string | null;
  endDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'inbox' | 'todo' | 'doing' | 'done' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string | null;
  goalId: string | null;
  domainId: string | null;
  source: 'manual' | 'reflection' | 'review';
  estimatedMinutes: number | null;
  energy: 'high' | 'medium' | 'low' | null;
  order: number;
  completedAt: string | null;
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
  goal?: Goal;
  domain?: Domain;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly';
  targetPerWeek: number | null;
  goalId: string | null;
  domainId: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  status: 'exploring' | 'researching' | 'practicing' | 'breakthrough' | 'ongoing' | 'archived';
  priority: 'high' | 'medium' | 'low';
  currentUnderstanding: string | null;
  actionPlan: string | null;
  relatedDomainId: string | null;
  goalId: string | null;
  order: number;
  isMock?: boolean;
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: TopicNote[];
  insights?: InsightNote[];
  readingItems?: ReadingItem[];
  _count?: { notes: number };
}

export interface TopicNote {
  id: string;
  topicId: string;
  userId: string;
  content: string;
  noteType: 'reflection' | 'insight' | 'breakthrough' | 'setback';
  createdAt: string;
}

export interface InsightNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string | null;
  category: string | null;
  topicId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingItem {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  type: 'book' | 'article' | 'video' | 'podcast' | 'course';
  status: 'want' | 'reading' | 'done' | 'abandoned';
  url: string | null;
  note: string | null;
  rating: number | null;
  topicId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vision {
  id: string;
  userId: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  userId: string;
  date: string;
  type: string;
  celebrations: string | null;
  improvements: string | null;
  tomorrow: string | null;
  content: string | null;
  mood: string | null;
  tags: string | null;
  domainId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodicReview {
  id: string;
  userId: string;
  period: string;
  startDate: string;
  endDate: string;
  achievements: string | null;
  challenges: string | null;
  insights: string | null;
  nextFocus: string | null;
  dataSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  title: string | null;
  company: string | null;
  relation: string | null;
  tags: string | null;
  notes: string | null;
  contactFreq: string | null;
  lastContact: string | null;
  domainId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  type: string;
  value: number;
  unit: string;
  note: string | null;
  recordedAt: string;
  createdAt: string;
}
