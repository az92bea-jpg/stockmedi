/**
 * COMPOSANT ADMIN NAVIGATION - Barre de navigation pour le super-admin
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';

const AdminNav = () => {
    return (
        <div style={{
            display: 'flex',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-6)',
            paddingBottom: 'var(--spacing-4)',
            borderBottom: '1px solid var(--gray-200)',
            flexWrap: 'wrap'
        }}>
            <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
                end
            >
                <Icon name="dashboard" category="nav" fallback="👑" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                Dashboard Admin
            </NavLink>
            <NavLink 
                to="/admin/companies" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                <Icon name="settings" category="nav" fallback="🏢" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                Entreprises
            </NavLink>
            <NavLink 
                to="/admin/users" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                <Icon name="employees" category="nav" fallback="👥" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                Utilisateurs
            </NavLink>
            <NavLink 
                to="/admin/logs" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                <Icon name="reports" category="nav" fallback="📋" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                Logs
            </NavLink>
        </div>
    );
};

export default AdminNav;