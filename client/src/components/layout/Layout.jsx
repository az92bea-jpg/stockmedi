/**
 * COMPOSANT LAYOUT - Structure principale de l'application
 * Contient la Sidebar, le Header et le contenu principal
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Contenu principal */}
            <div style={{
                flex: 1,
                marginLeft: '260px',
                transition: 'margin-left var(--transition-normal)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
            }} className="main-content">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main style={{
                    flex: 1,
                    padding: 'var(--spacing-6)',
                    backgroundColor: 'var(--gray-50)'
                }}>
                    <Outlet />
                </main>
            </div>

            {/* Styles responsives */}
            <style>{`
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;