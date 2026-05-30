import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerThunk } from './authSlice';
import { t } from '../../shared/i18n';
import './LoginPage.css';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((s) => s.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = t.auth.nameRequired;
    if (!lastName.trim()) errs.lastName = t.auth.lastNameRequired;
    if (!email.trim()) errs.email = t.auth.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.auth.invalidEmail;
    if (!password.trim()) errs.password = t.auth.passwordRequired;
    else if (password.length < 4) errs.password = t.auth.passwordMinLength;
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const name = `${firstName.trim()} ${lastName.trim()}`;
    dispatch(registerThunk({ name, email: email.trim(), password, role: 'manager' }));
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" />

      <div className="login-card fade-in">
        <div className="login-brand">
          <div className="login-brand-mark">SP</div>
          <h1>SalesPilot</h1>
          <p>{t.auth.registrationSubtitle}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-error">{error}</div>}

          <div className="register-name-row">
            <label className="field">
              <span className="field-label">{t.auth.firstName}</span>
              <input
                className={`field-input ${localErrors.firstName ? 'field-input--error' : ''}`}
                placeholder={t.auth.firstNamePlaceholder}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
              {localErrors.firstName && <span className="field-error">{localErrors.firstName}</span>}
            </label>

            <label className="field">
              <span className="field-label">{t.auth.lastName}</span>
              <input
                className={`field-input ${localErrors.lastName ? 'field-input--error' : ''}`}
                placeholder={t.auth.lastNamePlaceholder}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {localErrors.lastName && <span className="field-error">{localErrors.lastName}</span>}
            </label>
          </div>

          <label className="field">
            <span className="field-label">{t.auth.email}</span>
            <input
              type="email"
              className={`field-input ${localErrors.email ? 'field-input--error' : ''}`}
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {localErrors.email && <span className="field-error">{localErrors.email}</span>}
          </label>

          <label className="field">
            <span className="field-label">{t.auth.password}</span>
            <input
              type="password"
              className={`field-input ${localErrors.password ? 'field-input--error' : ''}`}
              placeholder={t.auth.enterPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {localErrors.password && <span className="field-error">{localErrors.password}</span>}
          </label>

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? t.auth.registering : t.auth.register}
          </button>
        </form>

        <div className="login-hint">
          <p>
            {t.auth.haveAccount}{' '}
            <Link to="/login" className="auth-link">{t.auth.signInLink}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
