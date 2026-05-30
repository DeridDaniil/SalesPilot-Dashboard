import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './shared/components/ProtectedRoute';
import ScrollToTop from './shared/components/ScrollToTop';
import Sidebar from './shared/components/Sidebar';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ClientsPage from './features/clients/ClientsPage';
import ClientDetailsPage from './features/clients/ClientDetailsPage';
import ClientForm from './features/clients/ClientForm';
import LeadsPage from './features/leads/LeadsPage';
import LeadForm from './features/leads/LeadForm';
import ProfilePage from './features/profile/ProfilePage';
import ManagersPage from './features/managers/ManagersPage';
import RulesPage from './features/rules/RulesPage';
import LegalPage from './features/legal/LegalPage';
import NotFoundPage from './features/not-found/NotFoundPage';
import './App.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        className="btn-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Открыть меню"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <main className="app-main">
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientDetailsPage />} />
          <Route path="clients/:id/edit" element={<ClientForm />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/new" element={<LeadForm />} />
          <Route path="leads/:id/edit" element={<LeadForm />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="managers" element={<ManagersPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="privacy" element={<LegalPage variant="privacy" />} />
          <Route path="terms" element={<LegalPage variant="terms" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </>
  );
}
