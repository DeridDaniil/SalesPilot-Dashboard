import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the window scroll to the top on every route change, instantly (no smooth
 * animation), before paint — so a new page always opens at its top regardless of
 * where the previous page was scrolled.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
