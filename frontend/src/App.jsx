import React from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import InventoryPage from './pages/InventoryPage';
import DonationLocatorPage from './pages/DonationLocatorPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import MenuManagement from './pages/MenuManagement';
import ConsumptionForm from './pages/ConsumptionForm';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-sm text-ink-muted">
        Loading AHAR...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Layout><Outlet /></Layout>;
}

function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="stack">
      <div className="page-head">
        <p className="eyebrow">System</p>
        <h1>Settings</h1>
        <p>Account and workspace settings supported by the current application.</p>
      </div>
      <section className="card">
        <h2 className="card-title">Account</h2>
        <dl className="settings-grid">
          <div><dt>Name</dt><dd>{user?.name}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Role</dt><dd>{user?.role}</dd></div>
          <div><dt>Kitchen</dt><dd>{user?.activeKitchenId}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        <Route path="/forecasting" element={<PredictionPage />} />
        <Route path="/prediction" element={<Navigate to="/forecasting" replace />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/consumption" element={<ConsumptionForm />} />
        <Route path="/donations" element={<DonationLocatorPage />} />
        <Route path="/surpluses" element={<Navigate to="/donations" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
