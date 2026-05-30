import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createClient, updateClient, fetchClientById, clearSelectedClient } from './clientsSlice';
import { fetchUsersThunk, selectManagers } from '../auth/authSlice';
import type { Client, ClientStatus, User } from '../../shared/types';
import Header from '../../shared/components/Header';
import { Loading, ErrorView } from '../../shared/components/StateViews';
import CustomSelect from '../../shared/ui/Select/CustomSelect';
import { t } from '../../shared/i18n';
import './ClientForm.css';

const CLIENT_STATUSES: ClientStatus[] = ['active', 'inactive', 'prospect', 'churned'];

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  manager?: string;
}

export default function ClientForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { selectedClient, detailLoading, saving, error } = useAppSelector((s) => s.clients);
  const managers = useAppSelector(selectManagers);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchClientById(id));
    }
    return () => { dispatch(clearSelectedClient()); };
  }, [dispatch, id, isEditing]);

  // Admin needs the manager list to assign a responsible manager.
  useEffect(() => {
    if (isAdmin) dispatch(fetchUsersThunk());
  }, [dispatch, isAdmin]);

  if (isEditing && detailLoading) return <Loading message={t.clients.loadingClient} />;
  if (isEditing && error && !selectedClient) return <ErrorView message={t.clients.notFound} />;
  if (isEditing && !selectedClient) return <Loading message={t.clients.loadingClient} />;

  if (isEditing && selectedClient && user?.role === 'manager' && selectedClient.managerId !== user.id) {
    return <ErrorView message={t.clients.accessDenied} />;
  }

  return (
    <div className="client-form-page fade-in">
      <Header
        title={isEditing ? t.clients.editClient : t.clients.newClientTitle}
        subtitle={isEditing ? selectedClient?.name : t.clients.addNewClientSubtitle}
        actions={
          <button className="btn-cancel" onClick={() => navigate('/clients')}>
            {t.clients.cancel}
          </button>
        }
      />

      <ClientFormInner
        key={selectedClient?.id ?? 'new'}
        isEditing={isEditing}
        id={id}
        selectedClient={selectedClient}
        saving={saving}
        user={user}
        managers={managers}
        dispatch={dispatch}
        navigate={navigate}
      />
    </div>
  );
}

interface ClientFormInnerProps {
  isEditing: boolean;
  id: string | undefined;
  selectedClient: Client | null;
  saving: boolean;
  user: { id: string; name: string; role: string } | null;
  managers: User[];
  dispatch: ReturnType<typeof useAppDispatch>;
  navigate: ReturnType<typeof useNavigate>;
}

function ClientFormInner({ isEditing, id, selectedClient, saving, user, managers, dispatch, navigate }: ClientFormInnerProps) {
  const isAdmin = user?.role === 'admin';
  const [name, setName] = useState(selectedClient?.name ?? '');
  const [email, setEmail] = useState(selectedClient?.email ?? '');
  const [phone, setPhone] = useState(selectedClient?.phone ?? '');
  const [company, setCompany] = useState(selectedClient?.company ?? '');
  const [status, setStatus] = useState<ClientStatus>(selectedClient?.status ?? 'prospect');
  const [revenue, setRevenue] = useState(selectedClient ? String(selectedClient.revenue) : '0');
  const [notes, setNotes] = useState(selectedClient?.notes ?? '');
  const [managerId, setManagerId] = useState<string>(
    selectedClient?.managerId ?? (isAdmin ? '' : user?.id ?? ''),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = t.clients.nameRequired;
    if (!email.trim()) next.email = t.clients.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.clients.invalidEmail;
    if (!company.trim()) next.company = t.clients.companyRequired;
    if (isAdmin && !managerId) next.manager = t.clients.managerRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitError(null);

    if (isEditing && selectedClient && user.role === 'manager' && selectedClient.managerId !== user.id) {
      setSubmitError(t.clients.cannotEditOther);
      return;
    }

    // Admin assigns a responsible manager from the list; managers always own
    // the records they create/edit themselves.
    const resolvedManagerId = isAdmin
      ? managerId
      : isEditing && selectedClient ? selectedClient.managerId : user.id;
    const resolvedManagerName = isAdmin
      ? managers.find((m) => m.id === managerId)?.name ?? selectedClient?.managerName ?? ''
      : isEditing && selectedClient ? selectedClient.managerName : user.name;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      status,
      managerId: resolvedManagerId,
      managerName: resolvedManagerName,
      lastActivity: new Date().toISOString().slice(0, 10),
      revenue: Number(revenue) || 0,
      notes: notes.trim(),
    };

    const result = isEditing && id
      ? await dispatch(updateClient({ id, payload }))
      : await dispatch(createClient(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/clients');
    } else {
      setSubmitError(
        (result as { error?: { message?: string } }).error?.message ?? t.clients.saveFailed,
      );
    }
  };

  return (
    <form className="client-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">{t.clients.nameField}</span>
          <input
            className={`field-input ${errors.name ? 'field-input--error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.clients.contactName}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label className="field">
          <span className="field-label">{t.clients.emailField}</span>
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
          <span className="field-label">{t.clients.phoneField}</span>
          <input
            className="field-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 000-0000"
          />
        </label>

        <label className="field">
          <span className="field-label">{t.clients.companyField}</span>
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
          label={t.clients.statusLabel}
          value={status}
          onChange={(v) => setStatus(v as ClientStatus)}
          options={CLIENT_STATUSES.map((s) => ({ value: s, label: t.clientStatus[s] ?? s }))}
        />

        <label className="field">
          <span className="field-label">{t.clients.revenueField}</span>
          <input
            type="number"
            className="field-input"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="0"
            min="0"
          />
        </label>

        {isAdmin && (
          <CustomSelect
            fullWidth
            label={`${t.clients.responsibleManager} *`}
            placeholder={t.clients.managerRequired}
            value={managerId}
            onChange={(v) => setManagerId(v)}
            options={managers.map((m) => ({ value: m.id, label: m.name }))}
            error={errors.manager}
          />
        )}
      </div>

      <label className="field field-full">
        <span className="field-label">{t.clients.notesLabel}</span>
        <textarea
          className="field-input field-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.clients.notesPlaceholder}
          rows={4}
        />
      </label>

      <div className="form-actions">
        {submitError && <span className="field-error">{submitError}</span>}
        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? t.clients.saving : isEditing ? t.clients.updateClient : t.clients.createClient}
        </button>
      </div>
    </form>
  );
}
