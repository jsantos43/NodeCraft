import React from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import './Header.css';

export default function Header({ title, breadcrumbs }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
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
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="notif-dot" />
        </button>

        <div className="topbar-user" onClick={() => setMenuOpen(o => !o)}>
          <div className="topbar-avatar">
            <User size={13} />
          </div>
          <span className="topbar-username">{user?.username || 'Account'}</span>
          <ChevronDown size={12} className={`topbar-chevron ${menuOpen ? 'open' : ''}`} />

          {menuOpen && (
            <div className="topbar-menu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="topbar-menu-info">
                <span className="menu-username">{user?.username}</span>
                <span className="menu-email">{user?.email}</span>
              </div>
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
