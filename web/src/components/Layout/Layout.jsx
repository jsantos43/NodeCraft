import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Layout.css';

export default function Layout({ children, title, breadcrumbs }) {
  const { user } = useAuth();
  const isAdmin = user?.admin;
  const location = useLocation();

  // Off-canvas nav drawer (mobile only). Close it whenever the route changes so
  // tapping a link both navigates and dismisses the drawer.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen]);

  return (
    <div className="layout">
      {isAdmin && <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />}
      <div className="layout-main">
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          showLogo={!isAdmin}
          onMenuClick={isAdmin ? () => setNavOpen(true) : undefined}
        />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
