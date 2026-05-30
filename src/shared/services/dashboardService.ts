import type { DashboardData, RevenuePoint, ActivityPoint } from '../types';
import { getClients, getLeads } from './storageService';
import { formatRub } from '../utils/format';

/**
 * Build a 6-month revenue series ending at the current month.
 * Each client's revenue is attributed to the month of its createdAt date
 * (if within the window); remaining revenue goes to the current month.
 */
function buildRevenueSeries(clients: { revenue: number; createdAt: string }[]): RevenuePoint[] {
  const now = new Date();
  const months: RevenuePoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ month: label, revenue: 0, target: 0, _key: key } as RevenuePoint & { _key: string });
  }

  const keySet = new Set(months.map((m) => (m as RevenuePoint & { _key: string })._key));

  for (const c of clients) {
    if (c.revenue <= 0) continue;
    const cKey = c.createdAt.slice(0, 7); // "YYYY-MM"
    const bucket = months.find((m) => (m as RevenuePoint & { _key: string })._key === cKey);
    if (bucket) {
      bucket.revenue += c.revenue;
    } else if (keySet.size > 0) {
      // Attribute to the latest month if outside the window
      months[months.length - 1].revenue += c.revenue;
    }
  }

  // Set target as 90% of max revenue (simple heuristic)
  const maxRev = Math.max(...months.map((m) => m.revenue), 1);
  for (const m of months) {
    m.target = Math.round(maxRev * 0.9);
  }

  // Strip internal _key
  return months.map(({ month, revenue, target }) => ({ month, revenue, target }));
}

/**
 * Build a weekday activity series derived from leads.
 * "calls" = new leads, "emails" = contacted leads, "meetings" = qualified+ leads,
 * bucketed by the day-of-week of their createdAt date.
 */
function buildActivitySeries(leads: { status: string; createdAt: string }[]): ActivityPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const map: Record<string, { calls: number; emails: number; meetings: number }> = {};
  for (const d of days) map[d] = { calls: 0, emails: 0, meetings: 0 };

  for (const l of leads) {
    const date = new Date(l.createdAt);
    const dow = date.getDay(); // 0=Sun
    if (dow === 0 || dow === 6) continue; // skip weekends
    const dayLabel = days[dow - 1];
    if (l.status === 'new') map[dayLabel].calls++;
    else if (l.status === 'contacted') map[dayLabel].emails++;
    else map[dayLabel].meetings++; // qualified, proposal, won
  }

  return days.map((d) => ({ day: d, ...map[d] }));
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const clients = getClients();
  const leads = getLeads();

  // KPI: Total Revenue
  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);

  // KPI: Active Clients
  const activeClients = clients.filter((c) => c.status === 'active').length;

  // KPI: Conversion Rate
  // A won lead is converted into a client and then removed from the pipeline, so
  // counting `status === 'won'` leads is unreliable (usually 0). Instead we count
  // clients flagged `convertedFromLead` as the durable record of a win. Any lead
  // still marked 'won' (a transient state mid-animation) is added too — it can't
  // double-count, because a converted lead is deleted right after its client is created.
  const convertedClients = clients.filter((c) => c.convertedFromLead).length;
  const wonLeads = leads.filter((l) => l.status === 'won').length;
  const wonCount = convertedClients + wonLeads;
  // Denominator = everything that entered the pipeline: leads still open + leads
  // that already converted away into clients.
  const pipelineTotal = leads.length + convertedClients;
  const conversionRate = pipelineTotal > 0 ? (wonCount / pipelineTotal) * 100 : 0;

  // KPI: Avg Deal Size
  const leadsWithValue = leads.filter((l) => l.value > 0);
  const avgDealSize =
    leadsWithValue.length > 0
      ? leadsWithValue.reduce((sum, l) => sum + l.value, 0) / leadsWithValue.length
      : 0;

  // Conversion funnel: count leads by status; the "won" stage reflects real
  // conversions (converted clients) rather than leftover won leads.
  const statusOrder = ['new', 'contacted', 'qualified', 'proposal', 'won'] as const;
  const conversion = statusOrder.map((stage) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: stage === 'won' ? wonCount : leads.filter((l) => l.status === stage).length,
  }));

  return {
    kpis: [
      {
        label: 'Total Revenue',
        value: formatRub(totalRevenue),
        change: 0,
        trend: 'flat',
      },
      {
        label: 'Active Clients',
        value: activeClients,
        change: 0,
        trend: 'flat',
      },
      {
        label: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: 0,
        trend: 'flat',
      },
      {
        label: 'Avg Deal Size',
        value: formatRub(Math.round(avgDealSize)),
        change: 0,
        trend: 'flat',
      },
    ],
    revenue: buildRevenueSeries(clients),
    conversion,
    activity: buildActivitySeries(leads),
  };
}
