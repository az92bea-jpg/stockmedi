/**
 * PAGE RÉINITIALISATION MOT DE PASSE
 * Traductions FR/EN complètes
 * Validation mot de passe fort
 * Indications visuelles mot de passe fort
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const ResetPassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validToken, setValidToken] = useState(false);
    const [email, setEmail] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!token) {
            setError(t('missing_token'));
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await api.get(`/auth/reset-password/${token}`);
                if (response.success) {
                    setValidToken(true);
                    setEmail(response.email);
                } else {
                    setError(response.message || t('invalid_token'));
                }
            } catch (err) {
                setError(err.response?.data?.message || t('invalid_or_expired_token'));
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, t]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError(t('password_mismatch'));
            return;
        }
        
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const response = await api.post('/auth/reset-password', {
                token,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            
            if (response.success) {
                setSuccess(t('password_reset_success'));
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.message || t('reset_error'));
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_server_connection'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

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
                maxWidth: '400px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '32px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <Icon name="logo" category="nav" fallback="💊 StockMedi" style={{ width: 'auto', height: '60px' }} />
                    </div>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {validToken ? t('new_password_title') : t('reset_title')}
                    </p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                {validToken ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('email')}</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('new_password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={saving}
                                    required
                                    minLength="8"
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: '#6B7280'
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
                                fontSize: '0.4rem',
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
                            <label className="form-label">{t('confirm_password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={saving}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: '#6B7280'
                                    }}
                                >
                                    <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} category="actions" fallback={showConfirmPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                            disabled={saving}
                        >
                            {saving ? <Loader size="sm" /> : t('reset')}
                        </button>
                    </form>
                ) : (
                    !loading && (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#EF4444' }}>{t('invalid_or_expired_link')}</p>
                            <Link to="/forgot-password" style={{ color: '#0F6B3A' }}>
                                {t('request_new_link')}
                            </Link>
                        </div>
                    )
                )}

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link to="/login" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                        ← {t('back_to_login')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;