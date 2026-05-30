import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchClients, setFilters, clearFilters, selectFilteredClients } from './clientsSlice';
import Header from '../../shared/components/Header';
import { Loading, ErrorView, Empty } from '../../shared/components/StateViews';
import type { ClientStatus } from '../../shared/types';
import { t } from '../../shared/i18n';
import { formatRub } from '../../shared/utils/format';
import CustomSelect from '../../shared/ui/Select/CustomSelect';
import type { SelectOption } from '../../shared/ui/Select/CustomSelect';
import './ClientsPage.css';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: t.clients.allStatuses },
  { value: 'active', label: t.clients.active },
  { value: 'inactive', label: t.clients.inactive },
  { value: 'prospect', label: t.clients.prospect },
  { value: 'churned', label: t.clients.churned },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'default', label: t.clients.sortDefault },
  { value: 'newest', label: t.clients.sortNewest },
  { value: 'oldest', label: t.clients.sortOldest },
];

export default function ClientsPage() {
  const dispatch = useAppDispatch();
  const { loading, error, filters, items } = useAppSelector((s) => s.clients);
  const user = useAppSelector((s) => s.auth.user);
  const clients = useAppSelector(selectFilteredClients);

  // Manager filter options derived from the clients themselves, so any manager
  // (including newly created ones) with at least one client shows up here.
  const managerOptions = useMemo(() => {
    const byId = new Map<string, string>();
    items.forEach((c) => {
      if (c.managerId) byId.set(c.managerId, c.managerName);
    });
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  if (loading) return <Loading message={t.clients.loading} />;
  if (error) return <ErrorView message={error} onRetry={() => dispatch(fetchClients())} />;

  return (
    <div className="clients-page fade-in">
      <Header
        title={t.clients.title}
        subtitle={t.clients.clientCount(clients.length)}
        actions={
          <Link to="/clients/new" className="btn-primary">
            {t.clients.newClient}
          </Link>
        }
      />

      <div className="clients-filters">
        <input
          type="text"
          className="filter-search"
          placeholder={t.clients.searchPlaceholder}
          value={filters.search}
          onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
        />

        <CustomSelect
          className="filter-control"
          ariaLabel={t.clients.status}
          value={filters.status}
          onChange={(v) => dispatch(setFilters({ status: v as ClientStatus | 'all' }))}
          options={STATUS_OPTIONS}
        />

        {user?.role === 'admin' && (
          <CustomSelect
            className="filter-control"
            ariaLabel={t.clients.manager}
            value={filters.managerId}
            onChange={(v) => dispatch(setFilters({ managerId: v }))}
            options={[
              { value: '', label: t.clients.allManagers },
              ...managerOptions.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        )}

        <CustomSelect
          className="filter-control"
          ariaLabel={t.clients.sortBy}
          value={filters.dateSort}
          onChange={(v) => dispatch(setFilters({ dateSort: v as 'default' | 'newest' | 'oldest' }))}
          options={SORT_OPTIONS}
        />

        <button className="filter-clear" onClick={() => dispatch(clearFilters())}>
          {t.clients.clear}
        </button>
      </div>

      {clients.length === 0 ? (
        <Empty title={t.clients.noClients} message={t.clients.adjustFilters} />
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>{t.clients.name}</th>
                <th>{t.clients.company}</th>
                <th>{t.clients.status}</th>
                <th>{t.clients.manager}</th>
                <th>{t.clients.revenue}</th>
                <th>{t.clients.lastActivity}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <td data-label={t.clients.name}>
                    <Link to={`/clients/${c.id}`} className="client-name-link">
                      {c.name}
                    </Link>
                    <span className="client-email">{c.email}</span>
                  </td>
                  <td data-label={t.clients.company}>{c.company}</td>
                  <td data-label={t.clients.status}>
                    <span className={`status-badge status-${c.status}`}>
                      {t.clientStatus[c.status] ?? c.status}
                    </span>
                  </td>
                  <td data-label={t.clients.manager}>{c.managerName}</td>
                  <td data-label={t.clients.revenue} className="cell-mono">{formatRub(c.revenue)}</td>
                  <td data-label={t.clients.lastActivity} className="cell-muted">{c.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
