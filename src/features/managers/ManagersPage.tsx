import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchUsersThunk,
  adminCreateUserThunk,
  adminEditUserThunk,
  adminResetPasswordThunk,
  adminDeleteUserThunk,
} from '../auth/authSlice';
import Header from '../../shared/components/Header';
import { Loading } from '../../shared/components/StateViews';
import CustomSelect from '../../shared/ui/Select/CustomSelect';
import Modal from '../../shared/ui/Modal/Modal';
import type { User, Role } from '../../shared/types';
import { SEED_USER_IDS } from '../../shared/services/mockData';
import { t } from '../../shared/i18n';
import './ManagersPage.css';

const isSeedUser = (id: string): boolean => SEED_USER_IDS.includes(id);

type ModalMode = 'create' | 'edit' | null;

interface FormState {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  role: Role;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  role: 'manager',
};

export default function ManagersPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { users, usersLoading } = useAppSelector((s) => s.auth);

  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsersThunk());
  }, [dispatch]);

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setApiError(null);
    setEditingId(null);
    setModal('create');
  };

  const openEdit = (user: User) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName ?? '',
      email: user.email,
      role: user.role,
    });
    setErrors({});
    setApiError(null);
    setEditingId(user.id);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditingId(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = t.managers.firstNameRequired;
    if (!form.lastName.trim()) errs.lastName = t.managers.lastNameRequired;
    if (!form.email.trim()) errs.email = t.managers.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t.managers.invalidEmail;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      if (modal === 'create') {
        const result = await dispatch(
          adminCreateUserThunk({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            middleName: form.middleName.trim() || undefined,
            email: form.email.trim(),
            role: form.role,
          }),
        );
        if (result.meta.requestStatus === 'rejected') {
          setApiError((result as { error?: { message?: string } }).error?.message ?? 'Ошибка');
          setSaving(false);
          return;
        }
      } else if (modal === 'edit' && editingId) {
        const result = await dispatch(
          adminEditUserThunk({
            userId: editingId,
            payload: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              middleName: form.middleName.trim() || undefined,
              email: form.email.trim(),
              role: form.role,
            },
          }),
        );
        if (result.meta.requestStatus === 'rejected') {
          setApiError((result as { error?: { message?: string } }).error?.message ?? 'Ошибка');
          setSaving(false);
          return;
        }
      }
      setSaving(false);
      closeModal();
    } catch {
      setSaving(false);
      setApiError('Ошибка сохранения');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const result = await dispatch(adminResetPasswordThunk(userId));
    if (result.meta.requestStatus === 'fulfilled') {
      setResetFeedback(userId);
      setTimeout(() => setResetFeedback(null), 2500);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t.managers.confirmDelete)) return;
    const result = await dispatch(adminDeleteUserThunk(userId));
    if (result.meta.requestStatus === 'rejected') {
      setPageError((result as { error?: { message?: string } }).error?.message ?? 'Ошибка удаления');
    } else {
      setPageError(null);
    }
  };

  if (usersLoading) return <Loading message={t.managers.loading} />;

  // Built-in demo users have a locked email and role.
  const editingSeed = modal === 'edit' && !!editingId && isSeedUser(editingId);

  return (
    <div className="managers-page fade-in">
      <Header
        title={t.managers.title}
        subtitle={t.managers.subtitle}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            {t.managers.addUser}
          </button>
        }
      />

      {pageError && (
        <div className="banner-error managers-page-error" role="alert">
          {pageError}
        </div>
      )}

      <div className="managers-table-wrap">
        <table className="managers-table">
          <thead>
            <tr>
              <th>{t.managers.name}</th>
              <th>{t.managers.email}</th>
              <th>{t.managers.role}</th>
              <th>{t.managers.status}</th>
              <th>{t.managers.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ animationDelay: `${i * 30}ms` }}>
                <td data-label={t.managers.name}>
                  <div className="manager-name-cell">
                    <div className="manager-avatar">{u.avatar}</div>
                    <span className="manager-name">{u.name}</span>
                  </div>
                </td>
                <td data-label={t.managers.email} className="cell-muted cell-email">{u.email}</td>
                <td data-label={t.managers.role}>
                  <span className={`role-badge role-${u.role}`}>
                    {u.role === 'admin' ? t.profile.admin : t.profile.manager}
                  </span>
                </td>
                <td data-label={t.managers.status}>
                  {u.temporaryPassword ? (
                    <span className="status-badge status-temp">{t.managers.tempPassword}</span>
                  ) : (
                    <span className="status-badge status-active-user">{t.managers.activeAccount}</span>
                  )}
                </td>
                <td data-label={t.managers.actions}>
                  <div className="manager-actions">
                    <button
                      className="icon-btn"
                      onClick={() => openEdit(u)}
                      title={t.managers.edit}
                      aria-label={t.managers.edit}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M13.5 3.5l3 3L7 16l-3.5.5L4 13l9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {u.id !== currentUser?.id && (
                      <>
                        <button
                          className={`icon-btn icon-btn--warn ${resetFeedback === u.id ? 'icon-btn--done' : ''}`}
                          onClick={() => handleResetPassword(u.id)}
                          title={resetFeedback === u.id ? t.managers.resetDone : t.managers.resetPassword}
                          aria-label={t.managers.resetPassword}
                        >
                          {resetFeedback === u.id ? (
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <circle cx="7" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M10 10h7M14.5 10v3M17 10v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={isSeedUser(u.id)}
                          title={isSeedUser(u.id) ? t.managers.seedDeleteHint : t.managers.deleteUser}
                          aria-label={t.managers.deleteUser}
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.5a1 1 0 001 .9h4.6a1 1 0 001-.9L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        title={modal === 'create' ? t.managers.createTitle : t.managers.editTitle}
        subtitle={modal === 'create' ? t.managers.subtitle : form.email}
        footer={
          <>
            <button type="button" className="btn-cancel" onClick={closeModal}>
              {t.managers.cancel}
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? t.managers.saving : t.managers.save}
            </button>
          </>
        }
      >
        {apiError && <div className="modal-error">{apiError}</div>}

        <div className="modal-form-grid">
          <label className="field">
            <span className="field-label">{t.managers.lastName}</span>
            <input
              className={`field-input ${errors.lastName ? 'field-input--error' : ''}`}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              autoFocus
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </label>

          <label className="field">
            <span className="field-label">{t.managers.firstName}</span>
            <input
              className={`field-input ${errors.firstName ? 'field-input--error' : ''}`}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </label>

          <label className="field field--full">
            <span className="field-label">{t.managers.middleName}</span>
            <input
              className="field-input"
              value={form.middleName}
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">{t.managers.emailField}</span>
            <input
              type="email"
              className={`field-input ${errors.email ? 'field-input--error' : ''}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={editingSeed}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
            {editingSeed && <span className="field-note">{t.managers.seedEmailLocked}</span>}
          </label>

          <CustomSelect
            className="field--full"
            fullWidth
            label={t.managers.roleField}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as Role })}
            options={[
              { value: 'manager', label: t.profile.manager },
              { value: 'admin', label: t.profile.admin },
            ]}
            disabled={editingSeed}
            helperText={editingSeed ? t.managers.seedRoleLocked : undefined}
          />
        </div>

        {modal === 'create' && (
          <p className="modal-hint">{t.managers.defaultPasswordHint}</p>
        )}
      </Modal>
    </div>
  );
}
