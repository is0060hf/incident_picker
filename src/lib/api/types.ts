// API関連の型定義
export type Urgency = 'high' | 'medium' | 'low';
export type Impact = 'high' | 'medium' | 'low';
export type IncidentType = '障害' | '不具合';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Rule {
  id: string;
  name: string;
  pattern: string;
  value: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  slackChannelId: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  urgency: Urgency | null;
  impact: Impact | null;
  type: IncidentType | null;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IncidentDetail extends Incident {
  assignee: string | null;
  notes: string | null;
  urgencyManual: boolean;
  impactManual: boolean;
  channel: { name: string };
  message: { raw: any };
}

export interface IncidentListParams {
  page?: number;
  urgency?: Urgency[];
  impact?: Impact[];
  type?: IncidentType;
  status?: IncidentStatus[];
  channelId?: string;
  q?: string;
}

export interface IncidentListResponse {
  incidents: Incident[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byType: {
    障害: number;
    不具合: number;
  };
}

export interface DashboardDistribution {
  urgency: Record<Urgency | 'null', number>;
  impact: Record<Impact | 'null', number>;
  matrix: Record<string, number>;
}

export interface FilterParams {
  urgency?: Urgency[];
  impact?: Impact[];
  type?: IncidentType;
  status?: IncidentStatus[];
  channelId?: string;
  from?: string;
  to?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string[];
  targetType?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}
