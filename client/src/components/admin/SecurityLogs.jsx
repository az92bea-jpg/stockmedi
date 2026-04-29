/**
 * PAGE LOGS DE SÉCURITÉ - Super Admin
 * Affichage des connexions et actions sensibles
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../common/Loader';
import Icon from '../ui/Icon';

const SecurityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/admin/security-logs');
                setLogs(response.logs || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getActionLabel = (action) => {
        const labels = {
            login_success: { text: 'Connexion réussie', color: '#10B981', icon: 'success', category: 'status', fallback: '✅' },
            login_failed: { text: 'Connexion échouée', color: '#EF4444', icon: 'error', category: 'status', fallback: '❌' },
            password_changed: { text: 'Mot de passe changé', color: '#F59E0B', icon: 'warning', category: 'status', fallback: '🔑' },
            '2fa_enabled': { text: '2FA activé', color: '#3B82F6', icon: 'lock', category: 'actions', fallback: '🔐' },
            '2fa_disabled': { text: '2FA désactivé', color: '#6B7280', icon: 'unlock', category: 'actions', fallback: '🔓' },
            account_deleted: { text: 'Compte supprimé', color: '#EF4444', icon: 'delete', category: 'actions', fallback: '🗑️' },
            account_created: { text: 'Compte créé', color: '#10B981', icon: 'add', category: 'actions', fallback: '➕' }
        };
        return labels[action] || { text: action, color: '#6B7280', icon: 'info', category: 'status', fallback: '📝' };
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <h2>🔐 Logs de sécurité</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                Historique des connexions et actions sensibles
            </p>

            <div className="card">
                <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                    <div style={{ minWidth: '700px' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <div style={{ width: '180px' }}>Date</div>
                            <div style={{ width: '200px' }}>Utilisateur</div>
                            <div style={{ width: '180px' }}>Action</div>
                            <div style={{ width: '150px' }}>IP</div>
                        </div>
                        {logs.map(log => {
                            const actionInfo = getActionLabel(log.action);
                            return (
                                <div key={log._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem' }}>
                                    <div style={{ width: '180px' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</div>
                                    <div style={{ width: '200px' }}>{log.userEmail || '-'}</div>
                                    <div style={{ width: '180px', color: actionInfo.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name={actionInfo.icon} category={actionInfo.category} fallback={actionInfo.fallback} style={{ width: '16px', height: '16px' }} />
                                        {actionInfo.text}
                                    </div>
                                    <div style={{ width: '150px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress || '-'}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityLogs;