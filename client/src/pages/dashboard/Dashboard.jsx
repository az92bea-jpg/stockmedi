/**
 * PAGE TABLEAU DE BORD - Vue d'ensemble de l'activité
 * - Owner : contrôle total, archive manuelle
 * - Employé : dashboard journalier (réinitialisation auto toutes les 24h)
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

const EMPLOYEE_DASHBOARD_KEY = 'employee_dashboard_date';
const EMPLOYEE_SALES_KEY = 'employee_daily_sales';

const Dashboard = () => {
    const { t } = useLanguage();
    const user = authService.getCurrentUser();
    const isOwner = user?.role === 'owner' || user?.role === 'super-admin';
    const isEmployee = user?.role === 'employee';
    
    const [loading, setLoading] = useState(true);
    const [archiving, setArchiving] = useState(false);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    
    // État pour les ventes journalières de l'employé (si autorisé)
    const [employeeDailySales, setEmployeeDailySales] = useState(null);
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);
    const [subscription, setSubscription] = useState(null);

    // Vérifier les permissions de l'employé (correction : sans authService.hasPermission)
    const userPermissions = user?.permissions || [];
    const canManageStock = isOwner || userPermissions.includes('manage_stock');
    const canMakeSales = isOwner || userPermissions.includes('make_sales');
    const canViewSales = canMakeSales || userPermissions.includes('view_sales');

    // Vérifier et réinitialiser le dashboard employé si nécessaire (toutes les 24h)
    const checkAndResetEmployeeDashboard = useCallback(() => {
        const lastDate = localStorage.getItem(EMPLOYEE_DASHBOARD_KEY);
        const today = new Date().toDateString();
        
        if (lastDate !== today) {
            localStorage.setItem(EMPLOYEE_DASHBOARD_KEY, today);
            localStorage.removeItem(EMPLOYEE_SALES_KEY);
            setEmployeeDailySales(null);
            return true;
        }
        
        const savedSales = localStorage.getItem(EMPLOYEE_SALES_KEY);
        if (savedSales) {
            try {
                setEmployeeDailySales(JSON.parse(savedSales));
            } catch (e) {
                console.error('Erreur parsing ventes sauvegardées:', e);
            }
        }
        return false;
    }, []);

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
        }
    }, []);

    // Récupérer les données du dashboard
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            let url = '/sales/stats';
            if (selectedEstablishment && subscription?.plan === 'enterprise') {
                url += `?establishmentId=${selectedEstablishment}`;
            }
            
            const [salesStats, alertsData] = await Promise.all([
                api.get(url),
                api.get('/products/alerts')
            ]);
            
            setStats(salesStats.stats);
            setAlerts(alertsData.alerts);
            
            // Pour l'employé autorisé, récupérer ses ventes du jour
            if (isEmployee && canViewSales) {
                const savedSales = localStorage.getItem(EMPLOYEE_SALES_KEY);
                
                if (!savedSales) {
                    const today = new Date().toISOString().split('T')[0];
                    const salesResponse = await api.get(`/sales?startDate=${today}&endDate=${today}&limit=100`);
                    
                    const dailySalesData = {
                        date: today,
                        count: salesResponse.sales?.length || 0,
                        total: salesResponse.totals?.totalAmount || 0,
                        sales: salesResponse.sales || []
                    };
                    
                    localStorage.setItem(EMPLOYEE_SALES_KEY, JSON.stringify(dailySalesData));
                    setEmployeeDailySales(dailySalesData);
                }
            }
        } catch (err) {
            setError('Erreur lors du chargement des données');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedEstablishment, subscription?.plan, isEmployee, canViewSales]);

    // Chargement initial
    useEffect(() => {
        const init = async () => {
            await loadSubscription();
            
            if (isEmployee) {
                checkAndResetEmployeeDashboard();
            }
            
            if (isOwner && subscription?.plan === 'enterprise') {
                await loadEstablishments();
            }
            
            await fetchDashboardData();
        };
        
        init();
    }, [isOwner, isEmployee, loadSubscription, loadEstablishments, subscription?.plan, fetchDashboardData, checkAndResetEmployeeDashboard]);

    // Recharger les stats quand l'établissement change (uniquement pour owner Enterprise)
    useEffect(() => {
        if (isOwner && subscription?.plan === 'enterprise' && selectedEstablishment) {
            fetchDashboardData();
        }
    }, [selectedEstablishment, fetchDashboardData, subscription?.plan, isOwner]);

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
                        {isEmployee 
                            ? `Bonjour ${user?.firstName}, voici votre tableau de bord du jour.`
                            : t('dashboard_welcome')
                        }
                    </p>
                </div>
                
                {isOwner && (
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
            {isOwner && subscription?.plan === 'enterprise' && establishments.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <EstablishmentSelector
                        selectedId={selectedEstablishment}
                        onSelect={setSelectedEstablishment}
                    />
                </div>
            )}

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* ==================== SECTION OWNER : CA ET STATISTIQUES ==================== */}
            {isOwner && stats && (
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
                </div>
            )}

            {/* ==================== SECTION EMPLOYÉ : VENTES DU JOUR (si autorisé) ==================== */}
            {isEmployee && canViewSales && employeeDailySales && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 'var(--spacing-4)',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: 'white' }}>
                        <div className="card-body">
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                {formatNumber(employeeDailySales.total || 0)} GNF
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Mes ventes aujourd'hui</div>
                            <small>{employeeDailySales.count || 0} transactions</small>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== ALERTES (visibles par tous) ==================== */}
            {alerts && (alerts.lowStock?.count > 0 || alerts.expiringSoon?.count > 0 || alerts.outOfStock?.count > 0 || alerts.expired?.count > 0) && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>
                            <Icon name="warning" category="status" fallback="⚠️" style={{ marginRight: '0.5rem' }} />
                            Alertes importantes
                        </h3>
                    </div>
                    <div className="card-body">
                        {alerts?.outOfStock?.count > 0 && (
                            <Link to="/products?stockStatus=out_of_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.outOfStock.count} produit(s) en rupture de stock`} />
                            </Link>
                        )}
                        {alerts?.lowStock?.count > 0 && (
                            <Link to="/products?stockStatus=low_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.lowStock.count} produit(s) en stock faible (à réapprovisionner)`} />
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

            {/* ==================== TOP PRODUITS ==================== */}
            {stats?.topProducts?.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>
                            <Icon name="success" category="status" fallback="🏆" style={{ marginRight: '0.5rem' }} />
                            Top produits
                        </h3>
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
                                    {stats.topProducts.slice(0, 10).map((product, index) => (
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

            {/* ==================== ACTIONS RAPIDES (adaptées au rôle) ==================== */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <Icon name="success" category="status" fallback="⚡" style={{ marginRight: '0.5rem' }} />
                        Actions rapides
                    </h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                        {isEmployee && canMakeSales && (
                            <Link to="/sales" className="btn btn-primary">
                                💰 Nouvelle vente
                            </Link>
                        )}
                        
                        {isEmployee && canManageStock && (
                            <>
                                <Link to="/products" className="btn btn-primary">
                                    📦 Gérer les produits
                                </Link>
                                <Link to="/stock/in" className="btn btn-secondary">
                                    ⬆️ Entrée de stock
                                </Link>
                            </>
                        )}
                        
                        {isOwner && (
                            <>
                                <Link to="/products" className="btn btn-primary">
                                    + Ajouter un produit
                                </Link>
                                <Link to="/sales" className="btn btn-primary">
                                    💰 Nouvelle vente
                                </Link>
                                <Link to="/reports" className="btn btn-secondary">
                                    📊 Exporter un rapport
                                </Link>
                            </>
                        )}
                        
                        {isEmployee && !canMakeSales && !canManageStock && (
                            <p style={{ color: 'var(--gray-500)' }}>Aucune action rapide disponible. Contactez votre administrateur.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modale de confirmation d'archivage (owner uniquement) */}
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