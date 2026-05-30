import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createLead, updateLead, fetchLeadById, clearSelectedLead } from './leadsSlice';
import { fetchUsersThunk, selectManagers } from '../auth/authSlice';
import type { Lead, LeadStatus, User } from '../../shared/types';
import Header from '../../shared/components/Header';
import { Loading, ErrorView } from '../../shared/components/StateViews';
import CustomSelect from '../../shared/ui/Select/CustomSelect';
import { t } from '../../shared/i18n';
import './LeadForm.css';

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
// "won" is reachable only via the leads board (where it converts to a client),
// so it stays disabled in the form to keep status and client list consistent.
const WON_STATUS: LeadStatus = 'won';
const SOURCES = ['Website', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Webinar', 'Other'] as const;

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  value?: string;
  manager?: string;
}

export default function LeadForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { selectedLead, detailLoading, saving, error } = useAppSelector((s) => s.leads);
  const managers = useAppSelector(selectManagers);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchLeadById(id));
    }
    return () => { dispatch(clearSelectedLead()); };
  }, [dispatch, id, isEditing]);

  // Admin needs the manager list to assign a responsible manager.
  useEffect(() => {
    if (isAdmin) dispatch(fetchUsersThunk());
  }, [dispatch, isAdmin]);

  if (isEditing && detailLoading) return <Loading message={t.leads.loadingLead} />;
  if (isEditing && error && !selectedLead) return <ErrorView message={t.leads.notFound} />;
  if (isEditing && !selectedLead) return <Loading message={t.leads.loadingLead} />;

  if (isEditing && selectedLead && user?.role === 'manager' && selectedLead.managerId !== user.id) {
    return <ErrorView message={t.leads.accessDenied} />;
  }

  return (
    <div className="lead-form-page fade-in">
      <Header
        title={isEditing ? t.leads.editLead : t.leads.newLeadTitle}
        subtitle={isEditing ? selectedLead?.name : t.leads.addNewSubtitle}
        actions={
          <button className="btn-cancel" onClick={() => navigate('/leads')}>
            {t.leads.cancel}
          </button>
        }
      />

      <LeadFormInner
        key={selectedLead?.id ?? 'new'}
        isEditing={isEditing}
        id={id}
        selectedLead={selectedLead}
        saving={saving}
        user={user}
        managers={managers}
        dispatch={dispatch}
        navigate={navigate}
      />
    </div>
  );
}

interface LeadFormInnerProps {
  isEditing: boolean;
  id: string | undefined;
  selectedLead: Lead | null;
  saving: boolean;
  user: { id: string; name: string; role: string } | null;
  managers: User[];
  dispatch: ReturnType<typeof useAppDispatch>;
  navigate: ReturnType<typeof useNavigate>;
}

function LeadFormInner({ isEditing, id, selectedLead, saving, user, managers, dispatch, navigate }: LeadFormInnerProps) {
  const isAdmin = user?.role === 'admin';
  const [name, setName] = useState(selectedLead?.name ?? '');
  const [email, setEmail] = useState(selectedLead?.email ?? '');
  const [phone, setPhone] = useState(selectedLead?.phone ?? '');
  const [company, setCompany] = useState(selectedLead?.company ?? '');
  const [status, setStatus] = useState<LeadStatus>(selectedLead?.status ?? 'new');
  const [source, setSource] = useState(selectedLead?.source ?? 'Website');
  const [value, setValue] = useState(selectedLead ? String(selectedLead.value) : '');
  const [notes, setNotes] = useState(selectedLead?.notes ?? '');
  const [managerId, setManagerId] = useState<string>(
    selectedLead?.managerId ?? (isAdmin ? '' : user?.id ?? ''),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = t.leads.nameRequired;
    if (!email.trim()) next.email = t.leads.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.leads.invalidEmail;
    if (!company.trim()) next.company = t.leads.companyRequired;
    if (!value.trim() || isNaN(Number(value)) || Number(value) < 0)
      next.value = t.leads.invalidValue;
    if (isAdmin && !managerId) next.manager = t.leads.managerRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitError(null);

    if (isEditing && selectedLead && user.role === 'manager' && selectedLead.managerId !== user.id) {
      setSubmitError(t.leads.cannotEditOther);
      return;
    }

    // Guard against ever persisting a "won" lead from the form — winning is
    // done on the leads board, which also creates the client.
    const safeStatus: LeadStatus = status === WON_STATUS ? (selectedLead?.status ?? 'new') : status;

    // Admin assigns a responsible manager from the list; managers always own
    // the records they create/edit themselves.
    const resolvedManagerId = isAdmin
      ? managerId
      : isEditing && selectedLead ? selectedLead.managerId : user.id;
    const resolvedManagerName = isAdmin
      ? managers.find((m) => m.id === managerId)?.name ?? selectedLead?.managerName ?? ''
      : isEditing && selectedLead ? selectedLead.managerName : user.name;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      status: safeStatus,
      source,
      value: Number(value),
      managerId: resolvedManagerId,
      managerName: resolvedManagerName,
      notes: notes.trim(),
    };

    const result = isEditing && id
      ? await dispatch(updateLead({ id, payload }))
      : await dispatch(createLead(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/leads');
    } else {
      setSubmitError(
        (result as { error?: { message?: string } }).error?.message ?? t.leads.saveFailed,
      );
    }
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">{t.leads.name}</span>
          <input
            className={`field-input ${errors.name ? 'field-input--error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.leads.contactName}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label className="field">
          <span className="field-label">{t.leads.email}</span>
          <input
            type="email"
            className={`field-input ${errors.email ? 'field-input--error' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@company.com"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>

        <label className="field">
          <span className="field-label">{t.leads.phone}</span>
          <input
            className="field-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 000-0000"
          />
        </label>

        <label className="field">
          <span className="field-label">{t.leads.company}</span>
          <input
            className={`field-input ${errors.company ? 'field-input--error' : ''}`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Название компании"
          />
          {errors.company && <span className="field-error">{errors.company}</span>}
        </label>

        <CustomSelect
          fullWidth
          label={t.leads.statusLabel}
          value={status}
          onChange={(v) => setStatus(v as LeadStatus)}
          options={LEAD_STATUSES.map((s) => ({
            value: s,
            label: t.leadStatus[s] ?? s,
            disabled: s === WON_STATUS,
          }))}
          helperText={t.leads.wonHint}
        />

        <CustomSelect
          fullWidth
          label={t.leads.sourceLabel}
          value={source}
          onChange={(v) => setSource(v)}
          options={SOURCES.map((s) => ({ value: s, label: t.leadSource[s] ?? s }))}
        />

        {isAdmin && (
          <CustomSelect
            fullWidth
            label={`${t.leads.responsibleManager} *`}
            placeholder={t.leads.managerRequired}
            value={managerId}
            onChange={(v) => setManagerId(v)}
            options={managers.map((m) => ({ value: m.id, label: m.name }))}
            error={errors.manager}
          />
        )}

        <label className="field">
          <span className="field-label">{t.leads.dealValue}</span>
          <input
            type="number"
            className={`field-input ${errors.value ? 'field-input--error' : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            min="0"
          />
          {errors.value && <span className="field-error">{errors.value}</span>}
        </label>
      </div>

      <label className="field field-full">
        <span className="field-label">{t.leads.notesLabel}</span>
        <textarea
          className="field-input field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.leads.notesPlaceholder}
          rows={4}
        />
      </label>

      <div className="form-actions">
        {submitError && <span className="field-error">{submitError}</span>}
        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? t.leads.saving : isEditing ? t.leads.updateLead : t.leads.createLead}
        </button>
      </div>
    </form>
  );
}
