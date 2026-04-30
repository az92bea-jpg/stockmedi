/**
 * PAGE D'INSCRIPTION - Création d'un espace entreprise
 * Traductions FR/EN complètes
 * Case "J'accepte les conditions d'utilisation"
 * Indications mot de passe fort
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';
import InstallPrompt from '../../components/common/InstallPrompt';


const Register = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        companyName: '',
        companyType: 'pharmacy',
        companyAddress: { city: '' },
        companyPhone: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'city') {
            setFormData({
                ...formData,
                companyAddress: { ...formData.companyAddress, city: value }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.companyName) {
            setError(t('fill_required_fields'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('password_mismatch'));
            return;
        }

        // Validation mot de passe fort
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
            return;
        }

        if (!acceptedTerms) {
            setError(t('must_accept_terms'));
            return;
        }

        setLoading(true);

        const dataToSend = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || '',
            companyName: formData.companyName,
            companyType: formData.companyType,
            companyAddress: { city: formData.companyAddress.city || '' },
            companyPhone: formData.companyPhone || ''
        };
        
        console.log('📤 ' + t('sending_data') + ':', dataToSend);

        try {
            const response = await authService.register(dataToSend);

            if (response.success) {
                setSuccess(t('registration_success'));
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.message || t('registration_error'));
            }
        } catch (err) {
            console.error('❌ ' + t('registration_error_log'), err);
            setError(err.response?.data?.message || t('error_server_connection'));
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
            backgroundColor: 'var(--gray-50)',
            padding: 'var(--spacing-4)'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--spacing-6)',
                animation: 'fadeIn var(--transition-normal)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-2)' }}>
                        <Icon name="logo" category="nav" fallback="💊 StockMedi" style={{ width: 'auto', height: '60px' }} />
                    </div>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                        {t('create_company_space')}
                    </p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                <form onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-3)', color: 'var(--gray-700)' }}>
                        {t('personal_info')}
                    </h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('first_name')}</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                placeholder={t('first_name_placeholder')}
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">{t('last_name')}</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                placeholder={t('last_name_placeholder')}
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">{t('email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder={t('email_placeholder')}
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                    minLength="8"
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowPassword}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: 'var(--gray-500)'
                                    }}
                                >
                                    <Icon name={showPassword ? 'eye-off' : 'eye'} category="actions" fallback={showPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                </button>
                            </div>
                            {/* INDICATIONS MOT DE PASSE FORT */}
                           <div style={{ 
                                marginTop: '8px', 
                                padding: '8px 12px', 
                                backgroundColor: '#F3F4F6', 
                                borderRadius: '6px',
                                fontSize: '0.6rem',
                                color: '#4B5563',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 500 }}>🔒</span>
                                <span style={{ color: formData.password.length >= 8 ? '#10B981' : '#6B7280' }}>
                                    {formData.password.length >= 8 ? '✅' : '○'} 8+ caractères
                                </span>
                                <span style={{ color: /[A-Z]/.test(formData.password) ? '#10B981' : '#6B7280' }}>
                                    {/[A-Z]/.test(formData.password) ? '✅' : '○'} Majuscule
                                </span>
                                <span style={{ color: /[a-z]/.test(formData.password) ? '#10B981' : '#6B7280' }}>
                                    {/[a-z]/.test(formData.password) ? '✅' : '○'} Minuscule
                                </span>
                                <span style={{ color: /\d/.test(formData.password) ? '#10B981' : '#6B7280' }}>
                                    {/\d/.test(formData.password) ? '✅' : '○'} Chiffre
                                </span>
                                <span style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '#10B981' : '#6B7280' }}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✅' : '○'} Spécial
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">{t('confirm_password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowConfirmPassword}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: 'var(--gray-500)'
                                    }}
                                >
                                    <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} category="actions" fallback={showConfirmPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('phone')}</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            placeholder={t('phone_placeholder')}
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <h3 style={{ fontSize: '1rem', margin: 'var(--spacing-4) 0 var(--spacing-3)', color: 'var(--gray-700)' }}>
                        {t('company_info')}
                    </h3>

                    <div className="form-group">
                        <label className="form-label required">{t('company_name')}</label>
                        <input
                            type="text"
                            name="companyName"
                            className="form-input"
                            placeholder={t('company_name_placeholder')}
                            value={formData.companyName}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('establishment_type')}</label>
                            <select
                                name="companyType"
                                className="form-select"
                                value={formData.companyType}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="pharmacy">{t('pharmacy')}</option>
                                <option value="clinic">{t('clinic')}</option>
                                <option value="hospital">{t('hospital')}</option>
                                <option value="lab">{t('lab')}</option>
                                <option value="other">{t('other')}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">{t('city')}</label>
                            <input
                                type="text"
                                name="city"
                                className="form-input"
                                placeholder={t('city_placeholder')}
                                value={formData.companyAddress.city}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('company_phone')}</label>
                        <input
                            type="tel"
                            name="companyPhone"
                            className="form-input"
                            placeholder={t('company_phone_placeholder')}
                            value={formData.companyPhone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    {/* ⭐ Case conditions d'utilisation */}
                    <div className="form-group" style={{ marginTop: 'var(--spacing-4)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                disabled={loading}
                            />
                            <span style={{ fontSize: '0.875rem' }}>
                                {t('accept_terms')}{' '}
                                <Link to="/terms" target="_blank" style={{ color: 'var(--primary-500)', fontWeight: 500 }}>
                                    {t('terms_of_use')}
                                </Link>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader size="sm" /> : t('create_my_company_space')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        {t('already_have_account')}{' '}
                        <Link to="/login" style={{ color: 'var(--primary-500)' }}>
                            {t('login')}
                        </Link>
                    </p>
                </div>
            </div>
            {/* ans le return, juste avant la fermeture </div> finale La meilleure approche : mettre <InstallPrompt /> uniquement dans Register.jsx. Comme ça, le bandeau d'installation apparaît seulement quand quelqu'un arrive sur la page d'inscription.*/}
            <InstallPrompt />
        </div>
    );
};

export default Register;