import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchClientById } from './clientsSlice';
import Header from '../../shared/components/Header';
import { Loading, ErrorView } from '../../shared/components/StateViews';
import { t } from '../../shared/i18n';
import { formatRub } from '../../shared/utils/format';
import './ClientDetailsPage.css';

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { selectedClient: client, detailLoading, error } = useAppSelector((s) => s.clients);

  useEffect(() => {
    if (id) dispatch(fetchClientById(id));
  }, [dispatch, id]);

  if (detailLoading) return <Loading message={t.clients.loadingClient} />;
  if (error && !client) return <ErrorView message={t.clients.notFound} />;
  if (!client) return <Loading message={t.clients.loadingClient} />;

  if (user?.role === 'manager' && client.managerId !== user.id) {
    return <ErrorView message={t.clients.accessDenied} />;
  }

  return (
    <div className="client-details fade-in">
      <Header
        title={client.name}
        subtitle={client.company}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to={`/clients/${client.id}/edit`} className="btn-primary">
              {t.clients.edit}
            </Link>
            <Link to="/clients" className="btn-back">
              &larr; {t.clients.backToClients}
            </Link>
          </div>
        }
      />

      <div className="detail-grid">
        <div className="detail-card detail-card--info">
          <h3 className="detail-card-title">{t.clients.contactInfo}</h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">{t.clients.email}</span>
              <span className="detail-value">{client.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.clients.phone}</span>
              <span className="detail-value">{client.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.clients.company}</span>
              <span className="detail-value">{client.company}</span>
            </div>
          </div>
        </div>

        <div className="detail-card detail-card--status">
          <h3 className="detail-card-title">{t.clients.accountDetails}</h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">{t.clients.status}</span>
              <span className={`status-badge status-${client.status}`}>
                {t.clientStatus[client.status] ?? client.status}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.clients.manager}</span>
              <span className="detail-value">{client.managerName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.clients.clientSince}</span>
              <span className="detail-value">{client.createdAt}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t.clients.lastActivity}</span>
              <span className="detail-value">{client.lastActivity}</span>
            </div>
          </div>
        </div>

        <div className="detail-card detail-card--revenue">
          <h3 className="detail-card-title">{t.clients.revenue}</h3>
          <div className="revenue-display">
            <span className="revenue-amount">{formatRub(client.revenue)}</span>
            <span className="revenue-label">{t.clients.totalLifetimeValue}</span>
          </div>
        </div>

        <div className="detail-card detail-card--notes">
          <h3 className="detail-card-title">{t.clients.notes}</h3>
          <p className="notes-text">{client.notes || t.clients.noNotes}</p>
        </div>
      </div>
    </div>
  );
}
