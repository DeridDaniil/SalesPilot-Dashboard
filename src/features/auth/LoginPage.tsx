import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loginThunk } from './authSlice';
import { t } from '../../shared/i18n';
import './LoginPage.css';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginThunk({ email, password }));
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" />

      <div className="login-card fade-in">
        <div className="login-brand">
          <div className="login-brand-mark">SP</div>
          <h1>SalesPilot</h1>
          <p>{t.auth.signInTitle}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <label className="field">
            <span className="field-label">{t.auth.email}</span>
            <input
              type="email"
              className="field-input"
              placeholder="admin@salespilot.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field-label">{t.auth.password}</span>
            <input
              type="password"
              className="field-input"
              placeholder={t.auth.enterPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
        </form>

        <div className="login-hint">
          <p>{t.auth.demoAccounts}</p>
          <code>admin@salespilot.ru / admin</code>
          <code>anna@salespilot.ru / manager</code>
          <code>ivan@salespilot.ru / manager</code>
        </div>

        <div className="login-register">
          <p>
            {t.auth.noAccount}{' '}
            <Link to="/register" className="auth-link">{t.auth.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
