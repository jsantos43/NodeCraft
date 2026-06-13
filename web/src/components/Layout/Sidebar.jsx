import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, Cpu, HardDrive, BarChart2,
  Users, Settings, ChevronRight, Zap,
} from 'lucide-react';
import './Sidebar.css';

const nav = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/servers',   label: 'Servers',   icon: Server          },
  { to: '/workers',   label: 'Workers',   icon: Cpu             },
  { to: '/backups',   label: 'Backups',   icon: HardDrive       },
  { to: '/monitoring',label: 'Monitoring',icon: BarChart2       },
  { to: '/users',     label: 'Users',     icon: Users           },
  { to: '/settings',  label: 'Settings',  icon: Settings        },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={16} />
        </div>
        <span className="sidebar-logo-text">NodeCraft</span>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}>
              <Icon size={15} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="sidebar-arrow" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  );
}
