import { t } from '../i18n';
import './StateViews.css';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = t.state.loading }: LoadingProps) {
  return (
    <div className="state-view state-loading">
      <div className="loading-bars">
        <span /><span /><span />
      </div>
      <p>{message}</p>
    </div>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="state-view state-error">
      <div className="state-icon">!</div>
      <p>{message}</p>
      {onRetry && (
        <button className="btn-retry" onClick={onRetry}>
          {t.state.tryAgain}
        </button>
      )}
    </div>
  );
}

interface EmptyProps {
  title?: string;
  message?: string;
}

export function Empty({ title = t.state.noData, message = t.state.nothingYet }: EmptyProps) {
  return (
    <div className="state-view state-empty">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M6 18h36" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
