/**
 * PAGE DE CONNEXION - StockMedi
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Footer from '../../components/layout/Footer';
import { useLanguage } from '../../context/LanguageContext';

const Login = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError(t('fill_all_fields'));
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await authService.login(formData.email, formData.password);
            if (response.success) {
                const user = authService.getCurrentUser();
                // navigate(user?.role === 'super-admin' ? '/admin' : '/dashboard');
                navigate('/dashboard');
            } else {
                setError(response.message || t('error'));
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                flex: 1,
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
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <img 
                                src="/assets/icons/nav/logo.svg" 
                                alt="StockMedi Logo" 
                                style={{ 
                                    width: '160px',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                            <p style={{ 
                                color: '#6B7280', 
                                fontSize: '0.875rem',
                                margin: 0
                            }}>
                                {t('pharma_solution')}
                            </p>
                        </div>
                    </div>
                    
                    {error && <Alert type="error" message={error} onClose={() => setError('')} />}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('email')}</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder={t('email_placeholder')}
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    autoComplete="current-password"
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
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                            disabled={loading}
                        >
                            {loading ? <Loader size="sm" /> : t('login')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#0F6B3A' }}>
                            {t('forgot_password')}
                        </Link>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                            {t('no_account')}{' '}
                            <Link to="/register" style={{ color: '#0F6B3A' }}>
                                {t('create_account')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;