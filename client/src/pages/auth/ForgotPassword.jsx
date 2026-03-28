/**
 * PAGE MOT DE PASSE OUBLIÉ - Demande de réinitialisation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Veuillez saisir votre email');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.success) {
                setSuccess('Un email de réinitialisation a été envoyé');
                setEmail('');
            } else {
                setError(response.message || 'Erreur lors de la demande');
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
            backgroundColor: 'var(--gray-50)',
            padding: 'var(--spacing-4)'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--spacing-8)',
                animation: 'fadeIn var(--transition-normal)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-2)' }}>💊</div>
                    <h1 style={{ color: 'var(--primary-500)', marginBottom: 'var(--spacing-2)' }}>StockMedi</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                        Réinitialisation du mot de passe
                    </p>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="exemple@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                        <div className="form-hint">
                            Un lien de réinitialisation vous sera envoyé par email
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: 'var(--spacing-3)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader size="sm" /> : 'Envoyer'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <Link to="/login" style={{ color: 'var(--primary-500)', textDecoration: 'none' }}>
                        ← Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;