import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, Cpu,
  Users, ChevronRight, ChevronLeft, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import './Sidebar.css';

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/servers', label: 'Servers',   icon: Server          },
  { to: '/workers', label: 'Workers',   icon: Cpu             },
  { to: '/users',   label: 'Users',     icon: Users           },
];

function NavItem({ to, label, icon: Icon, collapsed }) {
  const { pathname } = useLocation();
  const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={`sidebar-link ${active ? 'sidebar-link-active' : ''} ${collapsed ? 'sidebar-link-collapsed' : ''}`}
    >
      <Icon size={15} className="sidebar-link-icon" />
      <span className="sidebar-link-label">{label}</span>
      {active && !collapsed && <ChevronRight size={12} className="sidebar-arrow" />}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.admin;

  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', next);
      return next;
    });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Link to="/" className="sidebar-logo" title={collapsed ? 'NodeCraft' : undefined}>
        <div className="sidebar-logo-icon">
          <Zap size={16} />
        </div>
        <span className="sidebar-logo-text">NodeCraft</span>
      </Link>

      <nav className="sidebar-nav">
        {adminNav.map(item => (
          <NavItem key={item.to + item.label} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          <span className="sidebar-toggle-label">Collapse</span>
        </button>

      </div>
    </aside>
  );
}
