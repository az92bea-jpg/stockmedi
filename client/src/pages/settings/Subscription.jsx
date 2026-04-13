/**
 * PAGE ABONNEMENT - Gestion des plans
 * ⭐ Prix affichés en EUR (conformité Stripe)
 * ⭐ Option paiement local / Mobile Money
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const Subscription = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState([]);

    // ⭐ Formatage du prix en EUR (divise par 100 car Stripe stocke en centimes)
    const formatPriceEUR = (priceInCents) => {
        if (!priceInCents && priceInCents !== 0) return '0,00 €';
        const euros = priceInCents / 100;
        return euros.toLocaleString('fr-FR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) + ' €';
    };

    const fetchSubscription = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
            setPlans(response.plans || []);
        } catch (err) {
            setError(t('error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const handleCancel = async () => {
        if (!window.confirm(`${t('cancel_confirm') || 'Annuler votre abonnement ? Vous pourrez continuer jusqu\'à la fin de la période.'}`)) return;
        
        setSaving(true);
        setError('');
        
        try {
            const response = await api.put('/subscription/cancel');
            setSuccess(response.message);
            fetchSubscription();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setSaving(false);
        }
    };

    const handleSubscribe = async (planId) => {
        setLoadingPayment(true);
        setError('');
        
        try {
            const response = await api.post('/payment/create-checkout-session', {
                plan: planId
            });
            
            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                setError(t('payment_error') || 'Erreur lors de l\'initialisation du paiement');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            console.error(err);
        } finally {
            setLoadingPayment(false);
        }
    };

    // ⭐ Rediriger vers le paiement local
    const handleLocalPayment = (planId) => {
        navigate(`/local-payment?plan=${planId}`);
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <h2>{t('subscription_title')}</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                {t('subscription_subtitle')}
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Abonnement actuel */}
            {subscription && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)', background: `linear-gradient(135deg, ${subscription.planColor || '#0F6B3A'}20, white)` }}>
                    <div className="card-header">
                        <h3>{t('current_subscription')}</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: subscription.planColor || 'var(--primary-500)' }}>
                                    {subscription.planName}
                                </div>
                                <div style={{ marginTop: 'var(--spacing-2)' }}>
                                    <strong>{t('status')}:</strong>{' '}
                                    <span className={subscription.isActive ? 'badge-success' : 'badge-danger'}>
                                        {subscription.isActive ? t('active') : t('expired')}
                                    </span>
                                </div>
                                <div>
                                    <strong>{t('valid_until')}:</strong> {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                    <strong>{t('days_remaining')}:</strong> {subscription.daysRemaining} {t('days') || 'jours'}
                                </div>
                                {subscription.autoRenew && (
                                    <div>
                                        <strong>{t('auto_renew')}:</strong> {t('yes')}
                                    </div>
                                )}
                            </div>
                            <div>
                                {subscription.isActive && subscription.plan !== 'trial' && (
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        {t('cancel')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans d'abonnement */}
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{t('choose_plan')}</h3>
            
            {/* ⭐ Option de paiement local */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)', backgroundColor: '#F0FDF4', border: '1px solid #0F6B3A' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#0F6B3A' }}>
                            <Icon name="mobile" category="social" fallback="📱" style={{ width: '20px', height: '20px', marginRight: '6px' }} />
                            {t('local_payment_option')}
                        </h4>
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
                            {t('local_payment_description')}
                        </p>
                    </div>
                    <button 
                        className="btn btn-success"
                        onClick={() => navigate('/local-payment')}
                        style={{ backgroundColor: '#0F6B3A', color: 'white', border: 'none' }}
                    >
                        <Icon name="money" category="actions" fallback="💰" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {t('pay_by_mobile_money')}
                    </button>
                </div>
            </div>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-6)'
            }}>
                {plans.map(plan => (
                    <div key={plan.id} className="card" style={{
                        border: subscription?.plan === plan.id ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)',
                        position: 'relative'
                    }}>
                        {subscription?.plan === plan.id && (
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '20px',
                                backgroundColor: 'var(--primary-500)',
                                color: 'white',
                                padding: '2px 12px',
                                borderRadius: '20px',
                                fontSize: '0.7rem'
                            }}>
                                {t('current_plan')}
                            </div>
                        )}
                        <div className="card-header" style={{ textAlign: 'center' }}>
                            <h3>{plan.name}</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-500)' }}>
                                {plan.price === 0 ? t('free') : formatPriceEUR(plan.price)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                / {plan.duration} {t('days') || 'jours'}
                            </div>
                        </div>
                        <div className="card-body">
                            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-4)', lineHeight: '1.8' }}>
                                <li>
                                    <Icon name="products" category="nav" fallback="📦" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                    {plan.maxProducts} {t('products_max')}
                                </li>
                                <li>
                                    <Icon name="employees" category="nav" fallback="👥" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                    {plan.maxEmployees} {t('employees_max')}
                                </li>
                                {plan.features.map((feature, idx) => {
                                    let featureText = '';
                                    if (feature === 'stock_basic') featureText = t('stock_basic');
                                    else if (feature === 'stock_advanced') featureText = t('stock_advanced');
                                    else if (feature === 'sales_basic') featureText = t('sales_basic');
                                    else if (feature === 'sales_advanced') featureText = t('sales_advanced');
                                    else if (feature === 'reports_basic') featureText = t('reports_basic');
                                    else if (feature === 'reports_advanced') featureText = t('reports_advanced');
                                    else if (feature === 'pdf_exports') featureText = t('pdf_exports');
                                    else if (feature === 'employees') featureText = t('employees');
                                    else if (feature === 'advanced_stats') featureText = t('advanced_stats');
                                    else if (feature === 'multiple_locations') featureText = t('multiple_locations');
                                    else if (feature === 'api_access') featureText = t('api_access');
                                    else if (feature === 'priority_support') featureText = t('priority_support');
                                    else featureText = feature;
                                    
                                    return (
                                        <li key={idx}>
                                            {feature.includes('advanced') ? (
                                                <Icon name="success" category="status" fallback="⚡" style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                            ) : (
                                                <Icon name="success" category="status" fallback="✓" style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                            )}
                                            {featureText}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {subscription?.plan !== plan.id && (
                                <>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={saving || loadingPayment}
                                    >
                                        {loadingPayment ? (
                                            <>
                                                <Icon name="clock" category="status" fallback="⏳" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                                                {t('redirecting') || 'Redirection...'}
                                            </>
                                        ) : plan.price === 0 ? (
                                            t('trial')
                                        ) : (
                                            <>
                                                <Icon name="card" category="actions" fallback="💳" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                                                {t('subscribe')} - {formatPriceEUR(plan.price)}
                                            </>
                                        )}
                                    </button>
                                    {plan.price > 0 && (
                                        <button
                                            className="btn btn-outline-success"
                                            style={{ width: '100%' }}
                                            onClick={() => handleLocalPayment(plan.id)}
                                        >
                                            <Icon name="mobile" category="social" fallback="📱" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                                            {t('pay_by_mobile_money')}
                                        </button>
                                    )}
                                </>
                            )}
                            {subscription?.plan === plan.id && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%' }}
                                    disabled
                                >
                                    {t('current_plan')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Subscription;