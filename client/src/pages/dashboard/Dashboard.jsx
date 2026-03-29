/**
 * PAGE TABLEAU DE BORD - Vue d'ensemble de l'activité
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { useLanguage } from '../../context/LanguageContext';

const Dashboard = () => {
    const { t } = useLanguage();
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
                <Link to="/dashboard" className="btn btn-sm btn-primary">📊 {t('nav_dashboard')}</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 {t('nav_products')}</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 {t('nav_sales')}</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 {t('nav_reports')}</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ {t('nav_settings')}</Link>
            </div>

            <h2>{t('dashboard_title')}</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                {t('dashboard_welcome')}
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
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('sales_today')}</div>
                        <small>{stats?.daily?.count || 0} {t('transactions')}</small>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))', color: 'white' }}>
                    <div className="card-body">
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {formatNumber(stats?.monthly?.total || 0)} GNF
                        </div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('sales_month')}</div>
                        <small>{stats?.monthly?.count || 0} {t('transactions')}</small>
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
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{t('low_stock')}</div>
                            <small style={{ color: 'var(--gray-500)' }}>{t('click_to_view') || 'Cliquez pour voir'}</small>
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
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{t('out_of_stock')}</div>
                            <small style={{ color: 'var(--gray-500)' }}>{t('click_to_view') || 'Cliquez pour voir'}</small>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Alertes */}
            {(alerts?.lowStock?.count > 0 || alerts?.expiringSoon?.count > 0 || alerts?.outOfStock?.count > 0 || alerts?.expired?.count > 0) && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>⚠️ {t('alerts') || 'Alertes importantes'}</h3>
                    </div>
                    <div className="card-body">
                        {alerts?.outOfStock?.count > 0 && (
                            <Link to="/products?stockStatus=out_of_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.outOfStock.count} ${t('out_of_stock_products') || 'produit(s) en rupture de stock'}`} />
                            </Link>
                        )}
                        {alerts?.lowStock?.count > 0 && (
                            <Link to="/products?stockStatus=low_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.lowStock.count} ${t('low_stock_products') || 'produit(s) en stock faible'}`} />
                            </Link>
                        )}
                        {alerts?.expiringSoon?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.expiringSoon.count} ${t('expiring_soon_products') || 'produit(s) expirent dans les 30 jours'}`} />
                            </Link>
                        )}
                        {alerts?.expired?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.expired.count} ${t('expired_products') || 'produit(s) sont expirés'}`} />
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Actions rapides */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3>⚡ {t('quick_actions')}</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                        <Link to="/products" className="btn btn-primary">
                            + {t('add_product')}
                        </Link>
                        <Link to="/sales" className="btn btn-primary">
                            💰 {t('new_sale')}
                        </Link>
                        <Link to="/reports" className="btn btn-secondary">
                            📊 {t('export_report')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top produits */}
            {stats?.topProducts?.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3>🏆 {t('top_products')}</h3>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('product_name') || 'Produit'}</th>
                                        <th>{t('quantity_sold')}</th>
                                        <th>{t('revenue')}</th>
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