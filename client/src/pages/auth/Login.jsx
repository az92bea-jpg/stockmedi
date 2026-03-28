import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await authService.login(formData.email, formData.password);
            if (response.success) {
                const user = authService.getCurrentUser();
                navigate(user?.role === 'super-admin' ? '/admin' : '/dashboard');
            } else {
                setError(response.message || 'Erreur de connexion');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion au serveur');
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
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Gestion pharmaceutique professionnelle</p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="exemple@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mot de passe</label>
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
                        {loading ? <Loader size="sm" /> : 'Se connecter'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: '#0F6B3A' }}>
                        Mot de passe oublié ?
                    </Link>
                </div>

                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        Pas encore de compte ?{' '}
                        <Link to="/register" style={{ color: '#0F6B3A', fontWeight: 'bold' }}>
                            Créer un espace entreprise
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;