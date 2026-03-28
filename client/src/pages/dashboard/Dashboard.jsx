/**
 * PAGE TABLEAU DE BORD - Vue d'ensemble de l'activité
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const salesStats = await api.get('/sales/stats');
            const alertsData = await api.get('/products/alerts');
            
            setStats(salesStats.stats);
            setAlerts(alertsData.alerts);
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation rapide */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-primary">📊 Tableau de bord</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 Produits</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 Ventes</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 Rapports</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ Paramètres</Link>
            </div>

            <h2>Tableau de bord</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Bienvenue sur StockMedi. Voici un aperçu de votre activité.
            </p>

            {error && <Alert type="error" message={error} />}

            {/* Cartes statistiques */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: 'white' }}>
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.daily?.total || 0)} GNF
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ventes du jour</div>
                        <small>{stats?.daily?.count || 0} transaction(s)</small>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))', color: 'white' }}>
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.monthly?.total || 0)} GNF
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Ventes du mois</div>
                        <small>{stats?.monthly?.count || 0} transaction(s)</small>
                    </div>
                </div>

                <Link to="/products?stockStatus=low_stock" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div className="card-body">
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--warning)' }}>
                                {alerts?.lowStock?.count || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Produits en stock faible</div>
                            <small style={{ color: 'var(--gray-500)' }}>Cliquez pour voir</small>
                        </div>
                    </div>
                </Link>

                <Link to="/products?stockStatus=out_of_stock" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div className="card-body">
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger)' }}>
                                {alerts?.outOfStock?.count || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Produits en rupture</div>
                            <small style={{ color: 'var(--gray-500)' }}>Cliquez pour voir</small>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Alertes */}
            {(alerts?.lowStock?.count > 0 || alerts?.expiringSoon?.count > 0 || alerts?.outOfStock?.count > 0 || alerts?.expired?.count > 0) && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>⚠️ Alertes importantes</h3>
                    </div>
                    <div className="card-body">
                        {alerts?.outOfStock?.count > 0 && (
                            <Link to="/products?stockStatus=out_of_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.outOfStock.count} produit(s) en rupture de stock`} />
                            </Link>
                        )}
                        {alerts?.lowStock?.count > 0 && (
                            <Link to="/products?stockStatus=low_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.lowStock.count} produit(s) en stock faible`} />
                            </Link>
                        )}
                        {alerts?.expiringSoon?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.expiringSoon.count} produit(s) expirent dans les 30 jours`} />
                            </Link>
                        )}
                        {alerts?.expired?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.expired.count} produit(s) sont expirés`} />
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Actions rapides */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3>⚡ Actions rapides</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                        <Link to="/products" className="btn btn-primary">
                            + Ajouter un produit
                        </Link>
                        <Link to="/sales" className="btn btn-primary">
                            💰 Nouvelle vente
                        </Link>
                        <Link to="/reports" className="btn btn-secondary">
                            📊 Exporter rapport
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top produits */}
            {stats?.topProducts?.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3>🏆 Top 10 des produits les plus vendus</h3>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Produit</th>
                                        <th>Quantité vendue</th>
                                        <th>Chiffre d'affaires</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topProducts.map((product, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{product.name}</td>
                                            <td>{formatNumber(product.totalQuantity)}</td>
                                            <td><strong>{formatNumber(product.totalRevenue)} GNF</strong></td>
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

export default Dashboard;