import React from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import './Layout.css';

export default function Layout({ children, title, breadcrumbs }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
