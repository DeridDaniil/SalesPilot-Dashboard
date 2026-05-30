import { describe, it, expect, beforeEach } from 'vitest';
import { setClients, setLeads } from './storageService';
import { fetchDashboardData } from './dashboardService';
import type { Client, Lead } from '../types';

function makeLead(id: string, status: Lead['status']): Lead {
  return {
    id,
    name: `Лид ${id}`,
    email: `${id}@example.ru`,
    phone: '+7 (900) 000-00-00',
    company: 'Тест',
    status,
    source: 'Website',
    value: 100000,
    managerId: 'u2',
    managerName: 'Анна Кузнецова',
    createdAt: '2026-01-15',
    notes: '',
  };
}

function makeClient(id: string, convertedFromLead: boolean): Client {
  return {
    id,
    name: `Клиент ${id}`,
    email: `${id}@example.ru`,
    phone: '+7 (900) 000-00-00',
    company: 'Тест',
    status: 'active',
    managerId: 'u2',
    managerName: 'Анна Кузнецова',
    createdAt: '2026-01-15',
    lastActivity: '2026-02-01',
    revenue: 500000,
    notes: '',
    ...(convertedFromLead ? { convertedFromLead: true, sourceLeadId: 'lX' } : {}),
  };
}

describe('dashboardService — conversion rate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('counts converted clients as wins even after the won lead is removed from the pipeline', async () => {
    // 3 open leads remain, none marked "won"; 1 client was converted from a (now-deleted) lead.
    setLeads([makeLead('l1', 'new'), makeLead('l2', 'contacted'), makeLead('l3', 'qualified')]);
    setClients([makeClient('c1', true), makeClient('c2', false)]);

    const data = await fetchDashboardData();

    // wonCount = 1 converted client; pipelineTotal = 3 leads + 1 converted = 4 → 25.0%
    const conv = data.kpis.find((k) => k.label === 'Conversion Rate');
    expect(conv?.value).toBe('25.0%');

    // The funnel "Won" stage reflects the real conversion, not the 0 leftover won leads.
    const wonStage = data.conversion.find((s) => s.stage === 'Won');
    expect(wonStage?.count).toBe(1);
  });

  it('reports 0% when there are no leads and no conversions', async () => {
    setLeads([]);
    setClients([makeClient('c1', false)]);

    const data = await fetchDashboardData();
    expect(data.kpis.find((k) => k.label === 'Conversion Rate')?.value).toBe('0.0%');
    expect(data.conversion.find((s) => s.stage === 'Won')?.count).toBe(0);
  });
});
