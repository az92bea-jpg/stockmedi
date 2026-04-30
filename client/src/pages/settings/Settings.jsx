/**
 * PAGE PARAMÈTRES - Configuration de l'entreprise et profil
 * Synchronisation langue Settings → LanguageContext
 * Section suppression de compte (RGPD) - Délai 7 jours
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';
import AuditTrail from './AuditTrail';


const Settings = () => {
    const { t, changeLanguage } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [activeTab, setActiveTab] = useState('company');
    
    // États pour la suppression de compte
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletionRequested, setDeletionRequested] = useState(false);
    const [deletionDate, setDeletionDate] = useState(null);
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFADuration, setTwoFADuration] = useState(60);



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
            
            // Vérifier si une demande de suppression est en cours
            const userResponse = await api.get('/auth/me');
            if (userResponse.user?.deletionRequestedAt) {
                setDeletionRequested(true);
                const delDate = new Date(userResponse.user.deletionRequestedAt);
                delDate.setDate(delDate.getDate() + 7);
                setDeletionDate(delDate);
            }
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


    useEffect(() => {
    const load2FAConfig = async () => {
        try {
            const res = await api.get('/settings/2fa');
            setTwoFAEnabled(res.twoFAEnabled || false);
            setTwoFADuration(res.twoFADuration || 60);
        } catch (err) {}
    };
    load2FAConfig();
}, []);
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
        
        // Validation mot de passe fort
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(passwordData.newPassword)) {
            setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
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

    // Demander la suppression du compte (délai 7 jours)
    const handleRequestDeletion = async () => {
    console.log('🔥 Clic sur Confirmer détecté');
    console.log('deleteConfirmed:', deleteConfirmed);
    console.log('deletePassword:', deletePassword ? '****' : 'VIDE');
    
    if (!deleteConfirmed || !deletePassword) {
        setError('Veuillez cocher la case et saisir votre mot de passe');
        return;
    }
        
        setDeleting(true);
        setError('');
        
        try {
            const response = await api.post('/users/request-deletion', {
                password: deletePassword
            });
            
            if (response.success) {
                setSuccess(response.message);
                setDeletionRequested(true);
                setDeletionDate(new Date(response.deletionDate));
                setShowDeleteModal(false);
                setDeletePassword('');
                setDeleteConfirmed(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setDeleting(false);
        }
    };

    // Annuler la demande de suppression
    const handleCancelDeletion = async () => {
        setSaving(true);
        setError('');
        
        try {
            const response = await api.post('/users/cancel-deletion');
            
            if (response.success) {
                setSuccess(response.message);
                setDeletionRequested(false);
                setDeletionDate(null);
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
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '16px', height: '16px' }} />
                    {t('company')}
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
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Icon name="user" category="nav" fallback="👤" style={{ width: '16px', height: '16px' }} />
                    {t('profile')}
                </button>
            </div>

            <button
                onClick={() => setActiveTab('audit')}
                style={{
                    padding: 'var(--spacing-2) var(--spacing-4)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: activeTab === 'audit' ? 'var(--primary-500)' : 'var(--gray-500)',
                    borderBottom: activeTab === 'audit' ? '2px solid var(--primary-500)' : 'none',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <Icon name="reports" category="nav" fallback="📝" style={{ width: '16px', height: '16px' }} />
                Audit
            </button>

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

                    <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
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
                                            <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} category="actions" fallback={showCurrentPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                        </button>
                                    </div>
                                </div>

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
                                            minLength="8"
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
                                            <Icon name={showNewPassword ? 'eye-off' : 'eye'} category="actions" fallback={showNewPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                        </button>
                                    </div>
                                    {/* INDICATIONS MOT DE PASSE FORT */}
                                    <div style={{ 
                                        marginTop: '8px', 
                                        padding: '8px 12px', 
                                        backgroundColor: '#F3F4F6', 
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        color: '#4B5563',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 500, marginRight: '4px' }}>🔒</span>
                                        <span style={{ color: passwordData.newPassword.length >= 8 ? '#10B981' : '#6B7280' }}>
                                            {passwordData.newPassword.length >= 8 ? '✅' : '○'} 8+ caractères
                                        </span>
                                        <span style={{ color: /[A-Z]/.test(passwordData.newPassword) ? '#10B981' : '#6B7280' }}>
                                            {/[A-Z]/.test(passwordData.newPassword) ? '✅' : '○'} Majuscule
                                        </span>
                                        <span style={{ color: /[a-z]/.test(passwordData.newPassword) ? '#10B981' : '#6B7280' }}>
                                            {/[a-z]/.test(passwordData.newPassword) ? '✅' : '○'} Minuscule
                                        </span>
                                        <span style={{ color: /\d/.test(passwordData.newPassword) ? '#10B981' : '#6B7280' }}>
                                            {/\d/.test(passwordData.newPassword) ? '✅' : '○'} Chiffre
                                        </span>
                                        <span style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? '#10B981' : '#6B7280' }}>
                                            {/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? '✅' : '○'} Spécial
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
                                            <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} category="actions" fallback={showConfirmPassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader size="sm" /> : t('change_password')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Section 2FA */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div className="card-header">
                            <h3>🔐 Authentification à deux facteurs (2FA)</h3>
                        </div>
                        <div className="card-body">
                            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                                Ajoutez une couche de sécurité supplémentaire. Un code sera envoyé par email à chaque connexion depuis un nouvel appareil.
                            </p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
                                <label style={{ fontWeight: 500 }}>Activer la 2FA :</label>
                                <button 
                                    className={twoFAEnabled ? 'btn btn-danger' : 'btn btn-primary'}
                                    onClick={async () => {
                                        try {
                                            await api.put('/settings/2fa', { enabled: !twoFAEnabled });
                                            setTwoFAEnabled(!twoFAEnabled);
                                            setSuccess(twoFAEnabled ? '2FA désactivé' : '2FA activé');
                                        } catch (err) {
                                            setError('Erreur');
                                        }
                                    }}
                                >
                                    {twoFAEnabled ? 'Désactiver' : 'Activer'}
                                </button>
                            </div>

                            {twoFAEnabled && (
                                <div className="form-group">
                                    <label className="form-label">Durée de mémorisation des appareils</label>
                                    <select 
                                        className="form-select"
                                        value={twoFADuration}
                                        onChange={(e) => {
                                            setTwoFADuration(e.target.value);
                                            api.put('/settings/2fa-duration', { duration: e.target.value });
                                        }}
                                        style={{ maxWidth: '200px' }}
                                    >
                                        <option value="30">30 jours</option>
                                        <option value="60">60 jours</option>
                                    </select>
                                    <div className="form-hint">
                                        Les utilisateurs n'auront pas à ressaisir le code sur le même appareil pendant cette durée.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION SUPPRESSION DE COMPTE - UNIQUEMENT POUR OWNER */}
                    {profile.role === 'owner' && (
                        <div className="card" style={{ borderColor: 'var(--danger)' }}>
                            <div className="card-header" style={{ backgroundColor: '#FEF2F2' }}>
                                <h3 style={{ color: 'var(--danger)' }}>
                                    <Icon name="warning" category="status" fallback="⚠️" style={{ marginRight: '0.5rem' }} />
                                    {t('danger_zone')}
                                </h3>
                            </div>
                            <div className="card-body">
                                <h4 style={{ marginBottom: 'var(--spacing-2)' }}>
                                    <Icon name="delete" category="actions" fallback="🗑️" style={{ marginRight: '0.5rem' }} />
                                    {t('delete_account')}
                                </h4>
                                <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                                    {t('delete_account_warning')}
                                </p>
                                
                                {deletionRequested ? (
                                    <div style={{ backgroundColor: '#FEF3C7', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)' }}>
                                        <p style={{ color: '#92400E', marginBottom: 'var(--spacing-2)' }}>
                                            ⏳ {t('deletion_pending') || 'Une demande de suppression est en cours.'}<br />
                                            {t('deletion_scheduled') || 'Votre compte sera supprimé le'} {deletionDate?.toLocaleDateString('fr-FR')}.
                                        </p>
                                        <button className="btn btn-secondary" onClick={handleCancelDeletion} disabled={saving}>
                                            {t('cancel_deletion') || 'Annuler la demande'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={() => {
                                            console.log('🔥 Ouverture modale de suppression');
                                            setShowDeleteModal(true);
                                        }} 
                                        style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                                    >
                                        {t('request_deletion') || 'Demander la suppression de mon compte'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modale de confirmation de suppression */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleRequestDeletion}
                title={t('delete_account')}
                confirmText={deleting ? '...' : t('confirm_deletion') || 'Confirmer'}
                isDanger={true}
                confirmDisabled={deleting}
            >
                <div className="form-group">
                    <Alert type="warning" message={t('deletion_delay_warning') || 'Votre compte sera supprimé dans 7 jours. Vous pouvez annuler avant ce délai.'} />
                </div>
                <div className="form-group">
                    <label className="form-label">{t('delete_account_password')}</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showDeletePassword ? 'text' : 'password'}
                            className="form-input"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowDeletePassword(!showDeletePassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Icon name={showDeletePassword ? 'eye-off' : 'eye'} category="actions" fallback={showDeletePassword ? '🙈' : '👁️'} style={{ width: '20px', height: '20px' }} />
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <input
                            type="checkbox"
                            checked={deleteConfirmed}
                            onChange={(e) => setDeleteConfirmed(e.target.checked)}
                        />
                        <span>{t('delete_account_confirm')}</span>
                    </label>
                </div>
            </ConfirmModal>
            {activeTab === 'audit' && (
                <AuditTrail />
            )}
        </div>
    );

    
};





export default Settings;