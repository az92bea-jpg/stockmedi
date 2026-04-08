/**
 * PAGE TABLEAU DE BORD - Vue d'ensemble de l'activité
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { resetAndArchiveDashboard } from '../../services/archiveService';
import { authService } from '../../services/authService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../../components/ui/Icon';
import EstablishmentSelector from '../../components/establishment/EstablishmentSelector';

const Dashboard = () => {
    const { t } = useLanguage();
    const user = authService.getCurrentUser();
    const [loading, setLoading] = useState(true);
    const [archiving, setArchiving] = useState(false);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);
    const [isLoadingEstablishments, setIsLoadingEstablishments] = useState(true);
    const [subscription, setSubscription] = useState(null);

    // Charger l'abonnement
    const loadSubscription = useCallback(async () => {
        try {
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
        } catch (err) {
            console.error('Erreur chargement abonnement:', err);
        }
    }, []);

    // Charger les établissements (uniquement si plan Enterprise)
    const loadEstablishments = useCallback(async () => {
        try {
            setIsLoadingEstablishments(true);
            const response = await api.get('/establishments');
            const estList = response.establishments || [];
            setEstablishments(estList);
            if (estList.length > 0) {
                setSelectedEstablishment(estList[0]._id);
            } else {
                setSelectedEstablishment('');
            }
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        } finally {
            setIsLoadingEstablishments(false);
        }
    }, []);

    // Récupérer les données du dashboard
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Pour les propriétaires sans plan Enterprise, on ne filtre pas par établissement
            let url = '/sales/stats';
            if (selectedEstablishment && subscription?.plan === 'enterprise') {
                url += `?establishmentId=${selectedEstablishment}`;
            }
            
            const salesStats = await api.get(url);
            const alertsData = await api.get('/products/alerts');
            
            setStats(salesStats.stats);
            setAlerts(alertsData.alerts);
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedEstablishment, subscription?.plan]);

    // Chargement initial
    useEffect(() => {
        const init = async () => {
            await loadSubscription();
            
            if (user?.role === 'owner') {
                // Seulement charger les établissements si plan Enterprise
                if (subscription?.plan === 'enterprise') {
                    await loadEstablishments();
                } else {
                    setIsLoadingEstablishments(false);
                    setLoading(false);
                }
            } else {
                setLoading(false);
                setIsLoadingEstablishments(false);
            }
        };
        
        init();
    }, [user?.role, loadSubscription, loadEstablishments, subscription?.plan]);

    // Recharger les stats quand l'établissement change (uniquement pour Enterprise)
    useEffect(() => {
        if (subscription?.plan === 'enterprise' && selectedEstablishment) {
            fetchDashboardData();
        } else if (subscription?.plan !== 'enterprise' && user?.role === 'owner') {
            fetchDashboardData();
        }
    }, [selectedEstablishment, fetchDashboardData, subscription?.plan, user?.role]);

    const handleArchiveAndReset = async () => {
        setArchiving(true);
        setError('');
        
        try {
            const response = await resetAndArchiveDashboard();
            setSuccess(response.message || 'Tableau de bord archivé et réinitialisé avec succès');
            await fetchDashboardData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'archivage');
            console.error(err);
        } finally {
            setArchiving(false);
            setShowArchiveConfirm(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* En-tête avec boutons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div>
                    <h2>{t('dashboard_title')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        {t('dashboard_welcome')}
                    </p>
                </div>
                
                {(user?.role === 'owner' || user?.role === 'super-admin') && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <Link to="/archives" className="btn btn-secondary">
                            📋 Voir les archives
                        </Link>
                        <button 
                            className="btn btn-warning" 
                            onClick={() => setShowArchiveConfirm(true)}
                            disabled={archiving}
                            style={{ backgroundColor: '#F59E0B', color: 'white' }}
                        >
                            {archiving ? <Loader size="sm" /> : '📦 Archiver et réinitialiser'}
                        </button>
                    </div>
                )}
            </div>

            {/* Sélecteur d'établissement pour les propriétaires (uniquement si plan Enterprise) */}
            {user?.role === 'owner' && subscription?.plan === 'enterprise' && establishments.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <EstablishmentSelector
                        selectedId={selectedEstablishment}
                        onSelect={setSelectedEstablishment}
                    />
                </div>
            )}

            {/* Message pour les propriétaires sans plan Enterprise */}
            {user?.role === 'owner' && subscription?.plan !== 'enterprise' && !loading && (
                <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-4)' }}>
                    💡 Pour gérer plusieurs établissements, passez au plan <Link to="/subscription">Enterprise</Link>.
                </div>
            )}

            {/* Message si aucun établissement (plan Enterprise uniquement) */}
            {user?.role === 'owner' && subscription?.plan === 'enterprise' && establishments.length === 0 && !isLoadingEstablishments && (
                <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-4)' }}>
                    ⚠️ Aucun établissement trouvé. Veuillez <Link to="/settings/establishments">créer un établissement</Link> pour commencer.
                </div>
            )}

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Cartes statistiques - affichées pour tous */}
            {stats && (
                <>
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
                                <h3>
                                    <Icon name="warning" category="status" fallback="⚠️" style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem', verticalAlign: 'middle' }} />
                                    {t('alerts') || 'Alertes importantes'}
                                </h3>
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
                            <h3>
                                <Icon name="success" category="status" fallback="⚡" style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem', verticalAlign: 'middle' }} />
                                {t('quick_actions')}
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="quick-actions" style={{
                                display: 'flex',
                                gap: 'var(--spacing-3)',
                                flexWrap: 'wrap'
                            }}>
                                <Link to="/products" className="btn btn-primary">
                                    <Icon name="add" category="actions" fallback="+" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', verticalAlign: 'middle' }} />
                                    {t('add_product')}
                                </Link>
                                <Link to="/sales" className="btn btn-primary">
                                    <Icon name="sales" category="nav" fallback="💰" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', verticalAlign: 'middle' }} />
                                    {t('new_sale')}
                                </Link>
                                <Link to="/reports" className="btn btn-secondary">
                                    <Icon name="reports" category="nav" fallback="📊" style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', verticalAlign: 'middle' }} />
                                    {t('export_report')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Top produits */}
                    {stats?.topProducts?.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3>
                                    <Icon name="success" category="status" fallback="🏆" style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem', verticalAlign: 'middle' }} />
                                    {t('top_products')}
                                </h3>
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
                                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                                    <td>{product.name}</td>
                                                    <td style={{ textAlign: 'center' }}>{formatNumber(product.totalQuantity)}</td>
                                                    <td style={{ textAlign: 'right' }}><strong>{formatNumber(product.totalRevenue)} GNF</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modale de confirmation */}
            <ConfirmModal
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchiveAndReset}
                title="Archiver et réinitialiser"
                message="Cette action va archiver les données actuelles du tableau de bord et réinitialiser les compteurs. Les données archivées restent consultables. Confirmez-vous ?"
                confirmText="Oui, archiver"
                isDanger={false}
            />
        </div>
    );
};

export default Dashboard;