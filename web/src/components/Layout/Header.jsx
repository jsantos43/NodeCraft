import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, ChevronDown, Settings, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import './Header.css';

export default function Header({ title, breadcrumbs, showLogo }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showLogo && (
          <div className="topbar-brand">
            <div className="topbar-brand-icon"><Zap size={14} /></div>
            <span className="topbar-brand-text">NodeCraft</span>
          </div>
        )}
        {breadcrumbs ? (
          <nav className="topbar-breadcrumbs">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                <span className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? 'breadcrumb-current' : ''}`}>
                  {b}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="topbar-title">{title}</h1>
        )}
      </div>

      <div className="topbar-right">
        <div className="topbar-user" onClick={() => setMenuOpen(o => !o)}>
          <div className="topbar-avatar">
            <User size={13} />
          </div>
          <span className="topbar-username">{user?.username || 'Account'}</span>
          {user?.admin && <span className="topbar-admin-badge">Admin</span>}
          <ChevronDown size={12} className={`topbar-chevron ${menuOpen ? 'open' : ''}`} />

          {menuOpen && (
            <div className="topbar-menu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="topbar-menu-info">
                <div className="menu-username-row">
                  <span className="menu-username">{user?.username}</span>
                  {user?.admin && <span className="menu-admin-badge">Admin</span>}
                </div>
                <span className="menu-email">{user?.email}</span>
              </div>
              <div className="topbar-menu-divider" />
              <Link to="/settings" className="topbar-menu-item" onClick={() => setMenuOpen(false)}>
                <Settings size={13} />
                Settings
              </Link>
              <div className="topbar-menu-divider" />
              <button className="topbar-menu-item" onClick={logout}>
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
