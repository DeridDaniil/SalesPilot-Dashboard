import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logoutThunk } from '../../features/auth/authSlice';
import { t } from '../i18n';
import './Sidebar.css';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: dashboardIcon },
    { to: '/clients', label: t.nav.clients, icon: clientsIcon },
    { to: '/leads', label: t.nav.leads, icon: leadsIcon },
    ...(user?.role === 'admin'
      ? [{ to: '/managers', label: t.nav.managers, icon: managersIcon }]
      : []),
    { to: '/rules', label: t.nav.rules, icon: rulesIcon },
  ];

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  const handleNav = () => {
    onClose?.();
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">SP</div>
          <div className="brand-text">
            <span className="brand-name">SalesPilot</span>
            <span className="brand-tag">Доска управления</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              onClick={handleNav}
            >
              <span className="nav-icon" dangerouslySetInnerHTML={{ __html: item.icon() }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-card">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.role === 'admin' ? t.profile.admin : t.profile.manager}
                </span>
              </div>
              <NavLink to="/profile" className="btn-settings" title={t.nav.settings} onClick={handleNav}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16.2 12.2a1.4 1.4 0 00.28 1.54l.05.05a1.7 1.7 0 11-2.4 2.4l-.05-.05a1.4 1.4 0 00-1.54-.28 1.4 1.4 0 00-.85 1.28v.16a1.7 1.7 0 11-3.4 0v-.08a1.4 1.4 0 00-.92-1.28 1.4 1.4 0 00-1.54.28l-.05.05a1.7 1.7 0 11-2.4-2.4l.05-.05a1.4 1.4 0 00.28-1.54 1.4 1.4 0 00-1.28-.85H2.3a1.7 1.7 0 110-3.4h.08a1.4 1.4 0 001.28-.92 1.4 1.4 0 00-.28-1.54l-.05-.05a1.7 1.7 0 112.4-2.4l.05.05a1.4 1.4 0 001.54.28h.07a1.4 1.4 0 00.85-1.28V2.3a1.7 1.7 0 113.4 0v.08a1.4 1.4 0 00.85 1.28 1.4 1.4 0 001.54-.28l.05-.05a1.7 1.7 0 112.4 2.4l-.05.05a1.4 1.4 0 00-.28 1.54v.07a1.4 1.4 0 001.28.85h.16a1.7 1.7 0 110 3.4h-.08a1.4 1.4 0 00-1.28.85z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </NavLink>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            {t.nav.signOut}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Inline SVG icon helpers ── */

function dashboardIcon() {
  return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>';
}

function clientsIcon() {
  return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 17.5c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

function leadsIcon() {
  return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.9 5.3L10 14.1l-4.75 2.55.9-5.3L2.3 7.6l5.3-.8L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
}

function managersIcon() {
  return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 17c0-2.8 2.7-5 6-5 1.2 0 2.3.3 3.2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 17c0-2 1.8-3.5 3.5-3.5S18 15 18 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

function rulesIcon() {
  return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2.5h7l3 3V17a0.5 0.5 0 01-0.5 0.5h-9.5A0.5 0.5 0 014.5 17V3a0.5 0.5 0 010.5-0.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 2.5V5.5h3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 9.5h6M7 12.5h6M7 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
}
