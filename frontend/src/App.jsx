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

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/consumption" element={<ConsumptionForm />} />
        <Route path="/expiry" element={<ImageUploadPage />} />
        <Route path="/donations" element={<DonationLocatorPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
