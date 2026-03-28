/**
 * PAGE D'INSCRIPTION - Création d'un espace entreprise
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // États pour afficher/masquer les mots de passe
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        // Informations personnelles
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        // Informations entreprise
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

        // Validation
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.companyName) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
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
        
        console.log('📤 Envoi des données:', dataToSend);

        try {
            const response = await authService.register(dataToSend);

            if (response.success) {
                setSuccess('Inscription réussie ! Redirection vers la connexion...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.message || 'Erreur lors de l\'inscription');
            }
        } catch (err) {
            console.error('❌ Erreur inscription:', err);
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
                {/* Logo et titre */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>💊</div>
                    <h1 style={{ color: 'var(--primary-500)', marginBottom: 'var(--spacing-2)' }}>StockMedi</h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                        Créez votre espace entreprise
                    </p>
                </div>

                {/* Messages */}
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

                {/* Formulaire */}
                <form onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-3)', color: 'var(--gray-700)' }}>
                        Informations personnelles
                    </h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Prénom</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                placeholder="Jean"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                placeholder="Dupont"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="contact@pharmacie.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    {/* Champs mot de passe avec afficher/masquer */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Mot de passe</label>
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
                                    minLength="6"
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
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Confirmer</label>
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
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            placeholder="620000000"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <h3 style={{ fontSize: '1rem', margin: 'var(--spacing-4) 0 var(--spacing-3)', color: 'var(--gray-700)' }}>
                        Informations entreprise
                    </h3>

                    <div className="form-group">
                        <label className="form-label required">Nom de l'entreprise</label>
                        <input
                            type="text"
                            name="companyName"
                            className="form-input"
                            placeholder="Pharmacie Centrale"
                            value={formData.companyName}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Type d'établissement</label>
                            <select
                                name="companyType"
                                className="form-select"
                                value={formData.companyType}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="pharmacy">Pharmacie</option>
                                <option value="clinic">Clinique</option>
                                <option value="hospital">Hôpital</option>
                                <option value="lab">Laboratoire</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Ville</label>
                            <input
                                type="text"
                                name="city"
                                className="form-input"
                                placeholder="Conakry"
                                value={formData.companyAddress.city}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Téléphone entreprise</label>
                        <input
                            type="tel"
                            name="companyPhone"
                            className="form-input"
                            placeholder="620000000"
                            value={formData.companyPhone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader size="sm" /> : 'Créer mon espace entreprise'}
                    </button>
                </form>

                {/* Lien connexion */}
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        Déjà un compte ?{' '}
                        <Link to="/login" style={{ color: 'var(--primary-500)' }}>
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;