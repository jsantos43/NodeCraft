import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Landing from './pages/Landing/Landing.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import VerifyEmail from './pages/Auth/VerifyEmail.jsx';
import ResetPassword from './pages/Auth/ResetPassword.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Servers from './pages/Servers/Servers.jsx';
import ServerDetails from './pages/Servers/ServerDetails.jsx';
import CreateServer from './pages/Servers/CreateServer.jsx';
import Workers from './pages/Workers/Workers.jsx';
import WorkerDetails from './pages/Workers/WorkerDetails.jsx';
import Users from './pages/Users/Users.jsx';
import UserDetails from './pages/Users/UserDetails.jsx';
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

function AdminRoute({ children }) {
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

  if (!user) return <Navigate to="/login" replace />;
  return user.admin ? children : <Navigate to="/servers" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/reset" element={<ResetPassword />} />

      <Route path="/servers" element={<PrivateRoute><Servers /></PrivateRoute>} />
      <Route path="/servers/create" element={<PrivateRoute><CreateServer /></PrivateRoute>} />
      <Route path="/servers/:id" element={<PrivateRoute><ServerDetails /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      <Route path="/workers" element={<AdminRoute><Workers /></AdminRoute>} />
      <Route path="/workers/:id" element={<AdminRoute><WorkerDetails /></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/users/:id" element={<AdminRoute><UserDetails /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
