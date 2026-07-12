import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/layout/PrivateRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import OrganizationSetup from './pages/OrganizationSetup';
import AssetDirectory from './pages/AssetDirectory';
import AssetAllocation from './pages/AssetAllocation';
import ResourceBooking from './pages/ResourceBooking';
import MaintenanceManagement from './pages/MaintenanceManagement';
import AssetAudit from './pages/AssetAudit';
import Reports from './pages/Reports';
import NotificationsPage from './pages/NotificationsPage';
import './App.css';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/organization" element={<PrivateRoute roles={['admin']}><AppLayout><OrganizationSetup /></AppLayout></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><AppLayout><AssetDirectory /></AppLayout></PrivateRoute>} />
      <Route path="/allocations" element={<PrivateRoute><AppLayout><AssetAllocation /></AppLayout></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><AppLayout><ResourceBooking /></AppLayout></PrivateRoute>} />
      <Route path="/maintenance" element={<PrivateRoute><AppLayout><MaintenanceManagement /></AppLayout></PrivateRoute>} />
      <Route path="/audits" element={<PrivateRoute><AppLayout><AssetAudit /></AppLayout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute roles={['asset_manager', 'admin', 'department_head']}><AppLayout><Reports /></AppLayout></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><AppLayout><NotificationsPage /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
