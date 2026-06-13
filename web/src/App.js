import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import Login from './pages/Auth/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Servers from './pages/Servers/Servers.jsx';
import ServerDetails from './pages/Servers/ServerDetails.jsx';
import CreateServer from './pages/Servers/CreateServer.jsx';
import Workers from './pages/Workers/Workers.jsx';
import WorkerDetails from './pages/Workers/WorkerDetails.jsx';
import Backups from './pages/Backups/Backups.jsx';
import Monitoring from './pages/Monitoring/Monitoring.jsx';
import Users from './pages/Users/Users.jsx';
import Settings from './pages/Settings/Settings.jsx';
import Spinner from './components/ui/Spinner.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-base)',
      }}>
        <Spinner size={24} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/servers" element={<PrivateRoute><Servers /></PrivateRoute>} />
      <Route path="/servers/create" element={<PrivateRoute><CreateServer /></PrivateRoute>} />
      <Route path="/servers/:id" element={<PrivateRoute><ServerDetails /></PrivateRoute>} />
      <Route path="/workers" element={<PrivateRoute><Workers /></PrivateRoute>} />
      <Route path="/workers/:id" element={<PrivateRoute><WorkerDetails /></PrivateRoute>} />
      <Route path="/backups" element={<PrivateRoute><Backups /></PrivateRoute>} />
      <Route path="/monitoring" element={<PrivateRoute><Monitoring /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
