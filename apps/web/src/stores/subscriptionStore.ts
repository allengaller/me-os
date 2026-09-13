import { create } from 'zustand';
import api from '../lib/api';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export interface QuotaUtilization {
  id: string;
  name: string;
  unit: string;
  used: number;
  limit: number;
  utilization: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface SubscriptionSummary {
  id: string;
  name: string;
  provider: string;
  monthlyCost: number;
  currency: string;
  overallUtilization: number;
  quotaUtilization: QuotaUtilization[];
  daysUntilRenewal: number;
  isActive: boolean;
  autoRenew: boolean;
  mock?: boolean;
}

export interface Subscription {
  id: string;
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
  config?: Record<string, unknown>;
  quotas: QuotaDefinition[];
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface QuotaUsage {
  id: string;
  monthlyUsageId: string;
  quotaDefinitionId: string;
  usedAmount: number;
  quotaDefinition?: QuotaDefinition;
}

export interface MonthlyUsage {
  id: string;
  subscriptionId: string;
  year: number;
  month: number;
  notes?: string;
  quotaUsages: QuotaUsage[];
}

export interface DashboardData {
  subscriptions: SubscriptionSummary[];
  stats: {
    totalMonthlySpend: number;
    activeCount: number;
    nearLimitCount: number;
    criticalCount: number;
  };
}

interface SubscriptionState {
  subscriptions: Subscription[];
  currentSubscription: Subscription | null;
  currentUsage: MonthlyUsage | null;
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  createSubscription: (data: Partial<Subscription>) => Promise<Subscription>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  addQuota: (subscriptionId: string, data: Partial<QuotaDefinition>) => Promise<QuotaDefinition>;
  updateQuota: (subscriptionId: string, quotaId: string, data: Partial<QuotaDefinition>) => Promise<QuotaDefinition>;
  deleteQuota: (subscriptionId: string, quotaId: string) => Promise<void>;
  recordUsage: (subscriptionId: string, year: number, month: number, data: { notes?: string; quotaUsages: { quotaDefinitionId: string; usedAmount: number }[] }) => Promise<MonthlyUsage>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, _get) => ({
  subscriptions: [],
  currentSubscription: null,
  currentUsage: null,
  dashboard: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/subscriptions');
      set({ subscriptions: response.data.subscriptions, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  fetchOne: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/subscriptions/${id}`);
      set({
        currentSubscription: response.data.subscription,
        currentUsage: response.data.currentUsage,
        loading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/subscriptions/dashboard/summary');
      set({ dashboard: response.data, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  createSubscription: async (data) => {
    const response = await api.post('/subscriptions', data);
    const newSub = response.data.subscription;
    set((state) => ({
      subscriptions: [newSub, ...state.subscriptions],
    }));
    return newSub;
  },

  updateSubscription: async (id, data) => {
    const response = await api.patch(`/subscriptions/${id}`, data);
    const updated = response.data.subscription;
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
      currentSubscription: state.currentSubscription?.id === id ? updated : state.currentSubscription,
    }));
    return updated;
  },

  deleteSubscription: async (id) => {
    await api.delete(`/subscriptions/${id}`);
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
      currentSubscription: state.currentSubscription?.id === id ? null : state.currentSubscription,
    }));
  },

  addQuota: async (subscriptionId, data) => {
    const response = await api.post(`/subscriptions/${subscriptionId}/quotas`, data);
    return response.data.quota;
  },

  updateQuota: async (subscriptionId, quotaId, data) => {
    const response = await api.patch(`/subscriptions/${subscriptionId}/quotas/${quotaId}`, data);
    return response.data.quota;
  },

  deleteQuota: async (subscriptionId, quotaId) => {
    await api.delete(`/subscriptions/${subscriptionId}/quotas/${quotaId}`);
  },

  recordUsage: async (subscriptionId, year, month, data) => {
    const response = await api.post(`/subscriptions/${subscriptionId}/usage/${year}/${month}`, data);
    return response.data.monthlyUsage;
  },
}));
