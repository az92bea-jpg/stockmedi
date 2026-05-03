/**
 * PAGE VÉRIFICATION EMAIL
 * Activée quand l'utilisateur clique le lien dans son email
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Icon from '../../components/ui/Icon';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token manquant ou invalide.');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.get(`/auth/verify-email?token=${token}`);
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message);
                } else {
                    setStatus('error');
                    setMessage(response.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Lien invalide ou expiré.');
            }
        };

        verify();
    }, [token]);

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
                padding: '32px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <Icon name="logo" category="nav" fallback="💊 StockMedi"
                        style={{ width: 'auto', height: '60px' }} />
                </div>

                {status === 'loading' && (
                    <>
                        <Loader />
                        <p style={{ color: '#6B7280', marginTop: '16px' }}>
                            Vérification en cours...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                        <h2 style={{ color: '#0F6B3A', marginBottom: '8px' }}>
                            Compte activé !
                        </h2>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                            {message}
                        </p>
                        <Link to="/login" style={{
                            display: 'inline-block',
                            background: '#0F6B3A',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}>
                            Se connecter
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
                        <h2 style={{ color: '#EF4444', marginBottom: '8px' }}>
                            Lien invalide
                        </h2>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                            {message}
                        </p>
                        <Link to="/register" style={{
                            display: 'inline-block',
                            background: '#0F6B3A',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}>
                            Créer un nouveau compte
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;