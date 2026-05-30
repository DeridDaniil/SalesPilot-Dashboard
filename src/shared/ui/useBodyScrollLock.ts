import { useEffect } from 'react';

/**
 * Locks <body> scroll while `active` is true (e.g. while a modal is open), so the
 * page underneath can't scroll behind the overlay. Restores the previous value
 * on cleanup, so nested/sequential modals don't leave the page stuck.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
