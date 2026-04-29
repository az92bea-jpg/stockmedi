/**
 * COMPOSANT ADMIN NAVIGATION - Barre de navigation pour le super-admin
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Icon from '../ui/Icon';

const AdminNav = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div style={{
            display: 'flex',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-6)',
            paddingBottom: 'var(--spacing-4)',
            borderBottom: '1px solid var(--gray-200)',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'} end>
                <Icon name="dashboard" category="nav" fallback="📊" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Dashboard Admin
            </NavLink>
            <NavLink to="/admin/companies" className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}>
                <Icon name="establishment" category="nav" fallback="🏢" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Entreprises
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}>
                <Icon name="employees" category="nav" fallback="👥" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Utilisateurs
            </NavLink>
            <NavLink to="/admin/logs" className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}>
                <Icon name="reports" category="nav" fallback="📋" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Logs
            </NavLink>
            <NavLink to="/admin/security" className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}>
                <Icon name="lock" category="actions" fallback="🔐" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Sécurité
            </NavLink>
            
            <NavLink to="/dashboard" className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>
                <Icon name="dashboard" category="nav" fallback="🏠" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Dashboard
            </NavLink>
            
            <button className="btn btn-sm btn-danger" onClick={handleLogout} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none' }}>
                <Icon name="logout" category="actions" fallback="🚪" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                Déconnexion
            </button>
        </div>
    );
};

export default AdminNav;