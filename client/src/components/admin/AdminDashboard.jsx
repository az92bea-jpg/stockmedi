/**
 * PAGE SUPER-ADMIN - Tableau de bord administrateur
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import AdminNav from '../../components/admin/AdminNav';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, advancedRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/advanced-stats')
            ]);
            setStats(statsRes.stats);
            setAdvancedStats(advancedRes.stats);
        } catch (err) {
            setError('Erreur lors du chargement des statistiques');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const formatPrice = (price) => {
        if (!price) return '0 GNF';
        return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF`;
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <AdminNav />

            <h2>Tableau de bord Super-Admin</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Vue globale de la plateforme StockMedi
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {/* Cartes statistiques */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-4)',
                    marginBottom: 'var(--spacing-6)'
                }}
            >
                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #0F6B3A, #0A5230)', color: 'white' }}
                >
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.totalCompanies)}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Entreprises</div>
                    </div>
                </div>

                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #1E40AF, #1E3A8A)', color: 'white' }}
                >
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.totalUsers)}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Utilisateurs</div>
                    </div>
                </div>

                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white' }}
                >
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.totalProducts)}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Produits</div>
                    </div>
                </div>

                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}
                >
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.totalSales)}
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ventes</div>
                    </div>
                </div>
            </div>

            {/* Répartition des plans */}
            {advancedStats?.companiesByPlan && advancedStats.companiesByPlan.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>📋 Répartition par plan d'abonnement</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                            {advancedStats.companiesByPlan.map(item => (
                                <div key={item._id} style={{ textAlign: 'center', minWidth: '100px' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {formatNumber(item.count)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                        {item._id === 'basic' ? 'Basic' : item._id === 'premium' ? 'Premium' : item._id === 'enterprise' ? 'Enterprise' : 'Trial'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Abonnements */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3>📊 Abonnements</h3>
                </div>
                <div className="card-body">
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--spacing-4)'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                {formatNumber(stats?.activeSubscriptions)}
                            </div>
                            <div>Abonnements actifs</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                                {formatNumber(stats?.trialSubscriptions)}
                            </div>
                            <div>En période d'essai</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                                {formatNumber(stats?.expiredSubscriptions)}
                            </div>
                            <div>Abonnements expirés</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-500)' }}>
                                {formatPrice(stats?.totalRevenue)}
                            </div>
                            <div>Chiffre d'affaires total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top entreprises */}
            {stats?.topCompanies?.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3>🏆 Top entreprises par chiffre d'affaires</h3>
                    </div>
                    <div className="card-body">
                        {stats.topCompanies.map((company, index) => (
                            <div
                                key={company._id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-2) 0',
                                    borderBottom: '1px solid var(--gray-100)'
                                }}
                            >
                                <div>
                                    <span style={{ fontWeight: 600, marginRight: 'var(--spacing-2)' }}>
                                        {index + 1}.
                                    </span>
                                    <strong>{company.companyName}</strong>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                        {company.companyEmail}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div>{formatNumber(company.totalSales)} ventes</div>
                                    <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                                        {formatPrice(company.totalRevenue)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Entreprises récentes */}
            {advancedStats?.recentCompanies && advancedStats.recentCompanies.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>🆕 Dernières entreprises inscrites</h3>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Propriétaire</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {advancedStats.recentCompanies.map(company => (
                                        <tr key={company._id}>
                                            <td>{company.name}</td>
                                            <td>{company.email}</td>
                                            <td>{company.ownerId?.firstName} {company.ownerId?.lastName}</td>
                                            <td>{new Date(company.createdAt).toLocaleDateString('fr-FR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;