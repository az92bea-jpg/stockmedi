/**
 * APPLICATION PRINCIPALE - StockMedi
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import { LanguageProvider } from './context/LanguageContext';

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

// Pages Admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminCompanies from './components/admin/AdminCompanies';
import AdminUsers from './components/admin/AdminUsers';
import AdminLogs from './components/admin/AdminLogs';

// Pages légales
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import About from './pages/legal/About';
import Terms from './pages/legal/Terms';
import Contact from './pages/legal/Contact';
import InstallPrompt from './components/common/InstallPrompt';

// Layout
import Layout from './components/layout/Layout';

// Devis
import Quotes from './pages/quotes/Quotes';
import NewQuote from './pages/quotes/NewQuote';
import QuoteDetail from './pages/quotes/QuoteDetail';

// ==================== COMPOSANTS DE PROTECTION ====================

// Protection de base (authentification uniquement)
const ProtectedRoute = ({ children }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Protection super-admin
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

// Protection owner uniquement
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
    return (
        <LanguageProvider>
            <Router>
                <Routes>
                    {/* Routes publiques */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* Routes protégées (avec Layout) */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="sales" element={<Sales />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="archives" element={<Archives />} />
                        <Route path="quotes" element={<Quotes />} />
                        <Route path="quotes/new" element={<NewQuote />} />
                        <Route path="quotes/:id" element={<QuoteDetail />} />


                        
                        {/* Routes réservées au propriétaire */}
                        <Route path="employees" element={
                            <OwnerRoute>
                                <Employees />
                            </OwnerRoute>
                        } />
                        <Route path="settings" element={
                            <OwnerRoute>
                                <Settings />
                            </OwnerRoute>
                        } />
                        <Route path="subscription" element={
                            <OwnerRoute>
                                <Subscription />
                            </OwnerRoute>
                        } />
                        <Route path="settings/establishments" element={
                            <OwnerRoute>
                                <Establishments />
                            </OwnerRoute>
                        } />
                    </Route>
                    
                    {/* Routes super-admin (sans Layout) */}
                    <Route path="/admin" element={
                        <SuperAdminRoute>
                            <AdminDashboard />
                        </SuperAdminRoute>
                    } />
                    <Route path="/admin/companies" element={
                        <SuperAdminRoute>
                            <AdminCompanies />
                        </SuperAdminRoute>
                    } />
                    <Route path="/admin/users" element={
                        <SuperAdminRoute>
                            <AdminUsers />
                        </SuperAdminRoute>
                    } />
                    <Route path="/admin/logs" element={
                        <SuperAdminRoute>
                            <AdminLogs />
                        </SuperAdminRoute>
                    } />
                    
                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            <InstallPrompt />
        </LanguageProvider>
    );
}

export default App;