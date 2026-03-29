/**
 * COMPOSANT NOTIFICATION BELL - Icône avec alertes dynamiques
 */

import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import Modal from './Modal';

const NotificationBell = () => {
    const [alertCount, setAlertCount] = useState(0);
    const [alerts, setAlerts] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const hasFetched = useRef(false);

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

    // Charger les alertes UNE SEULE FOIS au montage
    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchAlerts();
        }
    }, []);

    const openModal = () => {
        fetchAlerts(); // Recharger avant d'ouvrir
        setModalOpen(true);
    };

    return (
        <>
            <button
                onClick={openModal}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    color: '#6B7280',
                    position: 'relative',
                    transition: 'all 0.2s ease'
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
                        backgroundColor: '#EF4444',
                        color: 'white',
                        fontSize: '0.625rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {alertCount > 99 ? '99+' : alertCount}
                    </span>
                )}
            </button>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="📢 Alertes et notifications"
                size="md"
            >
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '32px' }}>
                            Chargement...
                        </div>
                    ) : (
                        <>
                            {alerts?.outOfStock?.count > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#EF4444', marginBottom: '8px' }}>
                                        ⚠️ Rupture de stock ({alerts.outOfStock.count})
                                    </h4>
                                    {alerts.outOfStock.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#FEE2E2',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span style={{ color: '#EF4444' }}>Stock: 0</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {alerts?.lowStock?.count > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#F59E0B', marginBottom: '8px' }}>
                                        📉 Stock faible ({alerts.lowStock.count})
                                    </h4>
                                    {alerts.lowStock.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#FEF3C7',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span>Stock: {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {alerts?.expiringSoon?.count > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#F59E0B', marginBottom: '8px' }}>
                                        ⏰ Expiration proche ({alerts.expiringSoon.count})
                                    </h4>
                                    {alerts.expiringSoon.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#FEF3C7',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span>Expire le {new Date(item.expirationDate).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {alerts?.expired?.count > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#EF4444', marginBottom: '8px' }}>
                                        ❌ Produits expirés ({alerts.expired.count})
                                    </h4>
                                    {alerts.expired.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#FEE2E2',
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span><strong>{item.name}</strong></span>
                                            <span>Expiré le {new Date(item.expirationDate).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {alerts?.expiringSoon?.count === 0 && alerts?.lowStock?.count === 0 && alerts?.outOfStock?.count === 0 && alerts?.expired?.count === 0 && (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                                    ✅ Tout est bon ! Aucune alerte.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default NotificationBell;