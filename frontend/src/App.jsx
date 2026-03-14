import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import InventoryPage from './pages/InventoryPage';
import DonationLocatorPage from './pages/DonationLocatorPage';
import GuidePage from './pages/GuidePage';
import PaymentPage from './pages/PaymentPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

function App() {
  return (
    <>
      <SignedIn>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/donations" element={<DonationLocatorPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/pricing" element={<Navigate to="/payment" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </SignedIn>
      <SignedOut>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </>
  );
}

export default App;
