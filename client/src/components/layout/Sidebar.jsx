/**
 * COMPOSANT SIDEBAR - Menu de navigation latéral
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', name: t('nav_dashboard'), icon: '📊' },
        { path: '/products', name: t('nav_products'), icon: '📦' },
        { path: '/sales', name: t('nav_sales'), icon: '💰' },
        { path: '/reports', name: t('nav_reports'), icon: '📄' },
        { path: '/employees', name: t('nav_employees'), icon: '👥' },
        { path: '/settings', name: t('nav_settings'), icon: '⚙️' },
        { path: '/subscription', name: t('nav_subscription'), icon: '💎' }
    ];

    if (user?.role === 'super-admin') {
        navItems.push({ path: '/admin', name: 'Admin', icon: '👑' });
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
                        <span style={{ fontSize: '1.8rem' }}>💊</span>
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>StockMedi</h2>
                            {user && (
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                    {user.firstName} {user.lastName}
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
                            <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
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
                        <span style={{ fontSize: '1.125rem' }}>🚪</span>
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