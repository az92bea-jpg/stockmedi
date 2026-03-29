/**
 * COMPOSANT HEADER - Barre de navigation supérieure
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import NotificationBell from '../common/NotificationBell';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({ onMenuClick, isSidebarOpen }) => {
    const { t, language, changeLanguage } = useLanguage();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [company, setCompany] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const hasFetchedCompany = useRef(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Récupérer l'entreprise UNE SEULE FOIS
    useEffect(() => {
        const fetchCompany = async () => {
            if (user?.companyId && !hasFetchedCompany.current) {
                hasFetchedCompany.current = true;
                try {
                    const response = await api.get('/companies/me');
                    if (response.success) setCompany(response.company);
                } catch (err) {
                    console.error('Erreur chargement entreprise:', err);
                }
            }
        };
        fetchCompany();
    }, [user?.companyId]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getDisciplineLabel = (discipline) => {
        const labels = { pharmacien: 'Pharmacien', médecin: 'Médecin', infirmier: 'Infirmier', assistant: 'Assistant', comptable: 'Comptable', autre: 'Employé' };
        return labels[discipline] || 'Employé';
    };

    const isMobile = windowWidth <= 768;

    return (
        <header style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            flexWrap: 'wrap',
            gap: '12px'
        }}>
            {/* Bouton pour fermer/ouvrir la sidebar (visible sur desktop) */}
            {!isMobile && (
                <button
                    onClick={onMenuClick}
                    className="sidebar-toggle"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    title={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                >
                    {isSidebarOpen ? '◀' : '☰'}
                </button>
            )}

            {/* Bouton menu burger pour mobile */}
            {isMobile && (
                <button
                    onClick={onMenuClick}
                    className="menu-burger"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px'
                    }}
                >
                    ☰
                </button>
            )}

            {/* Titre et infos entreprise */}
            <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#111827' }}>StockMedi</h1>
                {company && <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{company.name}</div>}
            </div>

            {/* Navigation horizontale (visible sur desktop) - AVEC TRADUCTION */}
            {!isMobile && (
                <nav className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href="/dashboard" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        📊 {t('nav_dashboard')}
                    </a>
                    <a href="/products" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        📦 {t('nav_products')}
                    </a>
                    <a href="/sales" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        💰 {t('nav_sales')}
                    </a>
                    <a href="/reports" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        📄 {t('nav_reports')}
                    </a>
                    <a href="/employees" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        👥 {t('nav_employees')}
                    </a>
                    <a href="/settings" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        ⚙️ {t('nav_settings')}
                    </a>
                    <a href="/subscription" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                        💎 {t('nav_subscription')}
                    </a>
                    {user?.role === 'super-admin' && (
                        <a href="/admin" style={{ color: '#EF4444', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                            👑 {t('nav_admin')}
                        </a>
                    )}
                </nav>
            )}

            {/* Actions utilisateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <NotificationBell />
                
                {/* Sélecteur de langue */}
                <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: 'white',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="fr">🇫🇷 FR</option>
                    <option value="en">🇬🇧 EN</option>
                </select>

                {user && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{user.firstName} {user.lastName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#0F6B3A', fontWeight: 500 }}>
                            {user.role === 'owner' ? 'Propriétaire' : user.role === 'super-admin' ? 'Super Admin' : getDisciplineLabel(user.discipline)}
                        </div>
                    </div>
                )}
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F3EF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0F6B3A',
                    fontWeight: 600
                }}>
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <button onClick={handleLogout} style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4B5563'; }}>
                    🚪 {t('nav_logout')}
                </button>
            </div>
        </header>
    );
};

export default Header;