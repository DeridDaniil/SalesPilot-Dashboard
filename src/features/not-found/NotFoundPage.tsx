import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { t } from '../../shared/i18n';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const user = useAppSelector((s) => s.auth.user);
  const targetHref = user ? '/dashboard' : '/login';
  const targetLabel = user ? t.notFound.backToDashboard : t.notFound.backToLogin;

  return (
    <div className="not-found fade-in">
      <div className="not-found-card">
        <span className="not-found-code">{t.notFound.code}</span>
        <h1 className="not-found-title">{t.notFound.title}</h1>
        <p className="not-found-subtitle">{t.notFound.subtitle}</p>
        <Link to={targetHref} className="btn-primary not-found-cta">
          {targetLabel}
        </Link>
      </div>
    </div>
  );
}
