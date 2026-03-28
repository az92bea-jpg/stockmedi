/**
 * PAGE PARAMÈTRES - Configuration de l'entreprise et profil
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [activeTab, setActiveTab] = useState('company');
    
    // États pour les paramètres entreprise
    const [companySettings, setCompanySettings] = useState({
        company: {
            name: '',
            phone: '',
            email: '',
            address: { street: '', city: '', postalCode: '', country: 'GN' }
        },
        preferences: {
            currency: 'GNF',
            language: 'fr',
            taxRate: 18,
            invoicePrefix: 'INV',
            expirationAlertDays: 30,
            batchTracking: true,
            prescriptionRequired: true
        },
        subscription: null
    });
    
    // États pour le profil utilisateur
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // États pour afficher/masquer les mots de passe
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Charger les données
    useEffect(() => {
        fetchSettings();
        fetchProfile();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setCompanySettings(response.settings);
        } catch (err) {
            setError('Erreur lors du chargement des paramètres');
            console.error(err);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get('/settings/profile');
            setProfile(response.profile);
        } catch (err) {
            setError('Erreur lors du chargement du profil');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyChange = (e) => {
        const { name, value } = e.target;
        setCompanySettings({
            ...companySettings,
            company: {
                ...companySettings.company,
                [name]: value
            }
        });
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setCompanySettings({
            ...companySettings,
            company: {
                ...companySettings.company,
                address: {
                    ...companySettings.company.address,
                    [name]: value
                }
            }
        });
    };

    const handlePreferenceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCompanySettings({
            ...companySettings,
            preferences: {
                ...companySettings.preferences,
                [name]: type === 'checkbox' ? checked : value
            }
        });
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile({
            ...profile,
            [name]: value
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
    };

    const saveCompanySettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        
        try {
            const response = await api.put('/settings', {
                companyName: companySettings.company.name,
                companyPhone: companySettings.company.phone,
                companyEmail: companySettings.company.email,
                companyAddress: companySettings.company.address,
                currency: companySettings.preferences.currency,
                language: companySettings.preferences.language,
                taxRate: companySettings.preferences.taxRate,
                invoicePrefix: companySettings.preferences.invoicePrefix,
                expirationAlertDays: companySettings.preferences.expirationAlertDays,
                batchTracking: companySettings.preferences.batchTracking,
                prescriptionRequired: companySettings.preferences.prescriptionRequired
            });
            
            if (response.success) {
                setSuccess('Paramètres enregistrés avec succès');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        
        try {
            const response = await api.put('/settings/profile', {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone
            });
            
            if (response.success) {
                setSuccess('Profil mis à jour avec succès');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword) {
            setError('Veuillez saisir votre mot de passe actuel');
            return;
        }
        
        if (!passwordData.newPassword) {
            setError('Veuillez saisir un nouveau mot de passe');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        setSaving(true);
        setError('');
        
        try {
            const response = await api.put('/settings/profile', {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (response.success) {
                setSuccess('Mot de passe modifié avec succès');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Erreur changement mot de passe:', err);
            setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation rapide */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-outline">📊 Tableau de bord</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 Produits</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 Ventes</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 Rapports</Link>
                <Link to="/settings" className="btn btn-sm btn-primary">⚙️ Paramètres</Link>
            </div>

            <h2>Paramètres</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Configurez votre entreprise et votre compte utilisateur
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Onglets */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-1)',
                marginBottom: 'var(--spacing-6)',
                borderBottom: '1px solid var(--gray-200)'
            }}>
                <button
                    onClick={() => setActiveTab('company')}
                    style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: activeTab === 'company' ? 'var(--primary-500)' : 'var(--gray-500)',
                        borderBottom: activeTab === 'company' ? '2px solid var(--primary-500)' : 'none',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    🏢 Entreprise
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                        padding: 'var(--spacing-2) var(--spacing-4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: activeTab === 'profile' ? 'var(--primary-500)' : 'var(--gray-500)',
                        borderBottom: activeTab === 'profile' ? '2px solid var(--primary-500)' : 'none',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    👤 Mon profil
                </button>
            </div>

            {/* Panneau Entreprise */}
            {activeTab === 'company' && (
                <div className="card">
                    <div className="card-header">
                        <h3>Informations de l'entreprise</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={saveCompanySettings}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Nom de l'entreprise</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={companySettings.company.name}
                                        onChange={handleCompanyChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={companySettings.company.phone}
                                        onChange={handleCompanyChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={companySettings.company.email}
                                    onChange={handleCompanyChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Adresse</label>
                                    <input
                                        type="text"
                                        name="street"
                                        className="form-input"
                                        placeholder="Rue, quartier"
                                        value={companySettings.company.address?.street || ''}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ville</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-input"
                                        value={companySettings.company.address?.city || ''}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Code postal</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        className="form-input"
                                        value={companySettings.company.address?.postalCode || ''}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pays</label>
                                    <select
                                        name="country"
                                        className="form-select"
                                        value={companySettings.company.address?.country || 'GN'}
                                        onChange={handleAddressChange}
                                    >
                                        <option value="GN">Guinée</option>
                                        <option value="CI">Côte d'Ivoire</option>
                                        <option value="SN">Sénégal</option>
                                        <option value="ML">Mali</option>
                                        <option value="BF">Burkina Faso</option>
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)' }}>
                                Préférences
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Devise</label>
                                    <select
                                        name="currency"
                                        className="form-select"
                                        value={companySettings.preferences.currency}
                                        onChange={handlePreferenceChange}
                                    >
                                        <option value="GNF">Franc Guinéen (GNF)</option>
                                        <option value="XOF">Franc CFA (XOF)</option>
                                        <option value="USD">Dollar US (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Langue</label>
                                    <select
                                        name="language"
                                        className="form-select"
                                        value={companySettings.preferences.language}
                                        onChange={handlePreferenceChange}
                                    >
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Taux de TVA (%)</label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        className="form-input"
                                        value={companySettings.preferences.taxRate}
                                        onChange={handlePreferenceChange}
                                        min="0"
                                        max="100"
                                        step="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Préfixe facture</label>
                                    <input
                                        type="text"
                                        name="invoicePrefix"
                                        className="form-input"
                                        value={companySettings.preferences.invoicePrefix}
                                        onChange={handlePreferenceChange}
                                        placeholder="INV"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Alertes expiration (jours)</label>
                                    <input
                                        type="number"
                                        name="expirationAlertDays"
                                        className="form-input"
                                        value={companySettings.preferences.expirationAlertDays}
                                        onChange={handlePreferenceChange}
                                        min="0"
                                        max="365"
                                    />
                                    <div className="form-hint">Alerte X jours avant expiration</div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                                        <input
                                            type="checkbox"
                                            name="batchTracking"
                                            checked={companySettings.preferences.batchTracking}
                                            onChange={handlePreferenceChange}
                                        />
                                        Suivi des lots
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                                        <input
                                            type="checkbox"
                                            name="prescriptionRequired"
                                            checked={companySettings.preferences.prescriptionRequired}
                                            onChange={handlePreferenceChange}
                                        />
                                        Ordonnance obligatoire par défaut
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--spacing-6)' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : 'Enregistrer les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Panneau Profil */}
            {activeTab === 'profile' && (
                <>
                    <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div className="card-header">
                            <h3>Informations personnelles</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={saveProfile}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Prénom</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            className="form-input"
                                            value={profile.firstName}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nom</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            className="form-input"
                                            value={profile.lastName}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={profile.email}
                                        disabled
                                    />
                                    <div className="form-hint">L'email ne peut pas être modifié</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={profile.phone || ''}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Rôle</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.role === 'owner' ? 'Propriétaire' : 'Employé'}
                                        disabled
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : 'Mettre à jour le profil'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3>Changer le mot de passe</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={changePassword}>
                                <div className="form-group">
                                    <label className="form-label">Mot de passe actuel</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            name="currentPassword"
                                            className="form-input"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                                            {showCurrentPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Nouveau mot de passe</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                className="form-input"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                minLength="6"
                                                style={{ paddingRight: '40px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
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
                                                {showNewPassword ? '🙈' : '👁️'}
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
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
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
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : 'Changer le mot de passe'}
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Settings;