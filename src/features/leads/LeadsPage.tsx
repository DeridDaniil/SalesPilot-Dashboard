import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchLeads, updateLead, deleteLead, selectVisibleLeads } from './leadsSlice';
import { createClient, updateClient, fetchClients } from '../clients/clientsSlice';
import Header from '../../shared/components/Header';
import { Loading, ErrorView, Empty } from '../../shared/components/StateViews';
import type { LeadStatus } from '../../shared/types';
import { t } from '../../shared/i18n';
import { fetchClientByEmail } from '../../shared/services/clientsService';
import { formatRub } from '../../shared/utils/format';
import CustomSelect from '../../shared/ui/Select/CustomSelect';
import './LeadsPage.css';

const SOURCE_LABELS: Record<string, string> = {
  Website: 'Сайт',
  LinkedIn: 'LinkedIn',
  Referral: 'Рекомендация',
  'Trade Show': 'Выставка',
  'Cold Call': 'Холодный звонок',
  Webinar: 'Вебинар',
  Other: 'Другое',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'var(--blue)',
  contacted: 'var(--cyan)',
  qualified: 'var(--primary)',
  proposal: 'var(--warning)',
  won: 'var(--success)',
  lost: 'var(--danger)',
};

const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.leads);
  const leads = useAppSelector(selectVisibleLeads);

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedId, setConvertedId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  // FLIP: after the DOM updates (e.g. a lead was removed), translate each remaining
  // card from its previous position to 0, producing a smooth reflow animation.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const prevRects = rectsRef.current;
    if (!grid || prevRects.size === 0) return;

    grid.querySelectorAll<HTMLElement>('[data-lead-id]').forEach((el) => {
      const id = el.dataset.leadId;
      if (!id) return;
      const prev = prevRects.get(id);
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
        const clear = () => {
          el.style.transition = '';
          el.removeEventListener('transitionend', clear);
        };
        el.addEventListener('transitionend', clear);
      });
    });

    rectsRef.current = new Map();
  }, [leads]);

  const snapshotPositions = () => {
    const map = new Map<string, DOMRect>();
    gridRef.current?.querySelectorAll<HTMLElement>('[data-lead-id]').forEach((el) => {
      const id = el.dataset.leadId;
      if (id) map.set(id, el.getBoundingClientRect());
    });
    rectsRef.current = map;
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // Update lead status
    await dispatch(updateLead({ id: leadId, payload: { status: newStatus } }));

    // If won → convert to client
    if (newStatus === 'won') {
      setConvertingId(leadId);

      // Check for duplicate client by email
      const existingClient = await fetchClientByEmail(lead.email);

      // Durable conversion markers so the dashboard counts this win even after
      // the source lead is removed from the pipeline.
      if (!existingClient) {
        await dispatch(
          createClient({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            status: 'active',
            managerId: lead.managerId,
            managerName: lead.managerName,
            revenue: lead.value,
            lastActivity: new Date().toISOString().slice(0, 10),
            notes: `Конвертирован из лида. Источник: ${SOURCE_LABELS[lead.source] ?? lead.source}. ${lead.notes}`,
            convertedFromLead: true,
            sourceLeadId: lead.id,
          }),
        );
      } else {
        // Client with this email already exists — mark it as converted instead of
        // creating a duplicate, so the conversion still reaches the dashboard.
        await dispatch(
          updateClient({
            id: existingClient.id,
            payload: { convertedFromLead: true, sourceLeadId: lead.id },
          }),
        );
      }
      dispatch(fetchClients());

      // Win → pulse overlay → collapse card → FLIP-reflow remaining cards
      setConvertedId(leadId);
      setTimeout(() => {
        setLeavingId(leadId);
        setTimeout(() => {
          snapshotPositions();
          dispatch(deleteLead(leadId));
          setConvertingId(null);
          setConvertedId(null);
          setLeavingId(null);
        }, 480);
      }, 1700);
    }
  };

  if (loading) return <Loading message={t.leads.loading} />;
  if (error) return <ErrorView message={error} onRetry={() => dispatch(fetchLeads())} />;

  return (
    <div className="leads-page fade-in">
      <Header
        title={t.leads.title}
        subtitle={t.leads.leadCount(leads.length)}
        actions={
          <Link to="/leads/new" className="btn-primary">
            {t.leads.newLead}
          </Link>
        }
      />

      {leads.length === 0 ? (
        <Empty title={t.leads.noLeads} message={t.leads.createFirst} />
      ) : (
        <div className="leads-grid" ref={gridRef}>
          {leads.map((lead, i) => {
            const isConverting = convertingId === lead.id;
            const isConverted = convertedId === lead.id;
            const isLeaving = leavingId === lead.id;
            const cardClass = [
              'lead-card',
              isConverted && 'lead-card--converted',
              isLeaving && 'lead-card--leaving',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                className={cardClass}
                key={lead.id}
                data-lead-id={lead.id}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {isConverted && (
                  <div className="lead-converted-overlay">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t.leads.convertedToClient}</span>
                  </div>
                )}

                <div className="lead-card-header">
                  <span
                    className="lead-status-dot"
                    style={{ background: STATUS_COLORS[lead.status] }}
                  />
                  <CustomSelect
                    variant="ghost"
                    size="sm"
                    ariaLabel={t.leads.statusLabel}
                    value={lead.status}
                    onChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                    disabled={isConverting || lead.status === 'won'}
                    triggerStyle={{ color: STATUS_COLORS[lead.status] }}
                    options={STATUS_OPTIONS.map((s) => ({ value: s, label: t.leadStatus[s] ?? s }))}
                  />
                  <span className="lead-value">{formatRub(lead.value)}</span>
                </div>

                <h3 className="lead-name">{lead.name}</h3>
                <p className="lead-company">{lead.company}</p>

                <div className="lead-meta">
                  <span>{t.leads.source}: {SOURCE_LABELS[lead.source] ?? lead.source}</span>
                  <span>{lead.managerName}</span>
                </div>

                <div className="lead-actions">
                  {lead.status !== 'won' && (
                    <Link to={`/leads/${lead.id}/edit`} className="btn-sm">
                      {t.leads.edit}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
