import { Link } from 'react-router-dom';
import Header from '../../shared/components/Header';
import { t } from '../../shared/i18n';
import './LegalPage.css';

interface LegalPageProps {
  variant: 'privacy' | 'terms';
}

export default function LegalPage({ variant }: LegalPageProps) {
  const data = variant === 'privacy' ? t.privacy : t.terms;

  return (
    <div className="legal-page fade-in">
      <Header
        title={data.title}
        subtitle={data.subtitle}
        actions={
          <Link to="/rules" className="btn-cancel">
            {data.backToRules}
          </Link>
        }
      />

      <article className="legal-article">
        <p className="legal-updated">{data.updated}</p>

        {data.sections.map((section) => (
          <section className="legal-section" key={section.heading}>
            <h2 className="legal-section__heading">{section.heading}</h2>
            <p className="legal-section__body">{section.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
