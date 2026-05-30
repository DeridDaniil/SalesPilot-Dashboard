import { useEffect } from 'react';
import type { ElementType, FormEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../useBodyScrollLock';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** When provided, the card is a <form> and this fires on submit (Enter / submit button). */
  onSubmit?: (e: FormEvent) => void;
  size?: 'sm' | 'md';
  closeLabel?: string;
}

/**
 * Accessible, scroll-safe modal dialog.
 *
 * Rendered through a portal to <body> so its `position: fixed` overlay is always
 * relative to the viewport — never trapped by a transformed ancestor (e.g. a page
 * with the `.fade-in` entrance animation). Structure is header / scrollable body /
 * footer; the body scrolls while the header and footer stay pinned.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  onSubmit,
  size = 'md',
  closeLabel = 'Закрыть',
}: ModalProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const Card: ElementType = onSubmit ? 'form' : 'div';
  const cardProps = onSubmit ? { onSubmit, noValidate: true } : {};

  return createPortal(
    <div className="ui-modal-overlay" onClick={onClose} role="presentation">
      <Card
        className={`ui-modal-card ui-modal-card--${size}`}
        onClick={(e: MouseEvent) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        {...cardProps}
      >
        <header className="ui-modal-header">
          <div className="ui-modal-heading">
            <h2 className="ui-modal-title">{title}</h2>
            {subtitle && <p className="ui-modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label={closeLabel}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="ui-modal-body">{children}</div>

        {footer && <div className="ui-modal-footer">{footer}</div>}
      </Card>
    </div>,
    document.body,
  );
}
