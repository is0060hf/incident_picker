// APIクライアント（モック用）
export const api = {
  urgencyRules: {
    list: async () => [],
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
  },
  impactRules: {
    list: async () => [],
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
  },
  channels: {
    list: async () => [],
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
  },
  incidents: {
    list: async (params?: any) => ({ incidents: [], total: 0, page: 1, totalPages: 1 }),
    get: async (id: string) => ({ 
      id,
      title: '',
      description: '',
      urgency: 'high' as 'high' | 'medium' | 'low',
      impact: 'high' as 'high' | 'medium' | 'low',
      type: '障害' as '障害' | '不具合',
      status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
      createdAt: new Date(),
    }),
    update: async (id: string, data: any) => ({ id, ...data }),
    getDetail: async (id: string) => ({ 
      incident: { 
        id, 
        title: '', 
        description: '', 
        urgency: 'high' as 'high' | 'medium' | 'low' | null, 
        impact: 'high' as 'high' | 'medium' | 'low' | null, 
        type: '障害' as '障害' | '不具合' | null,
        status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
        assignee: null,
        notes: null,
        urgencyManual: false,
        impactManual: false,
        channel: { name: '' },
        message: { raw: {} },
        createdAt: new Date(),
      },
      slackUrl: '',
      threadMessages: [],
    }),
    updateDetail: async (id: string, data: any) => ({ id, ...data }),
    getHistory: async (id: string) => ([]),
    exportData: async (id: string) => new Blob([JSON.stringify({ id })], { type: 'application/json' }),
  },
  dashboard: {
    getSummary: async () => ({ 
      total: 0, 
      open: 0, 
      inProgress: 0, 
      resolved: 0, 
      closed: 0,
      byType: { 障害: 0, 不具合: 0 },
    }),
    getDistribution: async () => ({
      urgency: { high: 0, medium: 0, low: 0, null: 0 },
      impact: { high: 0, medium: 0, low: 0, null: 0 },
      matrix: {},
    }),
    getTrends: async (from: Date, to: Date) => ({ daily: [] }),
    getRecentIncidents: async (limit: number) => ([]),
    getChannelStats: async () => ([]),
  },
  reports: {
    downloadIncidentReport: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.urgency) params.append('urgency', filters.urgency.join(','));
        if (filters.impact) params.append('impact', filters.impact.join(','));
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status.join(','));
        if (filters.channelId) params.append('channelId', filters.channelId);
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
      }
      
      const response = await fetch(`/api/reports/incidents?${params}`);
      if (!response.ok) throw new Error('Failed to download report');
      return await response.blob();
    },
    downloadChannelReport: async () => {
      const response = await fetch('/api/reports/channels');
      if (!response.ok) throw new Error('Failed to download report');
      return await response.blob();
    },
    downloadSummaryReport: async (from: string, to: string) => {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/api/reports/summary?${params}`);
      if (!response.ok) throw new Error('Failed to download report');
      return await response.blob();
    },
  },
  search: {
    searchIncidents: async (query: string, filters?: any) => {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      
      const response = await fetch(`/api/search/incidents?${params}`);
      if (!response.ok) throw new Error('Failed to search incidents');
      return await response.json();
    },
    searchMessages: async (query: string, filters?: any) => {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`/api/search/messages?${params}`);
      if (!response.ok) throw new Error('Failed to search messages');
      return await response.json();
    },
    getSuggestions: async (query: string) => {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/search/suggestions?${params}`);
      if (!response.ok) throw new Error('Failed to get suggestions');
      return await response.json();
    },
  },
  audit: {
    getLogs: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      
      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return await response.json();
    },
    getActionSummary: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      
      const response = await fetch(`/api/audit/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch action summary');
      return await response.json();
    },
    getUserActivity: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });
      }
      
      const response = await fetch(`/api/audit/activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch user activity');
      return await response.json();
    },
  },
};
