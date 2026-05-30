import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { changePasswordThunk } from '../../features/auth/authSlice';
import { useBodyScrollLock } from '../ui/useBodyScrollLock';
import { t } from '../i18n';
import './ForcePasswordModal.css';

const DEFAULT_PASSWORD = '12345';

export default function ForcePasswordModal() {
  const dispatch = useAppDispatch();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // This modal is mounted only while a password change is forced — lock page scroll.
  useBodyScrollLock(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) { setError(t.auth.passwordRequired); return; }
    if (newPassword.length < 4) { setError(t.auth.passwordMinLength); return; }
    if (newPassword === DEFAULT_PASSWORD) { setError('Пароль должен отличаться от временного'); return; }
    if (newPassword !== confirmPassword) { setError(t.profile.passwordMismatch); return; }

    setSaving(true);
    const result = await dispatch(
      changePasswordThunk({ currentPassword: DEFAULT_PASSWORD, newPassword }),
    );
    setSaving(false);

    if (result.meta.requestStatus === 'rejected') {
      setError(
        (result as { error?: { message?: string } }).error?.message ?? 'Ошибка смены пароля',
      );
    }
  };

  return (
    <div className="force-pw-overlay">
      <div className="force-pw-card fade-in">
        <div className="force-pw-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <h2 className="force-pw-title">{t.auth.forceChangeTitle}</h2>
        <p className="force-pw-subtitle">{t.auth.forceChangeSubtitle}</p>

        <form className="force-pw-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="force-pw-error">{error}</div>}

          <label className="field">
            <span className="field-label">{t.auth.forceNewPassword}</span>
            <input
              type="password"
              className="field-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              placeholder="Минимум 4 символа"
            />
          </label>

          <label className="field">
            <span className="field-label">{t.auth.forceConfirm}</span>
            <input
              type="password"
              className="field-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
            />
          </label>

          <button className="btn-force-submit" type="submit" disabled={saving}>
            {saving ? t.auth.forceChanging : t.auth.forceSubmit}
          </button>
        </form>
      </div>
    </div>
  );
}
