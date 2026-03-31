/**
 * COMPOSANT LAYOUT - Structure principale de l'application
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="main-content" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease'
            }}>
                <Header onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
                <main style={{
                    flex: 1,
                    padding: '24px',
                    backgroundColor: '#F9FAFB',
                    // Éviter le débordement sur mobile
                    overflowX: 'auto',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <Outlet />
                </main>
                <Footer />
            </div>

            <style>{`
                /* Desktop : le contenu principal se décale quand la sidebar est ouverte */
                @media (min-width: 769px) {
                    .main-content {
                        margin-left: ${sidebarOpen ? '280px' : '0'};
                        transition: margin-left 0.3s ease;
                    }
                }
                
                /* Mobile : le contenu principal reste toujours à gauche (pas de marge) */
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0 !important;
                    }
                    main {
                        padding: 16px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;