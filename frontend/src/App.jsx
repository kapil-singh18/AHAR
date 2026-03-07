import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ImageUploadPage from './pages/ImageUploadPage';
import ConsumptionForm from './pages/ConsumptionForm';
import DonationLocatorPage from './pages/DonationLocatorPage';
import RecommendationsPage from './pages/RecommendationsPage';
import InventoryHub from './pages/InventoryHub';
import GuidePage from './pages/GuidePage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryHub />} />
        <Route path="/inventory/stock" element={<InventoryPage />} />
        <Route path="/inventory/menu" element={<MenuManagement />} />
        <Route path="/inventory/consumption" element={<ConsumptionForm />} />
        <Route path="/inventory/expiry" element={<ImageUploadPage />} />
        <Route path="/inventory/donations" element={<DonationLocatorPage />} />
        <Route path="/inventory/recommendations" element={<RecommendationsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/menu" element={<Navigate to="/inventory/menu" replace />} />
        <Route path="/consumption" element={<Navigate to="/inventory/consumption" replace />} />
        <Route path="/expiry" element={<Navigate to="/inventory/expiry" replace />} />
        <Route path="/donations" element={<Navigate to="/inventory/donations" replace />} />
        <Route path="/recommendations" element={<Navigate to="/inventory/recommendations" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
