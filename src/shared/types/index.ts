/* ── Domain types ── */

export type Role = 'admin' | 'manager';

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  role: Role;
  avatar: string;
  temporaryPassword?: boolean;
}

/* ── Clients ── */

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'churned';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  managerId: string;
  managerName: string;
  createdAt: string;
  lastActivity: string;
  revenue: number;
  notes: string;
  /** Set when the client was created by converting a won lead. */
  convertedFromLead?: boolean;
  /** Id of the source lead, if converted from one. */
  sourceLeadId?: string;
}

/* ── Leads ── */

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  value: number;
  managerId: string;
  managerName: string;
  createdAt: string;
  notes: string;
}

/* ── Dashboard ── */

export interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'flat';
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export interface ConversionPoint {
  stage: string;
  count: number;
}

export interface ActivityPoint {
  day: string;
  calls: number;
  emails: number;
  meetings: number;
}

export interface DashboardData {
  kpis: KPI[];
  revenue: RevenuePoint[];
  conversion: ConversionPoint[];
  activity: ActivityPoint[];
}

/* ── Filters ── */

export interface ClientFilters {
  status: ClientStatus | 'all';
  managerId: string;
  dateSort: 'default' | 'newest' | 'oldest';
  search: string;
}
