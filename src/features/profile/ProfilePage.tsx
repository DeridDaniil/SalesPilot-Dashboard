import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateProfileThunk, changePasswordThunk } from '../auth/authSlice';
import Header from '../../shared/components/Header';
import { useBodyScrollLock } from '../../shared/ui/useBodyScrollLock';
import { resetDemoData } from '../../shared/services/storageService';
import { t } from '../../shared/i18n';
import './ProfilePage.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  /* ── Profile fields ── */
  const [firstName, setFirstName] = useState(user?.firstName ?? user?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? user?.name?.split(' ').slice(-1)[0] ?? '');
  const [middleName, setMiddleName] = useState(user?.middleName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  /* ── Password modal ── */
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwChanged, setPwChanged] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Lock page scroll while the password modal is open.
  useBodyScrollLock(pwModalOpen);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setProfileError(t.profile.firstNameRequired); return; }
    if (!lastName.trim()) { setProfileError(t.profile.lastNameRequired); return; }
    if (!email.trim()) { setProfileError(t.profile.emailRequired); return; }
    if (!EMAIL_RE.test(email.trim())) { setProfileError(t.profile.invalidEmail); return; }

    setSaving(true);
    setProfileError(null);
    setSaved(false);

    const result = await dispatch(
      updateProfileThunk({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
      }),
    );

    setSaving(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setProfileError(
        (result as { error?: { message?: string } }).error?.message ?? 'Ошибка сохранения',
      );
    }
  };

  const handleResetDemo = () => {
    if (!window.confirm(t.profile.resetConfirm)) return;
    resetDemoData();
    // Full reload so the store re-initialises from the freshly seeded data and
    // the (now cleared) session drops the user back to the login screen.
    window.location.assign('/login');
  };

  const openPwModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwError(null);
    setPwChanged(false);
    setPwModalOpen(true);
  };

  const closePwModal = () => setPwModalOpen(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!currentPassword) { setPwError(t.profile.currentPasswordRequired); return; }
    if (!newPassword) { setPwError(t.profile.newPasswordRequired); return; }
    if (newPassword.length < 4) { setPwError(t.profile.passwordMinLength); return; }
    if (newPassword !== confirmPassword) { setPwError(t.profile.passwordMismatch); return; }

    setChangingPw(true);
    setPwChanged(false);

    const result = await dispatch(
      changePasswordThunk({ currentPassword, newPassword }),
    );

    setChangingPw(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setPwChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwChanged(false);
        closePwModal();
      }, 1500);
    } else {
      setPwError(
        (result as { error?: { message?: string } }).error?.message ?? t.profile.wrongCurrentPassword,
      );
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page fade-in">
      <Header title={t.profile.title} subtitle={t.profile.subtitle} />

      <div className="profile-layout">
        {/* ── Identity sidebar ── */}
        <div className="profile-identity">
          <div className="profile-avatar-large">{user.avatar}</div>
          <h2 className="profile-display-name">{user.name}</h2>
          <div className="profile-role-badge">
            {user.role === 'admin' ? t.profile.admin : t.profile.manager}
          </div>

          <div className="profile-meta">
            <div className="profile-meta-item">
              <span className="profile-meta-label">{t.profile.emailLabel}</span>
              <span className="profile-meta-value">{user.email}</span>
            </div>
            {user.phone && (
              <div className="profile-meta-item">
                <span className="profile-meta-label">{t.profile.phone}</span>
                <span className="profile-meta-value">{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Forms column ── */}
        <div className="profile-forms">
          {/* ── Personal info ── */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 17.5c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="profile-section-title">{t.profile.personalInfo}</h3>
            </div>

            <form className="profile-form" onSubmit={handleProfileSubmit} noValidate>
              <div className="profile-form-grid">
                <label className="field">
                  <span className="field-label">{t.profile.lastName} *</span>
                  <input
                    className="field-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t.profile.firstName} *</span>
                  <input
                    className="field-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t.profile.middleName}</span>
                  <input
                    className="field-input"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">{t.profile.email} *</span>
                  <input
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="field field--full">
                  <span className="field-label">{t.profile.phone}</span>
                  <input
                    className="field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.profile.phonePlaceholder}
                  />
                </label>
              </div>

              {profileError && <div className="profile-error">{profileError}</div>}
              {saved && <div className="profile-success">{t.profile.saved}</div>}

              <div className="profile-actions">
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? t.profile.saving : t.profile.save}
                </button>
              </div>
            </form>
          </div>

          {/* ── Security section ── */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="profile-section-title">{t.profile.security}</h3>
            </div>

            <p className="profile-security-hint">{t.profile.securityHint}</p>

            <div className="profile-actions">
              <button type="button" className="btn-submit" onClick={openPwModal}>
                {t.profile.changePassword}
              </button>
            </div>
          </div>

          {/* ── Demo data section ── */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4v4h4M16 16v-4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 9a6 6 0 00-10.5-3.5L4 8M4 11a6 6 0 0010.5 3.5L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="profile-section-title">{t.profile.demoTitle}</h3>
            </div>

            <p className="profile-security-hint">{t.profile.demoHint}</p>

            <div className="profile-actions">
              <button type="button" className="btn-danger" onClick={handleResetDemo}>
                {t.profile.resetDemo}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Password change modal ── */}
      {pwModalOpen && (
        <div className="pw-modal-overlay" onClick={closePwModal}>
          <div className="pw-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="pw-modal-title">{t.profile.changePassword}</h2>

            <form className="pw-modal-form" onSubmit={handlePasswordSubmit} noValidate>
              {pwError && <div className="profile-error">{pwError}</div>}
              {pwChanged && <div className="profile-success">{t.profile.passwordChanged}</div>}

              <label className="field">
                <span className="field-label">{t.profile.currentPassword}</span>
                <input
                  type="password"
                  className="field-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="field">
                <span className="field-label">{t.profile.newPassword}</span>
                <input
                  type="password"
                  className="field-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">{t.profile.confirmPassword}</span>
                <input
                  type="password"
                  className="field-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              <div className="pw-modal-actions">
                <button type="button" className="btn-sm" onClick={closePwModal}>
                  {t.profile.cancel}
                </button>
                <button type="submit" className="btn-submit" disabled={changingPw}>
                  {changingPw ? t.profile.changingPassword : t.profile.changePassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
