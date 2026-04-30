/**
 * APPLICATION PRINCIPALE - StockMedi
 * Support PWA - Bandeau de mise à jour automatique
 * Landing Page pour visiteurs non connectés
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import { LanguageProvider } from './context/LanguageContext';
//import LandingPage from './pages/landing/LandingPage';

// Styles
import './styles/main.css';
import './styles/components/buttons.css';
import './styles/components/card.css';
import './styles/components/forms.css';
import './styles/components/table.css';
import './styles/layout/sidebar.css';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/stock/Products';
import Sales from './pages/sales/Sales';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Employees from './pages/settings/Employees';
import Subscription from './pages/settings/Subscription';
import Archives from './pages/archives/Archives';
import Establishments from './pages/settings/Establishments';
import LocalPayment from './pages/payment/LocalPayment';
import PatientRecords from './pages/patients/PatientRecords';

// Pages Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminCompanies from './components/admin/AdminCompanies';
import AdminUsers from './components/admin/AdminUsers';
import AdminLogs from './components/admin/AdminLogs';
import SecurityLogs from './components/admin/SecurityLogs';

// Pages légales
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import About from './pages/legal/About';
import Terms from './pages/legal/Terms';
import Contact from './pages/legal/Contact';

// Composants
//import InstallPrompt from './components/common/InstallPrompt';
import UpdateBanner from './components/common/UpdateBanner';
import Layout from './components/layout/Layout';

// Devis
import Quotes from './pages/quotes/Quotes';
import NewQuote from './pages/quotes/NewQuote';
import QuoteDetail from './pages/quotes/QuoteDetail';

// Fournisseur
import Suppliers from './pages/stock/Suppliers';

// Guide User
import UserGuide from './pages/help/UserGuide';

// ==================== COMPOSANTS DE PROTECTION ====================

const ProtectedRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const SuperAdminRoute = ({ children }) => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'super-admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const OwnerRoute = ({ children }) => {
    const user = authService.getCurrentUser();
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'owner' && user?.role !== 'super-admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

// ==================== APPLICATION ====================

function App() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateRegistration, setUpdateRegistration] = useState(null);

    useEffect(() => {
        const handleUpdateAvailable = (event) => {
            console.log('🆕 [App] Mise à jour PWA détectée');
            setUpdateAvailable(true);
            setUpdateRegistration(event.detail.registration);
        };
        window.addEventListener('pwaUpdateAvailable', handleUpdateAvailable);
        return () => window.removeEventListener('pwaUpdateAvailable', handleUpdateAvailable);
    }, []);

    const handleUpdate = () => {
        if (updateRegistration && updateRegistration.waiting) {
            updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setUpdateAvailable(false);
        } else {
            window.location.reload();
        }
    };

    const handleDismiss = () => setUpdateAvailable(false);

    return (
        <LanguageProvider>
            <Router>
                <Routes>
                    {/* ========== ROUTES PROTÉGÉES (avec Layout) — Racine pour utilisateurs connectés ========== */}
                    <Route path="/" element={
                        <ProtectedRoute><Layout /></ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="sales" element={<Sales />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="archives" element={<Archives />} />
                        <Route path="quotes" element={<Quotes />} />
                        <Route path="quotes/new" element={<NewQuote />} />
                        <Route path="quotes/:id" element={<QuoteDetail />} />
                        <Route path="patients" element={<PatientRecords />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="employees" element={<OwnerRoute><Employees /></OwnerRoute>} />
                        <Route path="settings" element={<OwnerRoute><Settings /></OwnerRoute>} />
                        <Route path="subscription" element={<OwnerRoute><Subscription /></OwnerRoute>} />
                        <Route path="settings/establishments" element={<OwnerRoute><Establishments /></OwnerRoute>} />
                    </Route>

                    {/* ========== ROUTES PUBLIQUES ========== */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/guide" element={<UserGuide />} />

                    {/* ========== PAIEMENT LOCAL ========== */}
                    <Route path="/local-payment" element={
                        <ProtectedRoute><LocalPayment /></ProtectedRoute>
                    } />

                    {/* ========== ROUTES SUPER-ADMIN ========== */}
                    <Route path="/admin" element={<SuperAdminRoute><AdminDashboard /></SuperAdminRoute>} />
                    <Route path="/admin/companies" element={<SuperAdminRoute><AdminCompanies /></SuperAdminRoute>} />
                    <Route path="/admin/users" element={<SuperAdminRoute><AdminUsers /></SuperAdminRoute>} />
                    <Route path="/admin/logs" element={<SuperAdminRoute><AdminLogs /></SuperAdminRoute>} />
                    <Route path="/admin/security" element={<SuperAdminRoute><SecurityLogs /></SuperAdminRoute>} />

                    {/* ========== 404 ========== */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            
            {updateAvailable && <UpdateBanner onUpdate={handleUpdate} onDismiss={handleDismiss} />}
        </LanguageProvider>
    );
}

export default App;