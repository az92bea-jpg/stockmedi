/**
 * COMPOSANT ADMIN NAVIGATION - Barre de navigation pour le super-admin
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

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
                👑 Dashboard Admin
            </NavLink>
            <NavLink 
                to="/admin/companies" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                🏢 Entreprises
            </NavLink>
            <NavLink 
                to="/admin/users" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                👥 Utilisateurs
            </NavLink>
            <NavLink 
                to="/admin/logs" 
                className={({ isActive }) => isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'}
            >
                📋 Logs
            </NavLink>
        </div>
    );
};

export default AdminNav;