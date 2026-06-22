import React from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Layout.css';

export default function Layout({ children, title, breadcrumbs }) {
  const { user } = useAuth();
  const isAdmin = user?.admin;

  return (
    <div className="layout">
      {isAdmin && <Sidebar />}
      <div className="layout-main">
        <Header title={title} breadcrumbs={breadcrumbs} showLogo={!isAdmin} />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
