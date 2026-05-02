/**
 * PAGE MOT DE PASSE OUBLIÉ - Réinitialisation sécurisée
 * Multi-étapes : Email → Questions → Code WhatsApp → Lien
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../../components/ui/Icon';

const ForgotPassword = () => {
    const { t } = useLanguage();
    
    // États du formulaire
    const [step, setStep] = useState(1); // 1=email, 2=questions, 3=code, 4=lien
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [discipline, setDiscipline] = useState('');
    const [code, setCode] = useState('');
    const [resetLink, setResetLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /**
     * ÉTAPE 1 : Vérifier l'email
     */
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError(t('email_required'));

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.success) {
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_server_connection'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * ÉTAPE 2 : Vérifier les questions + envoyer le code WhatsApp
     */
    const handleQuestionsSubmit = async (e) => {
        e.preventDefault();
        if (!companyName || !discipline) return setError('Veuillez remplir tous les champs');

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/verify-identity', { email, companyName, discipline });
            if (response.success) {
                setStep(3);
                setSuccess(response.message);
            } else {
                setError(response.message || 'Informations incorrectes');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_server_connection'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * ÉTAPE 3 : Vérifier le code reçu
     */
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        if (!code) return setError('Veuillez entrer le code');

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/verify-reset-code', { email, code });
            if (response.success) {
                setResetLink(response.resetUrl);
                setStep(4);
                setSuccess('');
            } else {
                setError(response.message || 'Code invalide');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_server_connection'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * Afficher le titre selon l'étape
     */
    const getStepTitle = () => {
        switch (step) {
            case 1: return t('reset_password_title');
            case 2: return 'Vérification d\'identité';
            case 3: return 'Code de vérification';
            case 4: return 'Réinitialisation';
            default: return '';
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
                maxWidth: '420px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--spacing-8)',
                animation: 'fadeIn var(--transition-normal)'
            }}>
                {/* Logo + Titre */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-2)' }}>
                        <Icon name="logo" category="nav" fallback="💊 StockMedi" style={{ width: 'auto', height: '60px' }} />
                    </div>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                        {getStepTitle()}
                    </p>
                    {/* Indicateur d'étapes */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                width: '30px', height: '4px', borderRadius: '2px',
                                backgroundColor: i <= step ? 'var(--primary-500)' : 'var(--gray-200)',
                                transition: 'background-color 0.3s'
                            }} />
                        ))}
                    </div>
                </div>

                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                {/* ========== ÉTAPE 1 : EMAIL ========== */}
                {step === 1 && (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('email')}</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder={t('email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                            {loading ? <Loader size="sm" /> : 'Continuer'}
                        </button>
                    </form>
                )}

                {/* ========== ÉTAPE 2 : QUESTIONS ========== */}
                {step === 2 && (
                    <form onSubmit={handleQuestionsSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nom de votre entreprise</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: Pharmacie du Centre"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Votre discipline / rôle</label>
                            <select
                                className="form-select"
                                value={discipline}
                                onChange={(e) => setDiscipline(e.target.value)}
                                disabled={loading}
                                required
                            >
                                <option value="">Sélectionner...</option>
                                <option value="proprietaire">Propriétaire</option>
                                <option value="pharmacien">Pharmacien</option>
                                <option value="medecin">Médecin</option>
                                <option value="infirmier">Infirmier</option>
                                <option value="assistant">Assistant</option>
                                <option value="comptable">Comptable</option>
                                <option value="gestionnaire">Gestionnaire</option>
                                <option value="caissier">Caissier</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                            {loading ? <Loader size="sm" /> : 'Vérifier et envoyer le code'}
                        </button>
                    </form>
                )}

                {/* ========== ÉTAPE 3 : CODE ========== */}
                {step === 3 && (
                    <form onSubmit={handleCodeSubmit}>
                        <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                            <Icon name="mobile" category="social" fallback="📱" style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0F6B3A' }}>
                                Un code à 6 chiffres a été envoyé sur votre WhatsApp.
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code de vérification</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength="6"
                                disabled={loading}
                                required
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                            {loading ? <Loader size="sm" /> : 'Vérifier le code'}
                        </button>
                    </form>
                )}

                {/* ========== ÉTAPE 4 : LIEN ========== */}
                {step === 4 && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#F0FDF4',
                        borderRadius: '8px',
                        border: '1px solid #0F6B3A',
                        textAlign: 'center'
                    }}>
                        <Icon name="success" category="status" fallback="✅" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                        <p style={{ marginBottom: '16px', color: '#0F6B3A', fontWeight: 500 }}>
                            Vérification réussie !
                        </p>
                        <a href={resetLink} style={{
                            display: 'inline-block',
                            padding: '14px 28px',
                            backgroundColor: '#0F6B3A',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            🔐 Réinitialiser mon mot de passe
                        </a>
                        <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#6B7280' }}>
                            Ce lien expire dans 15 minutes
                        </p>
                    </div>
                )}

                {/* Lien retour */}
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <Link to="/login" style={{ color: 'var(--primary-500)', textDecoration: 'none' }}>
                        ← {t('back_to_login')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;