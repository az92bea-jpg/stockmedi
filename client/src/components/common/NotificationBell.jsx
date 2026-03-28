/**
 * COMPOSANT NOTIFICATION BELL - Icône avec alertes dynamiques
 */

import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import Modal from './Modal';

const NotificationBell = () => {
    const [alertCount, setAlertCount] = useState(0);
    const [alerts, setAlerts] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Charger les alertes
    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getAlerts();
            setAlerts(response.alerts);
            
            const count = (response.alerts?.lowStock?.count || 0) + 
                         (response.alerts?.outOfStock?.count || 0) + 
                         (response.alerts?.expiringSoon?.count || 0) + 
                         (response.alerts?.expired?.count || 0);
            setAlertCount(count);
        } catch (err) {
            console.error('Erreur chargement alertes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const openModal = () => {
        fetchAlerts(); // Recharger avant d'ouvrir
        setModalOpen(true);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const getDaysLeft = (expirationDate) => {
        const today = new Date();
        const expDate = new Date(expirationDate);
        const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft;
    };

    return (
        <>
            {/* Icône de notification */}
            <button
                onClick={openModal}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    color: 'var(--gray-500)',
                    position: 'relative',
                    transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                🔔
                {alertCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: 'var(--danger)',
                        color: 'white',
                        fontSize: '0.625rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        {alertCount > 99 ? '99+' : alertCount}
                    </span>
                )}
            </button>

            {/* Modal des notifications */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="📢 Alertes et notifications"
                size="md"
            >
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                            Chargement...
                        </div>
                    ) : (
                        <>
                            {/* Alertes de rupture de stock */}
                            {alerts?.outOfStock?.count > 0 && (
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <h4 style={{ color: 'var(--danger)', marginBottom: 'var(--spacing-2)' }}>
                                        ⚠️ Rupture de stock ({alerts.outOfStock.count})
                                    </h4>
                                    {alerts.outOfStock.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: 'var(--spacing-2) var(--spacing-3)',
                                            backgroundColor: '#FEE2E2',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--spacing-2)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span style={{ color: 'var(--danger)' }}>Stock: 0</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Alertes de stock faible */}
                            {alerts?.lowStock?.count > 0 && (
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <h4 style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-2)' }}>
                                        📉 Stock faible ({alerts.lowStock.count})
                                    </h4>
                                    {alerts.lowStock.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: 'var(--spacing-2) var(--spacing-3)',
                                            backgroundColor: '#FEF3C7',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--spacing-2)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span style={{ color: 'var(--warning)' }}>
                                                Stock: {item.quantity} / Seuil: {item.reorderPoint}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Alertes d'expiration proche */}
                            {alerts?.expiringSoon?.count > 0 && (
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <h4 style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-2)' }}>
                                        ⏰ Expiration proche ({alerts.expiringSoon.count})
                                    </h4>
                                    {alerts.expiringSoon.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: 'var(--spacing-2) var(--spacing-3)',
                                            backgroundColor: '#FEF3C7',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--spacing-2)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span style={{ color: 'var(--warning)' }}>
                                                Expire le {formatDate(item.expirationDate)} ({getDaysLeft(item.expirationDate)} jours)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Alertes de produits expirés */}
                            {alerts?.expired?.count > 0 && (
                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    <h4 style={{ color: 'var(--danger)', marginBottom: 'var(--spacing-2)' }}>
                                        ❌ Produits expirés ({alerts.expired.count})
                                    </h4>
                                    {alerts.expired.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: 'var(--spacing-2) var(--spacing-3)',
                                            backgroundColor: '#FEE2E2',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--spacing-2)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span style={{ color: 'var(--danger)' }}>
                                                Expiré le {formatDate(item.expirationDate)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Aucune alerte */}
                            {alertCount === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: 'var(--spacing-8)',
                                    color: 'var(--gray-500)'
                                }}>
                                    ✅ Tout est bon ! Aucune alerte à signaler.
                                </div>
                            )}
                        </>
                    )}

                    {/* Lien vers produits */}
                    <div style={{
                        marginTop: 'var(--spacing-4)',
                        paddingTop: 'var(--spacing-4)',
                        borderTop: '1px solid var(--gray-200)',
                        textAlign: 'center'
                    }}>
                        <a 
                            href="/products" 
                            style={{ color: 'var(--primary-500)', textDecoration: 'none' }}
                            onClick={() => setModalOpen(false)}
                        >
                            📦 Voir tous les produits
                        </a>
                    </div>
                </div>
            </Modal>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </>
    );
};

export default NotificationBell;