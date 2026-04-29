/**
 * PAGE LOGS - Historique des activités (Super-Admin)
 * ⭐ Onglets : Activités | Sécurité
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import Icon from '../../components/ui/Icon';
import AdminNav from '../../components/admin/AdminNav';

const AdminLogs = () => {
    const [activeTab, setActiveTab] = useState('activities'); // 'activities' | 'security'
    const [logs, setLogs] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');
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
                
                const userLogs = recentUsers.map(user => ({ id: user._id, type: 'user', date: user.createdAt, email: user.email, role: user.role, action: 'Inscription', details: `Nouvel utilisateur: ${user.email}` }));
                const salesLogs = recentSales.map(sale => ({ id: sale._id, type: 'sale', date: sale.createdAt, company: sale.companyId?.name || 'Inconnu', saleNumber: sale.saleNumber, amount: sale.total, action: 'Vente', details: `Vente #${sale.saleNumber} - ${sale.total.toLocaleString()} GNF` }));
                const subscriptionLogs = (recentSubscriptions || []).map(sub => ({ id: sub._id, type: 'subscription', date: sub.createdAt, company: sub.companyId?.name || 'Inconnu', plan: sub.plan, action: 'Abonnement', details: `${sub.companyId?.name || 'Une entreprise'} a souscrit au plan ${sub.plan}` }));
                
                let allLogs = [...userLogs, ...salesLogs, ...subscriptionLogs];
                allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
                setLogs(allLogs);
            }
        } catch (err) {
            setError('Erreur lors du chargement des logs');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSecurityLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/security-logs');
            setSecurityLogs(response.logs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => { if (activeTab === 'security') fetchSecurityLogs(); }, [activeTab]);

    const handleDeleteLog = async () => {
        try {
            await api.delete(`/admin/logs/${deleteModal.logId}?type=${deleteModal.logType}`);
            setSuccess('Log supprimé');
            fetchLogs();
            setDeleteModal({ isOpen: false, logId: null, logType: null, logDetails: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const handleClearAll = async () => {
        try {
            await api.delete(`/admin/logs/clear-all?type=${clearModal.type}`);
            setSuccess(`Logs supprimés`);
            fetchLogs();
            setClearModal({ isOpen: false, type: 'all' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur');
        }
    };

    const getTypeBadge = (type) => {
        switch(type) {
            case 'user': return { bg: '#DBEAFE', color: '#1E40AF', icon: '👤', label: 'Utilisateur' };
            case 'sale': return { bg: '#D1FAE5', color: '#065F46', icon: '💰', label: 'Vente' };
            case 'subscription': return { bg: '#FEF3C7', color: '#92400E', icon: '💎', label: 'Abonnement' };
            default: return { bg: '#F3F4F6', color: '#374151', icon: '📋', label: 'Autre' };
        }
    };

    const getSecurityAction = (action) => {
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

    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

    if (loading && logs.length === 0 && securityLogs.length === 0) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <AdminNav />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                <div>
                    <h2>Historique et sécurité</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Consultez toutes les actions de la plateforme</p>
                </div>
                {activeTab === 'activities' && (
                    <button className="btn btn-danger" onClick={() => setClearModal({ isOpen: true, type: 'all' })}>
                        <Icon name="delete" category="actions" fallback="🗑️" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                        Supprimer tous les logs
                    </button>
                )}
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                <button className={`btn btn-sm ${activeTab === 'activities' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('activities')}>
                    <Icon name="reports" category="nav" fallback="📋" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Activités
                </button>
                <button className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('security')}>
                    <Icon name="lock" category="actions" fallback="🔐" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Sécurité
                </button>
            </div>

            {/* Onglet Activités */}
            {activeTab === 'activities' && (
                <>
                    <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>Tous</button>
                                <button className={`btn btn-sm ${filter === 'user' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('user')}>👤 Utilisateurs</button>
                                <button className={`btn btn-sm ${filter === 'sale' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('sale')}>💰 Ventes</button>
                                <button className={`btn btn-sm ${filter === 'subscription' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('subscription')}>💎 Abonnements</button>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                            <div style={{ minWidth: '700px' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                                    <div style={{ width: '180px' }}>Date</div><div style={{ width: '100px' }}>Type</div><div style={{ width: '200px' }}>Élément</div><div style={{ width: '100px' }}>Action</div><div style={{ flex: 1 }}>Détails</div><div style={{ width: '60px' }}></div>
                                </div>
                                {filteredLogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>Aucun log</div>
                                ) : (
                                    filteredLogs.map((log, index) => {
                                        const badge = getTypeBadge(log.type);
                                        return (
                                            <div key={log.id || index} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', alignItems: 'center', fontSize: '0.875rem' }}>
                                                <div style={{ width: '180px' }}>{new Date(log.date).toLocaleString('fr-FR')}</div>
                                                <div style={{ width: '100px' }}><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 500, backgroundColor: badge.bg, color: badge.color }}>{badge.icon} {badge.label}</span></div>
                                                <div style={{ width: '200px' }}>{log.email || log.company || log.saleNumber || '-'}</div>
                                                <div style={{ width: '100px', fontWeight: 500 }}>{log.action}</div>
                                                <div style={{ flex: 1, color: 'var(--gray-600)' }}>{log.details}</div>
                                                <div style={{ width: '60px' }}>
                                                    <button className="btn btn-sm btn-outline" onClick={() => setDeleteModal({ isOpen: true, logId: log.id, logType: log.type, logDetails: log.details })} style={{ color: 'var(--danger)' }}>
                                                        <Icon name="delete" category="actions" fallback="🗑️" style={{ width: '14px', height: '14px' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
                <div className="card">
                    <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                        <div style={{ minWidth: '700px' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                                <div style={{ width: '180px' }}>Date</div><div style={{ width: '200px' }}>Utilisateur</div><div style={{ width: '180px' }}>Action</div><div style={{ width: '150px' }}>IP</div>
                            </div>
                            {securityLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>Aucun log de sécurité</div>
                            ) : (
                                securityLogs.map(log => {
                                    const actionInfo = getSecurityAction(log.action);
                                    return (
                                        <div key={log._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem', alignItems: 'center' }}>
                                            <div style={{ width: '180px' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</div>
                                            <div style={{ width: '200px' }}>{log.userEmail || '-'}</div>
                                            <div style={{ width: '180px', color: actionInfo.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Icon name={actionInfo.icon} category={actionInfo.category} fallback={actionInfo.fallback} style={{ width: '16px', height: '16px' }} />
                                                {actionInfo.text}
                                            </div>
                                            <div style={{ width: '150px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress || '-'}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, logId: null, logType: null, logDetails: '' })} onConfirm={handleDeleteLog} title="Supprimer ce log" message={`Supprimer ce log : "${deleteModal.logDetails}" ?`} confirmText="Supprimer" isDanger={true} />
            <ConfirmModal isOpen={clearModal.isOpen} onClose={() => setClearModal({ isOpen: false, type: 'all' })} onConfirm={handleClearAll} title="Supprimer tous les logs" message={`Supprimer tous les logs d'activités ? Irréversible.`} confirmText="Tout supprimer" isDanger={true} />
        </div>
    );
};

export default AdminLogs;