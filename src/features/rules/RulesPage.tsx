import { Link } from 'react-router-dom';
import Header from '../../shared/components/Header';
import { t } from '../../shared/i18n';
import './RulesPage.css';

export default function RulesPage() {
  return (
    <div className="rules-page fade-in">
      <Header title={t.rules.title} subtitle={t.rules.subtitle} />

      <div className="rules-grid">
        <section className="rules-card">
          <span className="eyebrow">01</span>
          <h2 className="section-title">{t.rules.aboutTitle}</h2>
          <p className="rules-body">{t.rules.aboutBody}</p>
        </section>

        <section className="rules-card">
          <span className="eyebrow">02</span>
          <h2 className="section-title">{t.rules.loginTitle}</h2>
          <p className="rules-body">{t.rules.loginBody}</p>
          <p className="rules-hint">{t.rules.loginDemo}</p>
        </section>

        <section className="rules-card">
          <span className="eyebrow">03</span>
          <h2 className="section-title">{t.rules.dataTitle}</h2>
          <p className="rules-body">{t.rules.dataBody}</p>
        </section>

        <section className="rules-card">
          <span className="eyebrow">04</span>
          <h2 className="section-title">{t.rules.pagesTitle}</h2>
          <ul className="rules-list">
            <li>{t.rules.pagesDashboard}</li>
            <li>{t.rules.pagesClients}</li>
            <li>{t.rules.pagesLeads}</li>
            <li>{t.rules.pagesManagers}</li>
            <li>{t.rules.pagesProfile}</li>
          </ul>
        </section>

        <section className="rules-card">
          <span className="eyebrow">05</span>
          <h2 className="section-title">{t.rules.limitsTitle}</h2>
          <ul className="rules-list">
            <li>{t.rules.limit1}</li>
            <li>{t.rules.limit2}</li>
            <li>{t.rules.limit3}</li>
            <li>{t.rules.limit4}</li>
          </ul>
        </section>

        <section className="rules-card rules-card--accent">
          <span className="eyebrow">06</span>
          <h2 className="section-title">{t.rules.nextTitle}</h2>
          <p className="rules-body">{t.rules.nextBody}</p>
        </section>
      </div>

      <div className="rules-legal">
        <h3 className="rules-legal-heading">{t.rules.legalTitle}</h3>
        <p className="rules-legal-hint">{t.rules.legalHint}</p>
        <div className="rules-legal-links">
          <Link to="/privacy" className="rules-legal-link">
            <span className="rules-legal-link__label">{t.rules.privacyLink}</span>
            <span className="rules-legal-link__arrow" aria-hidden="true">→</span>
          </Link>
          <Link to="/terms" className="rules-legal-link">
            <span className="rules-legal-link__label">{t.rules.termsLink}</span>
            <span className="rules-legal-link__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
