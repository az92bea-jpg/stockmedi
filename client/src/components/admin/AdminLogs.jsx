/**
 * PAGE LOGS - Historique des activités (Super-Admin)
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import AdminNav from '../../components/admin/AdminNav';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all'); // all, user, sale, subscription
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, logId: null, logType: null, logDetails: '' });
    const [clearModal, setClearModal] = useState({ isOpen: false, type: 'all' });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/logs');
            
            if (response.success && response.logs) {
                const recentUsers = response.logs.recentUsers || [];
                const recentSales = response.logs.recentSales || [];
                const recentSubscriptions = response.logs.recentSubscriptions || [];
                
                const userLogs = recentUsers.map(user => ({
                    id: user._id,
                    type: 'user',
                    date: user.createdAt,
                    email: user.email,
                    role: user.role,
                    action: 'Inscription',
                    details: `Nouvel utilisateur: ${user.email} (${user.role === 'owner' ? 'Propriétaire' : user.role === 'employee' ? 'Employé' : 'Super Admin'})`
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
                
                const subscriptionLogs = (recentSubscriptions || []).map(sub => ({
                    id: sub._id,
                    type: 'subscription',
                    date: sub.createdAt,
                    company: sub.companyId?.name || 'Inconnu',
                    plan: sub.plan,
                    action: 'Abonnement',
                    details: `${sub.companyId?.name || 'Une entreprise'} a souscrit au plan ${sub.plan === 'basic' ? 'Basic' : sub.plan === 'premium' ? 'Premium' : 'Enterprise'}`
                }));
                
                let allLogs = [...userLogs, ...salesLogs, ...subscriptionLogs];
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

    const handleDeleteLog = async () => {
        try {
            await api.delete(`/admin/logs/${deleteModal.logId}?type=${deleteModal.logType}`);
            setSuccess('Log supprimé avec succès');
            fetchLogs();
            setDeleteModal({ isOpen: false, logId: null, logType: null, logDetails: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const handleClearAll = async () => {
        try {
            await api.delete(`/admin/logs/clear-all?type=${clearModal.type}`);
            setSuccess(`Logs ${clearModal.type === 'all' ? 'tous' : clearModal.type} supprimés avec succès`);
            fetchLogs();
            setClearModal({ isOpen: false, type: 'all' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('fr-FR');
    };

    const getTypeBadge = (type) => {
        switch(type) {
            case 'user':
                return { bg: '#DBEAFE', color: '#1E40AF', icon: '👤', label: 'Utilisateur' };
            case 'sale':
                return { bg: '#D1FAE5', color: '#065F46', icon: '💰', label: 'Vente' };
            case 'subscription':
                return { bg: '#FEF3C7', color: '#92400E', icon: '💎', label: 'Abonnement' };
            default:
                return { bg: '#F3F4F6', color: '#374151', icon: '📋', label: 'Autre' };
        }
    };

    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <AdminNav />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                <div>
                    <h2>Historique des activités</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Consultez toutes les actions et événements de la plateforme
                    </p>
                </div>
                <button className="btn btn-danger" onClick={() => setClearModal({ isOpen: true, type: 'all' })}>
                    🗑️ Supprimer tous les logs
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                        <button 
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter('all')}
                        >
                            Tous
                        </button>
                        <button 
                            className={`btn btn-sm ${filter === 'user' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter('user')}
                        >
                            👤 Utilisateurs
                        </button>
                        <button 
                            className={`btn btn-sm ${filter === 'sale' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter('sale')}
                        >
                            💰 Ventes
                        </button>
                        <button 
                            className={`btn btn-sm ${filter === 'subscription' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter('subscription')}
                        >
                            💎 Abonnements
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des logs */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', gap: 'var(--spacing-4)', fontWeight: 600, backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-3) var(--spacing-4)' }}>
                    <div style={{ width: '180px' }}>Date</div>
                    <div style={{ width: '100px' }}>Type</div>
                    <div style={{ width: '200px' }}>Élément</div>
                    <div style={{ width: '100px' }}>Action</div>
                    <div style={{ flex: 1 }}>Détails</div>
                    <div style={{ width: '60px' }}>Actions</div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {filteredLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                            Aucun log trouvé
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => {
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
                                        {log.plan && <div>Plan: {log.plan === 'basic' ? 'Basic' : log.plan === 'premium' ? 'Premium' : 'Enterprise'}</div>}
                                    </div>
                                    <div style={{ width: '100px', fontSize: '0.875rem', fontWeight: 500 }}>
                                        {log.action}
                                    </div>
                                    <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                        {log.details}
                                    </div>
                                    <div style={{ width: '60px' }}>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => setDeleteModal({
                                                isOpen: true,
                                                logId: log.id,
                                                logType: log.type,
                                                logDetails: log.details
                                            })}
                                            style={{ color: 'var(--danger)' }}
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal confirmation suppression unique */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, logId: null, logType: null, logDetails: '' })}
                onConfirm={handleDeleteLog}
                title="Supprimer ce log"
                message={`Êtes-vous sûr de vouloir supprimer ce log : "${deleteModal.logDetails}" ? Cette action est irréversible.`}
                confirmText="Oui, supprimer"
                isDanger={true}
            />

            {/* Modal confirmation suppression massive */}
            <ConfirmModal
                isOpen={clearModal.isOpen}
                onClose={() => setClearModal({ isOpen: false, type: 'all' })}
                onConfirm={handleClearAll}
                title="Supprimer tous les logs"
                message={`Êtes-vous sûr de vouloir supprimer ${clearModal.type === 'all' ? 'tous les logs' : `les logs de type ${clearModal.type}`} ? Cette action est irréversible.`}
                confirmText="Oui, tout supprimer"
                isDanger={true}
            />
        </div>
    );
};

export default AdminLogs;