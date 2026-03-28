/**
 * COMPOSANT HEADER - Barre de navigation supérieure
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import NotificationBell from '../common/NotificationBell';
import api from '../../services/api';

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [company, setCompany] = useState(null);
    const hasFetched = useRef(false);

    // Récupérer les informations de l'entreprise une seule fois
    useEffect(() => {
        if (user?.companyId && !hasFetched.current) {
            hasFetched.current = true;
            const fetchCompany = async () => {
                try {
                    const response = await api.get('/companies/me');
                    if (response.success) {
                        setCompany(response.company);
                    }
                } catch (err) {
                    console.error('Erreur chargement entreprise:', err);
                }
            };
            fetchCompany();
        }
    }, [user?.companyId]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Mapping des disciplines pour l'affichage
    const getDisciplineLabel = (discipline) => {
        const labels = {
            pharmacien: 'Pharmacien',
            médecin: 'Médecin',
            infirmier: 'Infirmier',
            assistant: 'Assistant',
            comptable: 'Comptable',
            autre: 'Employé'
        };
        return labels[discipline] || 'Employé';
    };

    return (
        <header style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--gray-200)',
            padding: 'var(--spacing-3) var(--spacing-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            flexWrap: 'wrap',
            gap: 'var(--spacing-3)'
        }}>
            {/* Bouton menu mobile */}
            <button
                onClick={onMenuClick}
                style={{
                    display: 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    color: 'var(--gray-600)'
                }}
                className="menu-button"
            >
                ☰
            </button>

            {/* Titre et infos entreprise */}
            <div>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--gray-800)' }}>
                    StockMedi
                </h1>
                {company && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                        {company.name}
                    </div>
                )}
            </div>

            {/* Navigation horizontale */}
            <nav style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                <a href="/dashboard" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Tableau de bord</a>
                <a href="/products" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Produits</a>
                <a href="/sales" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Ventes</a>
                <a href="/reports" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Rapports</a>
                <a href="/employees" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>👥 Employés</a>
                <a href="/settings" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>⚙️ Paramètres</a>
                <a href="/subscription" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>💎 Abonnement</a>
                {user?.role === 'super-admin' && (
                    <a href="/admin" style={{ color: 'var(--danger)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: '4px' }}>
                        👑 Admin
                    </a>
                )}
            </nav>

            {/* Actions utilisateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                <NotificationBell />

                {/* Infos utilisateur détaillées */}
                {user && (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end',
                        marginRight: 'var(--spacing-2)'
                    }}>
                        <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: 'var(--gray-800)'
                        }}>
                            {user.firstName} {user.lastName}
                        </div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--primary-500)',
                            fontWeight: 500
                        }}>
                            {user.role === 'owner' ? 'Propriétaire' : 
                             user.role === 'super-admin' ? 'Super Admin' : 
                             getDisciplineLabel(user.discipline)}
                        </div>
                    </div>
                )}

                {/* Initiales utilisateur */}
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: user?.role === 'super-admin' ? '#F59E0B20' : 'var(--primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: user?.role === 'super-admin' ? '#F59E0B' : 'var(--primary-500)',
                    fontWeight: 600
                }}>
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>

                {/* Bouton déconnexion */}
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: 'var(--gray-600)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EF4444';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--gray-600)';
                    }}
                >
                    🚪 Déconnexion
                </button>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .menu-button {
                        display: block !important;
                    }
                    nav {
                        display: none !important;
                    }
                }
            `}</style>
        </header>
    );
};

export default Header;