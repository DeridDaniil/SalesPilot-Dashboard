import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardData } from '../../shared/types';
import { fetchDashboardData } from '../../shared/services/dashboardService';
import { useAppSelector } from '../../app/hooks';
import Header from '../../shared/components/Header';
import { Loading, ErrorView } from '../../shared/components/StateViews';
import { t } from '../../shared/i18n';
import { formatRub, formatRubCompact } from '../../shared/utils/format';
import './DashboardPage.css';

const KPI_LABELS: Record<string, string> = {
  'Total Revenue': t.dashboard.totalRevenue,
  'Active Clients': t.dashboard.activeClients,
  'Conversion Rate': t.dashboard.conversionRate,
  'Avg Deal Size': t.dashboard.avgDealSize,
};

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchDashboardData()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <Loading message={t.dashboard.loading} />;
  if (error) return <ErrorView message={error} onRetry={retry} />;
  if (!data) return null;

  const revenueLocalized = data.revenue.map((d) => ({
    ...d,
    month: t.month[d.month] ?? d.month,
  }));

  const conversionLocalized = data.conversion.map((d) => ({
    ...d,
    stage: t.funnelStage[d.stage] ?? d.stage,
  }));

  const activityLocalized = data.activity.map((d) => ({
    ...d,
    day: t.day[d.day] ?? d.day,
  }));

  return (
    <div className="dashboard-page fade-in">
      <Header
        title={`${t.dashboard.welcome}, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle={t.dashboard.subtitle}
      />

      {/* ── KPI Cards ── */}
      <div className="kpi-row">
        {data.kpis.map((kpi, i) => (
          <div
            className={`kpi-card kpi-card--${kpi.trend}`}
            key={kpi.label}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="kpi-label">{KPI_LABELS[kpi.label] ?? kpi.label}</span>
            <span className="kpi-value">{kpi.value}</span>
            <span className={`kpi-change kpi-change--${kpi.trend}`}>
              {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
              {' '}{Math.abs(kpi.change)}%
            </span>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="charts-grid">
        {/* Revenue vs Target */}
        <div className="chart-card chart-card--wide">
          <h3 className="chart-title">{t.dashboard.revenueVsTarget}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueLocalized} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#404040" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#a3a3a3', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v) => formatRubCompact(Number(v))}
              />
              <Tooltip
                contentStyle={{ background: '#262626', border: '1px solid #404040', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#a3a3a3' }}
                formatter={(value) => formatRub(Number(value))}
              />
              <Area type="monotone" dataKey="revenue" name={t.dashboard.revenueSeries} stroke="#f59e0b" strokeWidth={2} fill="url(#gRevenue)" />
              <Line type="monotone" dataKey="target" name={t.dashboard.targetSeries} stroke="#a3a3a3" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="chart-card">
          <h3 className="chart-title">{t.dashboard.conversionFunnel}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={conversionLocalized} layout="vertical" margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
              <CartesianGrid stroke="#404040" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="stage" type="category" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: '#262626', border: '1px solid #404040', borderRadius: 8, fontSize: 13 }}
              />
              <Bar dataKey="count" name={t.dashboard.leadsSeries} fill="#4f8ff7" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity */}
        <div className="chart-card">
          <h3 className="chart-title">{t.dashboard.weeklyActivity}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={activityLocalized} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#404040" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#262626', border: '1px solid #404040', borderRadius: 8, fontSize: 13 }}
              />
              <Line type="monotone" dataKey="calls" name={t.dashboard.calls} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="emails" name={t.dashboard.emails} stroke="#4f8ff7" strokeWidth={2} dot={{ r: 3, fill: '#4f8ff7' }} />
              <Line type="monotone" dataKey="meetings" name={t.dashboard.meetings} stroke="#2dd4a0" strokeWidth={2} dot={{ r: 3, fill: '#2dd4a0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
