/**
 * PAGE LOGS - Historique des activités (Super-Admin)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/logs');
            
            if (response.success && response.logs) {
                const recentUsers = response.logs.recentUsers || [];
                const recentSales = response.logs.recentSales || [];
                
                const userLogs = recentUsers.map(user => ({
                    id: user._id,
                    type: 'user',
                    date: user.createdAt,
                    email: user.email,
                    role: user.role,
                    action: 'Inscription',
                    details: `Nouvel utilisateur: ${user.email} (${user.role})`
                }));
                
                const salesLogs = recentSales.map(sale => ({
                    id: sale._id,
                    type: 'sale',
                    date: sale.createdAt,
                    company: sale.companyId?.name || 'Inconnu',
                    saleNumber: sale.saleNumber,
                    amount: sale.total,
                    action: 'Vente',
                    details: `Vente #${sale.saleNumber} - ${sale.total.toLocaleString()} GNF`
                }));
                
                const allLogs = [...userLogs, ...salesLogs];
                allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
                setLogs(allLogs);
            }
        } catch (err) {
            console.error('Erreur chargement logs:', err);
            setError('Erreur lors du chargement des logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatDate = (date) => {
        return new Date(date).toLocaleString('fr-FR');
    };

    const getTypeBadge = (type) => {
        if (type === 'user') {
            return { bg: '#DBEAFE', color: '#1E40AF', icon: '👤', label: 'Utilisateur' };
        }
        return { bg: '#D1FAE5', color: '#065F46', icon: '💰', label: 'Vente' };
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation Admin */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/admin" className="btn btn-sm btn-outline">📊 Dashboard Admin</Link>
                <Link to="/admin/companies" className="btn btn-sm btn-outline">🏢 Entreprises</Link>
                <Link to="/admin/users" className="btn btn-sm btn-outline">👥 Utilisateurs</Link>
                <Link to="/admin/logs" className="btn btn-sm btn-primary">📋 Logs</Link>
            </div>

            <h2>Historique des activités</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Consultez toutes les actions et événements de la plateforme
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {/* Liste des logs - Version sans tableau */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', gap: 'var(--spacing-4)', fontWeight: 600, backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-3) var(--spacing-4)' }}>
                    <div style={{ width: '180px' }}>Date</div>
                    <div style={{ width: '100px' }}>Type</div>
                    <div style={{ width: '200px' }}>Élément</div>
                    <div style={{ width: '100px' }}>Action</div>
                    <div style={{ flex: 1 }}>Détails</div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                            Aucun log trouvé
                        </div>
                    ) : (
                        logs.map((log, index) => {
                            const badge = getTypeBadge(log.type);
                            return (
                                <div key={log.id || index} style={{
                                    display: 'flex',
                                    gap: 'var(--spacing-4)',
                                    padding: 'var(--spacing-3) var(--spacing-4)',
                                    borderBottom: '1px solid var(--gray-100)',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ width: '180px', fontSize: '0.875rem' }}>
                                        {formatDate(log.date)}
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            backgroundColor: badge.bg,
                                            color: badge.color
                                        }}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    </div>
                                    <div style={{ width: '200px', fontSize: '0.875rem' }}>
                                        {log.email && <strong>{log.email}</strong>}
                                        {log.company && <div>{log.company}</div>}
                                        {log.saleNumber && <div>#{log.saleNumber}</div>}
                                    </div>
                                    <div style={{ width: '100px', fontSize: '0.875rem', fontWeight: 500 }}>
                                        {log.action}
                                    </div>
                                    <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                        {log.details}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;