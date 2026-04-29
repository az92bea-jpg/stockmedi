/**
 * COMPOSANT SIDEBAR - Menu de navigation latéral
 * Sections pliables/dépliables : Gestion, Activités, Administration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../ui/Icon';
import api from '../../services/api';

const Sidebar = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [subscription, setSubscription] = useState(null);
    const hasFetched = useRef(false);

    // États pour les sections pliables — fermées par défaut
    const [gestionOpen, setGestionOpen] = useState(false);
    const [activitesOpen, setActivitesOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);

    const fetchSubscription = useCallback(async () => {
        try {
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
        } catch (err) {
            console.error('Erreur chargement abonnement:', err);
        }
    }, []);

    useEffect(() => {
        if ((user?.role === 'owner' || user?.role === 'super-admin') && !hasFetched.current) {
            hasFetched.current = true;
            fetchSubscription();
        }
    }, [user?.role, fetchSubscription]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // ==================== SECTIONS ====================

    const gestionItems = [
        { path: '/products', name: t('nav_products'), iconName: 'products', fallback: '📦' },
        { path: '/sales', name: t('nav_sales'), iconName: 'sales', fallback: '💰' }
    ];
    if (subscription?.plan === 'enterprise') {
        gestionItems.push({ path: '/patients', name: t('nav_patients') || 'Patients', iconName: 'patients', fallback: '🩺' });
    }
    if (user?.role === 'owner') {
        gestionItems.push({ path: '/employees', name: t('nav_employees'), iconName: 'employees', fallback: '👥' });
    }


    /*
    // Tout le monde a acces au fournisseur
    const activiteItems = [
        { path: '/quotes', name: t('nav_quotes'), iconName: 'document', fallback: '📄' },
        { path: '/suppliers', name: t('nav_suppliers') || 'Fournisseurs', iconName: 'suppliers', fallback: '🏭' },
        { path: '/reports', name: t('nav_reports'), iconName: 'reports', fallback: '📊' },
        { path: '/guide', name: t('user_guide') || 'Guide', iconName: 'info', fallback: '📖' }
    ];
    */
        // Accès aux fournisseurs aux plans Premium et Enterprise.
    const activiteItems = [
        { path: '/quotes', name: t('nav_quotes'), iconName: 'document', fallback: '📄' },
        { path: '/reports', name: t('nav_reports'), iconName: 'reports', fallback: '📊' }
    ];

    // Fournisseurs : Premium et Enterprise uniquement
    if (subscription?.plan === 'premium' || subscription?.plan === 'enterprise') {
        activiteItems.splice(1, 0, { path: '/suppliers', name: t('nav_suppliers') || 'Fournisseurs', iconName: 'suppliers', fallback: '🏭' });
    }

    const adminItems = [];
    if (user?.role === 'owner' || user?.role === 'super-admin') {
        adminItems.push({ path: '/subscription', name: t('nav_subscription'), iconName: 'subscription', fallback: '💎' });
    }
    if (user?.role === 'owner') {
        adminItems.push({ path: '/settings', name: t('nav_settings'), iconName: 'settings', fallback: '⚙️' });
    }
    if (subscription?.plan === 'enterprise') {
        adminItems.push({ path: '/settings/establishments', name: t('establishments_title'), iconName: 'establishment', fallback: '🏢' });
    }
    if (user?.role === 'super-admin') {
        adminItems.push({ path: '/admin', name: t('nav_admin'), iconName: 'settings', fallback: '👑' });
    }

    // Fonction pour afficher une section pliable
    const renderSection = (title, items, isOpen, toggleOpen) => {
        if (items.length === 0) return null;
        return (
            <div style={{ marginBottom: '4px' }}>
                <button
                    onClick={toggleOpen}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                >
                    <span>{title}</span>
                    <Icon name={isOpen ? 'arrow-up' : 'arrow-down'} category="actions" fallback={isOpen ? '▴' : '▾'} style={{ width: '12px', height: '12px', transition: 'transform 0.2s' }} />
                </button>
                {isOpen && (
                    <div>
                        {items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px 10px 32px',
                                    margin: '1px 8px',
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? '#0F6B3A' : 'transparent',
                                    color: isActive ? 'white' : '#9CA3AF',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.85rem'
                                })}
                            >
                                <Icon name={item.iconName} category="nav" fallback={item.fallback} style={{ fontSize: '1rem' }} />
                                <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 }} />
            )}

            <aside className="sidebar" style={{ position: 'fixed', left: 0, top: 0, width: '280px', height: '100vh', backgroundColor: '#111827', color: '#9CA3AF', transition: 'transform 0.3s ease', zIndex: 999, overflowY: 'auto', display: 'flex', flexDirection: 'column', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
                
                {/* En-tête */}
                <div style={{ padding: '24px 20px', borderBottom: '1px solid #374151', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/assets/icons/nav/pill.svg" alt="Pilule" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>StockMedi</h2>
                            {user && (
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                    {user.firstName} {user.lastName}
                                    {user.role === 'employee' && <span style={{ color: '#F59E0B' }}> ({t('employee')})</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '8px 4px' }}>
                    {/* Dashboard */}
                    <NavLink to="/dashboard" onClick={onClose} style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', margin: '2px 8px', borderRadius: '8px', backgroundColor: isActive ? '#0F6B3A' : 'transparent', color: isActive ? 'white' : '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease' })}>
                        <Icon name="dashboard" category="nav" fallback="📊" style={{ fontSize: '1.125rem' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('nav_dashboard')}</span>
                    </NavLink>

                    {/* Séparateur */}
                    <div style={{ height: '1px', backgroundColor: '#1F2937', margin: '8px 16px' }} />

                    {/* Sections pliables */}
                    {renderSection(
                        <><Icon name="gestion" category="nav" fallback="🏥" style={{ width: '14px', height: '14px', marginRight: '6px' }} />{(t('section_management') || 'GESTION')}</>, 
                        gestionItems, gestionOpen, () => setGestionOpen(!gestionOpen)
                    )}
                    {renderSection(
                        <><Icon name="activity" category="nav" fallback="📋" style={{ width: '14px', height: '14px', marginRight: '6px' }} />{(t('section_activities') || 'ACTIVITÉS')}</>, 
                        activiteItems, activitesOpen, () => setActivitesOpen(!activitesOpen)
                    )}
                    {renderSection(
                        <><Icon name="administration" category="nav" fallback="⚙️" style={{ width: '14px', height: '14px', marginRight: '6px' }} />{(t('section_admin') || 'ADMINISTRATION')}</>, 
                        adminItems, adminOpen, () => setAdminOpen(!adminOpen)
                    )}
                </nav>

                                    {/* Guide utilisateur - en bas de la nav */}
                    <div style={{ marginBottom: '16px' }}>
                        <NavLink to="/guide" onClick={onClose} style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', margin: '1px 8px', borderRadius: '8px', backgroundColor: isActive ? '#0F6B3A' : 'transparent', color: isActive ? 'white' : '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease' })}>
                            <Icon name="info" category="status" fallback="📖" style={{ fontSize: '1.125rem' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('user_guide') || 'Guide'}</span>
                        </NavLink>
                    </div>

                                {/* Séparateur */}
                <div style={{ height: '1px', backgroundColor: '#374151', margin: '8px 20px' }} />

                {/* Déconnexion */}
                <div style={{ padding: '12px 20px', marginBottom: '24px', borderTop: '1px solid #374151', marginTop: '8px' }}>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', borderRadius: '8px', backgroundColor: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                        <Icon name="logout" category="actions" fallback="🚪" style={{ fontSize: '1.125rem' }} />
                        <span>{t('nav_logout')}</span>
                    </button>
                </div>
            </aside>

            <style>{`
                @media (max-width: 768px) { .sidebar-overlay { display: block !important; } }
                @media (min-width: 769px) { .sidebar-overlay { display: none !important; } }
            `}</style>
        </>
    );
};

export default Sidebar;