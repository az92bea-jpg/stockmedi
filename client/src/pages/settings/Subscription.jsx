/**
 * PAGE ABONNEMENT - Gestion des plans
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Subscription = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState([]);

    // Récupérer l'abonnement
    const fetchSubscription = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/subscription');
            setSubscription(response.subscription);
            setPlans(response.plans || []);
        } catch (err) {
            setError('Erreur lors du chargement de l\'abonnement');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const handleCancel = async () => {
        if (!window.confirm('Annuler votre abonnement ? Vous pourrez continuer jusqu\'à la fin de la période.')) return;
        
        setSaving(true);
        setError('');
        
        try {
            const response = await api.put('/subscription/cancel');
            setSuccess(response.message);
            fetchSubscription();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'annulation');
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
                setError('Erreur lors de l\'initialisation du paiement');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'initialisation du paiement');
            console.error(err);
        } finally {
            setLoadingPayment(false);
        }
    };

    const formatPrice = (price) => {
        return price?.toLocaleString() || 0;
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-outline">📊 Tableau de bord</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 Produits</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 Ventes</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 Rapports</Link>
                <Link to="/employees" className="btn btn-sm btn-outline">👥 Employés</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ Paramètres</Link>
                <Link to="/subscription" className="btn btn-sm btn-primary">💎 Abonnement</Link>
            </div>

            <h2>Abonnement</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Gérez votre abonnement et choisissez le plan adapté à vos besoins
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Abonnement actuel */}
            {subscription && (
                <div className="card" style={{ marginBottom: 'var(--spacing-6)', background: `linear-gradient(135deg, ${subscription.planColor || '#0F6B3A'}20, white)` }}>
                    <div className="card-header">
                        <h3>📋 Votre abonnement actuel</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: subscription.planColor || 'var(--primary-500)' }}>
                                    {subscription.planName}
                                </div>
                                <div style={{ marginTop: 'var(--spacing-2)' }}>
                                    <strong>Statut:</strong>{' '}
                                    <span className={subscription.isActive ? 'badge-success' : 'badge-danger'}>
                                        {subscription.isActive ? 'Actif' : 'Expiré'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Valable jusqu'au:</strong> {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                    <strong>Jours restants:</strong> {subscription.daysRemaining} jours
                                </div>
                                {subscription.autoRenew && (
                                    <div>
                                        <strong>Renouvellement:</strong> Automatique
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
                                        Annuler l'abonnement
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans d'abonnement */}
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>📊 Choisissez votre plan</h3>
            
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
                                Actuel
                            </div>
                        )}
                        <div className="card-header" style={{ textAlign: 'center' }}>
                            <h3>{plan.name}</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-500)' }}>
                                {plan.price === 0 ? 'Gratuit' : `${formatPrice(plan.price)} GNF`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                / {plan.duration} jours
                            </div>
                        </div>
                        <div className="card-body">
                            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-4)', lineHeight: '1.8' }}>
                                <li>📦 {plan.maxProducts} produits max</li>
                                <li>👥 {plan.maxEmployees} employés max</li>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx}>
                                        {feature.includes('advanced') ? '⚡ ' : '✓ '}
                                        {feature === 'stock_basic' && 'Gestion de stock basique'}
                                        {feature === 'stock_advanced' && 'Gestion de stock avancée'}
                                        {feature === 'sales_basic' && 'Ventes basiques'}
                                        {feature === 'sales_advanced' && 'Ventes avancées + panier'}
                                        {feature === 'reports_basic' && 'Rapports basiques'}
                                        {feature === 'reports_advanced' && 'Rapports avancés + graphiques'}
                                        {feature === 'pdf_exports' && 'Export PDF/Excel'}
                                        {feature === 'employees' && 'Gestion des employés'}
                                        {feature === 'advanced_stats' && 'Statistiques avancées'}
                                        {feature === 'multiple_locations' && 'Multi-emplacements'}
                                        {feature === 'api_access' && 'API Access'}
                                        {feature === 'priority_support' && 'Support prioritaire'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="card-footer">
                            {subscription?.plan !== plan.id && (
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={saving || loadingPayment}
                                >
                                    {loadingPayment ? '⏳ Redirection...' : 
                                     plan.price === 0 ? 'Commencer l\'essai' : `💰 Payer ${formatPrice(plan.price)} GNF`}
                                </button>
                            )}
                            {subscription?.plan === plan.id && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%' }}
                                    disabled
                                >
                                    Plan actuel
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