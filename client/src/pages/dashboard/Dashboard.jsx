/**
 * PAGE TABLEAU DE BORD - Vue d'ensemble de l'activité
 * - Owner : contrôle total, archive manuelle
 * - Employé : dashboard journalier (réinitialisation auto toutes les 24h)
 * Support multi-devises dynamique
 * Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    
    const [currency, setCurrency] = useState('GNF');
    const [loading, setLoading] = useState(true);
    const [archiving, setArchiving] = useState(false);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [employeeDailySales, setEmployeeDailySales] = useState(null);
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);
    const [subscription, setSubscription] = useState(null);
    
    const isInitialMount = useRef(true);

    const userPermissions = user?.permissions || [];
    const canManageStock = isOwner || userPermissions.includes('manage_stock');
    const canMakeSales = isOwner || userPermissions.includes('make_sales');
    const canViewSales = canMakeSales || userPermissions.includes('view_sales');

    const loadCompanySettings = useCallback(async () => {
        try {
            const response = await api.get('/companies/me');
            if (response.success && response.company?.settings?.currency) {
                setCurrency(response.company.settings.currency);
            }
        } catch (err) {
            console.error('Erreur chargement devise:', err);
        }
    }, []);

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

    const loadSubscription = useCallback(async () => {
        try {
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
        } catch (err) {
            console.error('Erreur chargement abonnement:', err);
        }
    }, []);

    const loadEstablishments = useCallback(async () => {
        try {
            const response = await api.get('/establishments');
            const estList = response.establishments || [];
            setEstablishments(estList);
            setSelectedEstablishment('');
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        }
    }, []);

    const fetchDashboardData = useCallback(async (establishmentId) => {
        try {
            setLoading(true);
            
            let url = '/sales/stats';
            if (isOwner && establishmentId && establishmentId !== '') {
                url += `?establishmentId=${establishmentId}`;
            }
            
            const [salesStats, alertsData] = await Promise.all([
                api.get(url),
                api.get('/products/alerts')
            ]);
            
            setStats(salesStats.stats);
            setAlerts(alertsData.alerts);
            
            //EMPLOYÉ : Récupérer ses ventes du jour
            if (isEmployee) {
                const today = new Date().toISOString().split('T')[0];
                const salesResponse = await api.get(`/sales?startDate=${today}&endDate=${today}&limit=100`);
                
                console.log('DEBUG EMPLOYÉ - Ventes brutes:', salesResponse);
                console.log('DEBUG EMPLOYÉ - User ID:', user?._id);
                
                // Filtrer les ventes de l'employé
                const mySales = (salesResponse.sales || []).filter(sale => {
                    const saleUserId = typeof sale.userId === 'object' ? sale.userId?._id : sale.userId;
                    console.log('DEBUG - Comparaison:', saleUserId, user?._id);
                    return saleUserId === user?._id;
                });
                
                console.log('DEBUG EMPLOYÉ - Mes ventes filtrées:', mySales);
                
                const totalAmount = mySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
                
                setEmployeeDailySales({
                    date: today,
                    count: mySales.length,
                    total: totalAmount,
                    sales: mySales
                });
            }
        } catch (err) {
            setError(t('error'));
            console.error('❌ Erreur dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [isOwner, isEmployee, user?._id, t]);

    useEffect(() => {
        const init = async () => {
            await loadCompanySettings();
            await loadSubscription();
            
            if (isEmployee) {
                checkAndResetEmployeeDashboard();
            }
            
            if (isOwner) {
                await loadEstablishments();
            }
            
            await fetchDashboardData('');
        };
        
        init();
    }, [isOwner, isEmployee, loadCompanySettings, loadSubscription, loadEstablishments, fetchDashboardData, checkAndResetEmployeeDashboard]);

    const handleEstablishmentChange = (newEstablishmentId) => {
        setSelectedEstablishment(newEstablishmentId);
        fetchDashboardData(newEstablishmentId);
    };

    useEffect(() => {
        if (!isInitialMount.current && establishments.length > 0 && selectedEstablishment === '') {
            fetchDashboardData('');
        }
        isInitialMount.current = false;
    }, [establishments.length, fetchDashboardData, selectedEstablishment]);

    const handleArchiveAndReset = async () => {
        setArchiving(true);
        setError('');
        
        try {
            const response = await resetAndArchiveDashboard();
            setSuccess(response.message || t('archive_and_reset_success') || 'Tableau de bord archivé et réinitialisé avec succès');
            await fetchDashboardData(selectedEstablishment);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
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
                            ? `${t('hello') || 'Bonjour'} ${user?.firstName}, ${t('daily_dashboard') || 'voici votre tableau de bord du jour'}.`
                            : t('dashboard_welcome')
                        }
                    </p>
                </div>
                
                {isOwner && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <Link to="/archives" className="btn btn-secondary">
                            📋 {t('view_archives')}
                        </Link>
                        <button 
                            className="btn btn-warning" 
                            onClick={() => setShowArchiveConfirm(true)}
                            disabled={archiving}
                            style={{ backgroundColor: '#F59E0B', color: 'white' }}
                        >
                            {archiving ? <Loader size="sm" /> : `📦 ${t('archive_and_reset')}`}
                        </button>
                    </div>
                )}
            </div>

            {/* Sélecteur d'établissement - UNIQUEMENT pour Owner Enterprise */}
            {isOwner && subscription?.plan === 'enterprise' && establishments.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <EstablishmentSelector
                        selectedId={selectedEstablishment}
                        onSelect={handleEstablishmentChange}
                    />
                </div>
            )}

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* SECTION OWNER : CA ET STATISTIQUES */}
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
                                {formatNumber(stats?.daily?.total || 0)} {currency}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('sales_today')}</div>
                            <small>{stats?.daily?.count || 0} {t('transactions')}</small>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))', color: 'white' }}>
                        <div className="card-body">
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                {formatNumber(stats?.monthly?.total || 0)} {currency}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('sales_month')}</div>
                            <small>{stats?.monthly?.count || 0} {t('transactions')}</small>
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION EMPLOYÉ : VENTES DU JOUR */}
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
                                {formatNumber(employeeDailySales.total || 0)} {currency}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('my_sales_today') || 'Mes ventes aujourd\'hui'}</div>
                            <small>{employeeDailySales.count || 0} {t('transactions')}</small>
                        </div>
                    </div>
                </div>
            )}

            {/* ALERTES */}
            {alerts && (alerts.lowStock?.count > 0 || alerts.expiringSoon?.count > 0 || alerts.outOfStock?.count > 0 || alerts.expired?.count > 0) && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>
                            <Icon name="warning" category="status" fallback="⚠️" style={{ marginRight: '0.5rem' }} />
                            {t('alerts')}
                        </h3>
                    </div>
                    <div className="card-body">
                        {alerts?.outOfStock?.count > 0 && (
                            <Link to="/products?stockStatus=out_of_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.outOfStock.count} ${t('out_of_stock_products')}`} />
                            </Link>
                        )}
                        {alerts?.lowStock?.count > 0 && (
                            <Link to="/products?stockStatus=low_stock" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.lowStock.count} ${t('low_stock_products')}`} />
                            </Link>
                        )}
                        {alerts?.expiringSoon?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="warning" message={`${alerts.expiringSoon.count} ${t('expiring_soon_products')}`} />
                            </Link>
                        )}
                        {alerts?.expired?.count > 0 && (
                            <Link to="/products" style={{ textDecoration: 'none' }}>
                                <Alert type="danger" message={`${alerts.expired.count} ${t('expired_products')}`} />
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* TOP PRODUITS */}
            {stats?.topProducts?.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header">
                        <h3>
                            <Icon name="success" category="status" fallback="🏆" style={{ marginRight: '0.5rem' }} />
                            {t('top_products')}
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('product')}</th>
                                        <th>{t('quantity_sold')}</th>
                                        <th>{t('revenue')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topProducts.slice(0, 10).map((product, index) => (
                                        <tr key={index}>
                                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                            <td>{product.name}</td>
                                            <td style={{ textAlign: 'center' }}>{formatNumber(product.totalQuantity)}</td>
                                            <td style={{ textAlign: 'right' }}><strong>{formatNumber(product.totalRevenue)} {currency}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTIONS RAPIDES */}
            <div className="card">
                <div className="card-header">
                    <h3>
                        <Icon name="success" category="status" fallback="⚡" style={{ marginRight: '0.5rem' }} />
                        {t('quick_actions')}
                    </h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                        {isEmployee && canMakeSales && (
                            <Link to="/sales" className="btn btn-primary">
                                💰 {t('new_sale')}
                            </Link>
                        )}
                        
                        {isEmployee && canManageStock && (
                            <>
                                <Link to="/products" className="btn btn-primary">
                                    📦 {t('manage_products') || 'Gérer les produits'}
                                </Link>
                                <Link to="/stock/in" className="btn btn-secondary">
                                    ⬆️ {t('stock_entry') || 'Entrée de stock'}
                                </Link>
                            </>
                        )}
                        
                        {isOwner && (
                            <>
                                <Link to="/products" className="btn btn-primary">
                                    + {t('add_product')}
                                </Link>
                                <Link to="/sales" className="btn btn-primary">
                                    💰 {t('new_sale')}
                                </Link>
                                <Link to="/reports" className="btn btn-secondary">
                                    📊 {t('export_report')}
                                </Link>
                            </>
                        )}
                        
                        {isEmployee && !canMakeSales && !canManageStock && (
                            <p style={{ color: 'var(--gray-500)' }}>{t('no_quick_actions') || 'Aucune action rapide disponible. Contactez votre administrateur.'}</p>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchiveAndReset}
                title={t('archive_and_reset')}
                message={t('archive_confirm_message') || 'Cette action va archiver les données actuelles du tableau de bord et réinitialiser les compteurs. Les données archivées restent consultables. Confirmez-vous ?'}
                confirmText={t('yes_archive') || 'Oui, archiver'}
                isDanger={false}
            />
        </div>
    );
};

export default Dashboard;