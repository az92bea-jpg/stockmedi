/**
 * PAGE RÉINITIALISATION MOT DE PASSE
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const ResetPassword = () => {
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
            setError('Token manquant');
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
                    setError(response.message || 'Token invalide');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Token invalide ou expiré');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
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
                setSuccess('Mot de passe réinitialisé avec succès !');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.message || 'Erreur lors de la réinitialisation');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion au serveur');
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
                    <div style={{ fontSize: '3rem' }}>💊</div>
                    <h1 style={{ color: '#0F6B3A', marginBottom: '8px' }}>StockMedi</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {validToken ? 'Nouveau mot de passe' : 'Réinitialisation'}
                    </p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                {validToken ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nouveau mot de passe</label>
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
                                    minLength="6"
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

                        <div className="form-group">
                            <label className="form-label">Confirmer</label>
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
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px' }}
                            disabled={saving}
                        >
                            {saving ? <Loader size="sm" /> : 'Réinitialiser'}
                        </button>
                    </form>
                ) : (
                    !loading && (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#EF4444' }}>Lien invalide ou expiré</p>
                            <Link to="/forgot-password" style={{ color: '#0F6B3A' }}>
                                Demander un nouveau lien
                            </Link>
                        </div>
                    )
                )}

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link to="/login" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                        ← Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;