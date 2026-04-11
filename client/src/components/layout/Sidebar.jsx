/**
 * COMPOSANT SIDEBAR - Menu de navigation latéral
 */

import React, { useState, useEffect, useCallback } from 'react';
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

    // Charger l'abonnement
    const fetchSubscription = useCallback(async () => {
        try {
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
        } catch (err) {
            console.error('Erreur chargement abonnement:', err);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'owner') {
            fetchSubscription();
        }
    }, [user?.role, fetchSubscription]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Menu de base (accessible à tous)
    const navItems = [
        { path: '/dashboard', name: t('nav_dashboard'), iconName: 'dashboard', fallback: '📊' },
        { path: '/products', name: t('nav_products'), iconName: 'products', fallback: '📦' },
        { path: '/sales', name: t('nav_sales'), iconName: 'sales', fallback: '💰' },
        { path: '/quotes', name: 'Devis', iconName: 'document', fallback: '📄' },
        { path: '/reports', name: t('nav_reports'), iconName: 'reports', fallback: '📄' }
    ];

    // Ajouter Employés uniquement si owner
    if (user?.role === 'owner') {
        navItems.push({ 
            path: '/employees', 
            name: t('nav_employees'), 
            iconName: 'employees', 
            fallback: '👥' 
        });
    }

    // Ajouter Paramètres uniquement si owner
    if (user?.role === 'owner') {
        navItems.push({ 
            path: '/settings', 
            name: t('nav_settings'), 
            iconName: 'settings', 
            fallback: '⚙️' 
        });
    }

    // Ajouter Abonnement uniquement si owner
    if (user?.role === 'owner') {
        navItems.push({ 
            path: '/subscription', 
            name: t('nav_subscription'), 
            iconName: 'subscription', 
            fallback: '💎' 
        });
    }

    // Ajouter le lien Établissements uniquement pour le plan Enterprise
    if (subscription?.plan === 'enterprise') {
        navItems.push({
            path: '/settings/establishments',
            name: 'Établissements',
            iconName: 'settings',
            fallback: '🏢'
        });
    }

    // Ajouter Admin pour super-admin
    if (user?.role === 'super-admin') {
        navItems.push({ 
            path: '/admin', 
            name: 'Admin', 
            iconName: 'settings', 
            fallback: '👑' 
        });
    }

    return (
        <>
            {/* Overlay pour mobile */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 998,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            <aside
                className="sidebar"
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '280px',
                    height: '100vh',
                    backgroundColor: '#111827',
                    color: '#9CA3AF',
                    transition: 'transform 0.3s ease',
                    zIndex: 999,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
                }}
            >
                {/* En-tête */}
                <div style={{ 
                    padding: '24px 20px', 
                    borderBottom: '1px solid #374151',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                            src="/assets/icons/nav/pill.svg" 
                            alt="Pilule" 
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>StockMedi</h2>
                            {user && (
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                    {user.firstName} {user.lastName}
                                    {user.role === 'employee' && <span style={{ color: '#F59E0B' }}> (Employé)</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '0 12px' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                marginBottom: '4px',
                                borderRadius: '8px',
                                backgroundColor: isActive ? '#0F6B3A' : 'transparent',
                                color: isActive ? 'white' : '#9CA3AF',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease'
                            })}
                        >
                            <Icon 
                                name={item.iconName} 
                                category="nav" 
                                fallback={item.fallback}
                                style={{ fontSize: '1.125rem' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ height: '1px', backgroundColor: '#374151', margin: '16px 20px' }} />

                {/* Déconnexion */}
                <div style={{ padding: '12px 20px', marginBottom: '24px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            width: '100%',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            color: '#9CA3AF',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#EF4444';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#9CA3AF';
                        }}
                    >
                        <Icon name="logout" category="actions" fallback="🚪" style={{ fontSize: '1.125rem' }} />
                        <span>{t('nav_logout')}</span>
                    </button>
                </div>
            </aside>

            <style>{`
                /* Overlay pour mobile */
                @media (max-width: 768px) {
                    .sidebar-overlay {
                        display: block !important;
                    }
                }
                @media (min-width: 769px) {
                    .sidebar-overlay {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Sidebar;