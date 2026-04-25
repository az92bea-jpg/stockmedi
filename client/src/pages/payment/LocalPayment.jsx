/**
 * PAGE PAIEMENT LOCAL / MOBILE MONEY
 * Formulaire de demande de paiement pour les pays non supportés par Stripe
 * Traductions FR/EN complètes
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';

const LocalPayment = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const user = authService.getCurrentUser();
    
    // Récupérer le plan depuis l'URL (ex: /local-payment?plan=premium)
    const searchParams = new URLSearchParams(location.search);
    const selectedPlan = searchParams.get('plan') || 'basic';
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        fullName: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        phone: user?.phone || '',
        companyName: '',
        plan: selectedPlan,
        country: 'GN',
        contactMethod: 'email',
        message: ''
    });

    // Plans disponibles avec leurs noms traduits
    const plans = [
        { value: 'basic', label: 'Basic', price: '8,99€' },
        { value: 'premium', label: 'Premium', price: '18,99€' },
        { value: 'enterprise', label: 'Enterprise', price: '47,99€' }
    ];

    const countries = [
        { value: 'GN', label: 'Guinée' },
        { value: 'CI', label: 'Côte d\'Ivoire' },
        { value: 'SN', label: 'Sénégal' },
        { value: 'ML', label: 'Mali' },
        { value: 'BF', label: 'Burkina Faso' },
        { value: 'BJ', label: 'Bénin' },
        { value: 'TG', label: 'Togo' },
        { value: 'CM', label: 'Cameroun' },
        { value: 'CG', label: 'Congo' },
        { value: 'GA', label: 'Gabon' },
        { value: 'CD', label: 'RDC' },
        { value: 'GH', label: 'Ghana' },
        { value: 'NG', label: 'Nigeria' },
        { value: 'NE', label: 'Niger' },
        { value: 'LR', label: 'Liberia' },
        { value: 'ZA', label: 'Afrique du Sud' },
        { value: 'MG', label: 'Madagascar' },
        { value: 'KM', label: 'Comores' },
        { value: 'TD', label: 'Tchad' },
        { value: 'CF', label: 'Centrafrique' },
        { value: 'GQ', label: 'Guinée Équatoriale' },
        { value: 'GW', label: 'Guinée-Bissau' },
        { value: 'MR', label: 'Mauritanie' },
        { value: 'SL', label: 'Sierra Leone' },
        { value: 'TG', label: 'Togo' },
        { value: 'AO', label: 'Angola' },
        { value: 'BW', label: 'Botswana' },
        { value: 'BI', label: 'Burundi' },
        { value: 'CV', label: 'Cap-Vert' },
        { value: 'DJ', label: 'Djibouti' },
        { value: 'ER', label: 'Érythrée' },
        { value: 'SZ', label: 'Eswatini' },
        { value: 'ET', label: 'Éthiopie' },
        { value: 'GM', label: 'Gambie' },
        { value: 'KE', label: 'Kenya' },
        { value: 'LS', label: 'Lesotho' },
        { value: 'LY', label: 'Libye' },
        { value: 'MW', label: 'Malawi' },
        { value: 'MU', label: 'Maurice' },
        { value: 'YT', label: 'Mayotte' },
        { value: 'MA', label: 'Maroc' },
        { value: 'MZ', label: 'Mozambique' },
        { value: 'NA', label: 'Namibie' },
        { value: 'RE', label: 'Réunion' },
        { value: 'RW', label: 'Rwanda' },
        { value: 'ST', label: 'Sao Tomé-et-Principe' },
        { value: 'SC', label: 'Seychelles' },
        { value: 'SO', label: 'Somalie' },
        { value: 'SS', label: 'Soudan du Sud' },
        { value: 'SD', label: 'Soudan' },
        { value: 'TZ', label: 'Tanzanie' },
        { value: 'TN', label: 'Tunisie' },
        { value: 'UG', label: 'Ouganda' },
        { value: 'EH', label: 'Sahara Occidental' },
        { value: 'ZM', label: 'Zambie' },
        { value: 'ZW', label: 'Zimbabwe' },
        { value: 'OTHER', label: 'Autre' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.fullName || !formData.email || !formData.phone || !formData.companyName) {
            setError(t('fill_required_fields'));
            return;
        }
        
        if (!formData.email.includes('@')) {
            setError(t('invalid_email'));
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await api.post('/payment/local-request', formData);
            
            if (response.success) {
                setSuccess(t('payment_request_success'));
                setTimeout(() => {
                    navigate('/subscription');
                }, 5000);
            } else {
                setError(response.message || t('error_submitting'));
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_server_connection'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9FAFB',
            padding: '16px'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '32px'
            }}>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <Icon name="logo" category="nav" fallback="💊 StockMedi" style={{ width: 'auto', height: '60px' }} />
                    </div>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {t('local_payment_title')}
                    </p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label required">{t('full_name')}</label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder={t('full_name_placeholder')}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">{t('email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t('email_placeholder')}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('phone')}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+224 620 00 00 00"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">{t('company_name')}</label>
                            <input
                                type="text"
                                name="companyName"
                                className="form-input"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder={t('company_name_placeholder')}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">{t('plan')}</label>
                                <select
                                    name="plan"
                                    className="form-select"
                                    value={formData.plan}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                >
                                    {plans.map(plan => (
                                        <option key={plan.value} value={plan.value}>
                                            {plan.label} - {plan.price} / {t('month')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('country')}</label>
                                <select
                                    name="country"
                                    className="form-select"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                >
                                    {countries.map(country => (
                                        <option key={country.value} value={country.value}>
                                            {country.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">{t('preferred_contact')}</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        value="email"
                                        checked={formData.contactMethod === 'email'}
                                        onChange={handleChange}
                                    />
                                    <Icon name="email" category="status" fallback="📧" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                                    <span>{t('email')}</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        value="whatsapp"
                                        checked={formData.contactMethod === 'whatsapp'}
                                        onChange={handleChange}
                                    />
                                    <Icon name="whatsapp" category="social" fallback="💬" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                                    <span>WhatsApp</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('additional_message')}</label>
                            <textarea
                                name="message"
                                className="form-textarea"
                                rows="3"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={t('additional_message_placeholder')}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group" style={{
                            backgroundColor: '#F0FDF4',
                            padding: '16px',
                            borderRadius: '8px',
                            marginTop: '16px'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#0F6B3A' }}>
                                <strong>
                                    <Icon name={null} category={null} fallback="ℹ️" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                    {t('payment_info_title')}
                                </strong><br />
                                {t('payment_info_description')}
                            </p>
                            <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: '#0F6B3A' }}>
                                <strong>
                                    <Icon name="mobile" category="social" fallback="📱" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                    {t('mobile_money_numbers')}:
                                </strong> +224 623679567 / +224 660947398
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 2, padding: '12px' }}
                                disabled={loading}
                            >
                                {loading ? <Loader size="sm" /> : t('submit_request')}
                            </button>
                            <Link
                                to="/subscription"
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '12px', textAlign: 'center', textDecoration: 'none' }}
                            >
                                {t('cancel_btn')}
                            </Link>
                        </div>
                    </form>
                )}

                {success && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
                            <Icon name="success" category="status" fallback="✅" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h3 style={{ color: '#0F6B3A', marginBottom: '8px' }}>{t('request_received')}</h3>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                            {t('request_received_description')}
                        </p>
                        <Link to="/dashboard" className="btn btn-primary">
                            {t('back_to_dashboard')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocalPayment;