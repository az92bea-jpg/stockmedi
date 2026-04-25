/**
 * COMPOSANT LAYOUT - Structure principale de l'application
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar ouverte par defaut si true

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            position: 'relative',
            backgroundColor: '#F9FAFB'
        }}>
            <div style={{ display: 'flex', flex: 1 }}>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                
                <div className="main-content" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'margin-left 0.3s ease',
                    width: '100%'
                }}>
                    <Header onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
                    <main style={{
                        flex: 1,  // Pousse le footer vers le bas
                        padding: '24px',
                        backgroundColor: '#F9FAFB',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <Outlet />
                    </main>
                </div>
            </div>
            
            {/* Ligne de séparation */}
            {/* <div style={{ 
                height: '2px',
                backgroundColor: 'red',
                border: '1px solid black',
                marginTop: '100px',
                marginBottom: '10px',
                marginLeft: '24px',
                marginRight: '24px'
            }} />*/}
            <div style={{ 
                borderTop: '1px dashed #D1D5DB',
                marginTop: '600px',
                marginBottom: '18px',
                marginLeft: '24px',
                marginRight: '24px'
                //margin: '20px 50px'
            }} />
            <Footer />

            <style>{`
                @media (min-width: 769px) {
                    .main-content {
                        margin-left: ${sidebarOpen ? '280px' : '0'};
                        transition: margin-left 0.3s ease;
                    }
                }
                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0 !important;
                    }
                    main {
                        padding: 16px !important;
                    }
                }
                @media (max-width: 480px) {
                    main {
                        padding: 12px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Layout;