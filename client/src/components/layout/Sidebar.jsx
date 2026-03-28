/**
 * COMPOSANT SIDEBAR - Menu de navigation latéral
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', name: 'Tableau de bord', icon: '📊' },
        { path: '/products', name: 'Produits', icon: '📦' },
        { path: '/sales', name: 'Ventes', icon: '💰' },
        { path: '/reports', name: 'Rapports', icon: '📄' },
        { path: '/settings', name: 'Paramètres', icon: '⚙️' }
    ];

    return (
        <>
            {/* Overlay mobile */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999,
                        display: 'none'
                    }}
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '260px',
                    height: '100vh',
                    backgroundColor: '#111827',
                    color: '#9CA3AF',
                    transition: 'transform 0.25s ease',
                    zIndex: 1000,
                    overflowY: 'auto',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'  // ← AJOUTE CETTE LIGNE
                }}
            >
                {/* En-tête */}
                <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>💊</span>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>StockMedi</h2>
                    </div>
                    {user && (
                        <div style={{ marginTop: '12px', fontSize: '0.75rem' }}>
                            <div>{user.firstName} {user.lastName}</div>
                            <div style={{ color: '#6B7280' }}>{user.role === 'owner' ? 'Propriétaire' : 'Employé'}</div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{ padding: '12px', flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
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
                            onClick={() => onClose()}
                        >
                            <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Séparateur */}
                <div style={{ height: '1px', backgroundColor: '#374151', margin: '8px 12px' }} />

                {/* Déconnexion - EN BAS */}
                <div style={{ padding: '12px', marginBottom: '16px' }}>
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
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            <style>{`
                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }
                    .sidebar.open {
                        transform: translateX(0);
                    }
                    .sidebar-overlay {
                        display: block !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Sidebar;