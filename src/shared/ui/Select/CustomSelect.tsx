import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import './CustomSelect.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'ghost';
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
}

interface MenuPosition {
  left: number;
  width: number;
  top: number;
  bottom: number;
  placement: 'down' | 'up';
  maxHeight: number;
}

const GAP = 6;
const DESIRED_MENU_HEIGHT = 280;

export default function CustomSelect({
  value,
  onChange,
  options,
  label,
  placeholder = '—',
  disabled = false,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  variant = 'default',
  id,
  name,
  ariaLabel,
  className,
  triggerClassName,
  triggerStyle,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState<MenuPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const reactId = useId();
  const baseId = id ?? reactId;
  const listboxId = `${baseId}-listbox`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabled = () => options.findIndex((o) => !o.disabled);

  const computePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - GAP;
    const spaceAbove = r.top - GAP;
    let placement: 'down' | 'up' = 'down';
    let maxHeight = Math.min(DESIRED_MENU_HEIGHT, spaceBelow);
    if (spaceBelow < 180 && spaceAbove > spaceBelow) {
      placement = 'up';
      maxHeight = Math.min(DESIRED_MENU_HEIGHT, spaceAbove);
    }
    setPos({
      left: r.left,
      width: r.width,
      top: r.bottom + GAP,
      bottom: window.innerHeight - r.top + GAP,
      placement,
      maxHeight: Math.max(maxHeight, 120),
    });
  };

  const openMenu = () => {
    if (disabled) return;
    computePosition();
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled());
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const toggle = () => (open ? close() : openMenu());

  const selectOption = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    close();
    triggerRef.current?.focus();
  };

  // Keep the menu pinned to the trigger while scrolling/resizing.
  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const handler = () => computePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Scroll the active option into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = menuRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const moveActive = (dir: 1 | -1) => {
    const n = options.length;
    if (n === 0) return;
    let i = activeIndex;
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (!options[i]?.disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(firstEnabled());
        break;
      case 'End': {
        e.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i]?.disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && options[activeIndex]) selectOption(options[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  const triggerClasses = [
    'cs-trigger',
    size === 'sm' && 'cs-trigger--sm',
    variant === 'ghost' && 'cs-trigger--ghost',
    error && 'cs-trigger--error',
    open && 'cs-trigger--open',
    triggerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['cs', fullWidth && 'cs--full', className].filter(Boolean).join(' ')}>
      {label && (
        <span className="field-label cs-label" id={`${baseId}-label`}>
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={label ? `${baseId}-label` : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        className={triggerClasses}
        style={triggerStyle}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className={`cs-value ${selected ? '' : 'cs-placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="cs-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {error && <span className="field-error">{error}</span>}
      {!error && helperText && <span className="field-note">{helperText}</span>}

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? `${baseId}-label` : undefined}
            className="cs-menu"
            style={{
              position: 'fixed',
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              ...(pos.placement === 'down'
                ? { top: pos.top }
                : { bottom: pos.bottom }),
            }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const optionClasses = [
                'cs-option',
                isSelected && 'cs-option--selected',
                i === activeIndex && 'cs-option--active',
                opt.disabled && 'cs-option--disabled',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={opt.value}
                  id={`${listboxId}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  className={optionClasses}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(opt)}
                >
                  <span className="cs-option-label">{opt.label}</span>
                  {isSelected && (
                    <svg className="cs-check" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
