/**
 * PAGE AUDIT TRAIL - Historique des modifications
 * Accessible par le Owner dans Paramètres
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Icon from '../../components/ui/Icon';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/audit');
                setLogs(response.logs || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getActionColor = (action) => {
        const colors = { create: '#10B981', update: '#3B82F6', delete: '#EF4444', archive: '#F59E0B' };
        return colors[action] || '#6B7280';
    };

    const getActionIcon = (action) => {
        const icons = { 
            create: { icon: 'add', category: 'actions', fallback: '➕' }, 
            update: { icon: 'edit', category: 'actions', fallback: '✏️' }, 
            delete: { icon: 'delete', category: 'actions', fallback: '🗑️' }, 
            archive: { icon: 'archives', category: 'nav', fallback: '📁' } 
        };
        return icons[action] || { icon: 'info', category: 'status', fallback: '📝' };
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <h2>📝 Historique des actions</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                Trace de toutes les modifications dans votre espace
            </p>

            <div className="card">
                <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                    <div style={{ minWidth: '700px' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <div style={{ width: '160px' }}>Date</div>
                            <div style={{ width: '140px' }}>Utilisateur</div>
                            <div style={{ width: '100px' }}>Type</div>
                            <div style={{ flex: 1 }}>Description</div>
                        </div>
                        {logs.map(log => {
                            const actionIcon = getActionIcon(log.action);
                            return (
                                <div key={log._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem', alignItems: 'center' }}>
                                    <div style={{ width: '160px' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</div>
                                    <div style={{ width: '140px' }}>{log.userName || '-'}</div>
                                    <div style={{ width: '100px' }}>
                                        <span style={{ backgroundColor: getActionColor(log.action) + '20', color: getActionColor(log.action), padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                            <Icon name={actionIcon.icon} category={actionIcon.category} fallback={actionIcon.fallback} style={{ width: '12px', height: '12px' }} />
                                            {log.action}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>{log.description}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;