/**
 * COMPOSANT HEADER - Barre de navigation supérieure
 * Traductions FR/EN complètes
 * Bouton déconnexion supprimé (reste dans la sidebar)
 */

import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import NotificationBell from '../common/NotificationBell';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../ui/Icon';

const Header = ({ onMenuClick, isSidebarOpen }) => {
    const { t, language, changeLanguage } = useLanguage();
    const user = authService.getCurrentUser();
    const [company, setCompany] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const hasFetchedCompany = useRef(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (hasFetchedCompany.current) return;
        
        const fetchCompany = async () => {
            if (user?.companyId) {
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

    const getDisciplineLabel = (discipline) => {
        const labels = { 
            pharmacien: t('pharmacist'), 
            médecin: t('doctor'), 
            infirmier: t('nurse'), 
            assistant: t('assistant'), 
            comptable: t('accountant'), 
            autre: t('employee')
        };
        return labels[discipline] || t('employee');
    };

    const getRoleLabel = (role) => {
        if (role === 'owner') return t('owner');
        if (role === 'super-admin') return t('super_admin');
        return getDisciplineLabel(user?.discipline);
    };

    const isMobile = windowWidth <= 768;

    return (
        <header style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)', /* Ombre très légère */
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
                    title={isSidebarOpen ? t('close_menu') : t('open_menu')}
                >
                    {isSidebarOpen ? '◀' : '☰'}
                </button>
            )}

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
                    title={t('menu')}
                >
                    ☰
                </button>
            )}

            <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#111827' }}>StockMedi</h1>
                {company && <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{company.name}</div>}
            </div>

            {!isMobile && (
                <nav className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <a href="/dashboard" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="dashboard" category="nav" fallback="📊" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_dashboard')}
                    </a>
                    <a href="/products" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="products" category="nav" fallback="📦" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_products')}
                    </a>
                    <a href="/sales" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="sales" category="nav" fallback="💰" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_sales')}
                    </a>
                    <a href="/reports" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="reports" category="nav" fallback="📄" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_reports')}
                    </a>
                    <a href="/employees" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="employees" category="nav" fallback="👥" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_employees')}
                    </a>
                    <a href="/settings" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="settings" category="nav" fallback="⚙️" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_settings')}
                    </a>
                    <a href="/subscription" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="subscription" category="nav" fallback="💎" style={{ width: '1rem', height: '1rem' }} />
                        {t('nav_subscription')}
                    </a>
                    {user?.role === 'super-admin' && (
                        <a href="/admin" style={{ color: '#EF4444', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="settings" category="nav" fallback="👑" style={{ width: '1rem', height: '1rem' }} />
                            {t('nav_admin')}
                        </a>
                    )}
                </nav>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <NotificationBell />
                
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
                            {getRoleLabel(user.role)}
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
            </div>
        </header>
    );
};

export default Header;