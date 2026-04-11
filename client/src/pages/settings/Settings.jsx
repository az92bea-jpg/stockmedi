/**
 * PAGE PARAMÈTRES - Configuration de l'entreprise et profil
 * ⭐ Synchronisation langue Settings → LanguageContext
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { useLanguage } from '../../context/LanguageContext';

const Settings = () => {
    // ⭐ Récupérer changeLanguage depuis le contexte
    const { t, changeLanguage } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [activeTab, setActiveTab] = useState('company');
    
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
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const response = await api.get('/settings');
            setCompanySettings(response.settings);
        } catch (err) {
            setError(t('error'));
            console.error(err);
        }
    }, [t]);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/settings/profile');
            setProfile(response.profile);
        } catch (err) {
            setError(t('error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSettings();
        fetchProfile();
    }, [fetchSettings, fetchProfile]);

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
                // ⭐ Synchroniser la langue avec le contexte
                changeLanguage(companySettings.preferences.language);
                
                setSuccess(t('save_success') || 'Paramètres enregistrés avec succès');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
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
                setSuccess(t('profile_updated') || 'Profil mis à jour avec succès');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword) {
            setError(t('current_password_required') || 'Veuillez saisir votre mot de passe actuel');
            return;
        }
        
        if (!passwordData.newPassword) {
            setError(t('new_password_required') || 'Veuillez saisir un nouveau mot de passe');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError(t('password_mismatch'));
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            setError(t('password_too_short'));
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
                setSuccess(t('password_changed') || 'Mot de passe modifié avec succès');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <h2>{t('settings_title')}</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                {t('settings_subtitle')}
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
                    🏢 {t('company')}
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
                    👤 {t('profile')}
                </button>
            </div>

            {/* Panneau Entreprise */}
            {activeTab === 'company' && (
                <div className="card">
                    <div className="card-header">
                        <h3>{t('company_info')}</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={saveCompanySettings}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">{t('company_name')}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={companySettings.company.name}
                                        onChange={handleCompanyChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('company_phone')}</label>
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
                                <label className="form-label">{t('company_email')}</label>
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
                                    <label className="form-label">{t('address')}</label>
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
                                    <label className="form-label">{t('city')}</label>
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
                                    <label className="form-label">{t('postal_code')}</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        className="form-input"
                                        value={companySettings.company.address?.postalCode || ''}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('country')}</label>
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
                                {t('preferences')}
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">{t('currency')}</label>
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
                                    <label className="form-label">{t('language')}</label>
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
                                    <label className="form-label">{t('tax_rate')}</label>
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
                                    <label className="form-label">{t('invoice_prefix')}</label>
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
                                    <label className="form-label">{t('expiration_alerts')}</label>
                                    <input
                                        type="number"
                                        name="expirationAlertDays"
                                        className="form-input"
                                        value={companySettings.preferences.expirationAlertDays}
                                        onChange={handlePreferenceChange}
                                        min="0"
                                        max="365"
                                    />
                                    <div className="form-hint">{t('expiration_hint') || 'Alerte X jours avant expiration'}</div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                                        <input
                                            type="checkbox"
                                            name="batchTracking"
                                            checked={companySettings.preferences.batchTracking}
                                            onChange={handlePreferenceChange}
                                        />
                                        {t('batch_tracking')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                                        <input
                                            type="checkbox"
                                            name="prescriptionRequired"
                                            checked={companySettings.preferences.prescriptionRequired}
                                            onChange={handlePreferenceChange}
                                        />
                                        {t('prescription_default')}
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--spacing-6)' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : t('save')}
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
                            <h3>{t('personal_info')}</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={saveProfile}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{t('first_name')}</label>
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
                                        <label className="form-label">{t('last_name')}</label>
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
                                    <label className="form-label">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={profile.email}
                                        disabled
                                    />
                                    <div className="form-hint">{t('email_cannot_change')}</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('phone')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={profile.phone || ''}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('role')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.role === 'owner' ? t('owner') : profile.role === 'super-admin' ? t('super_admin') : t('employee')}
                                        disabled
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : t('update_profile')}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3>{t('change_password')}</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={changePassword}>
                                <div className="form-group">
                                    <label className="form-label">{t('current_password')}</label>
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
                                        <label className="form-label">{t('new_password')}</label>
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
                                        <label className="form-label">{t('confirm_password')}</label>
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
                                    {saving ? <Loader size="sm" /> : t('change_password')}
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