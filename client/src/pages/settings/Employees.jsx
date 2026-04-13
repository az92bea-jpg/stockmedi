/**
 * PAGE GESTION EMPLOYÉS
 * ⭐ Support affectation aux établissements (plan Enterprise)
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { getEstablishments } from '../../services/establishmentService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Icon from '../../components/ui/Icon'; // ⭐ Import du composant Icon
import { useLanguage } from '../../context/LanguageContext';

// Mapping des disciplines - Utilisation de Icon avec fallback emoji
const getDisciplineLabel = (discipline, t) => {
    const labels = {
        'pharmacien': { icon: 'pill', category: 'nav', fallback: '💊', label: t('pharmacist') },
        'médecin': { icon: null, category: null, fallback: '🩺', label: t('doctor') },
        'infirmier': { icon: null, category: null, fallback: '🩹', label: t('nurse') },
        'assistant': { icon: null, category: null, fallback: '📋', label: t('assistant') },
        'comptable': { icon: null, category: null, fallback: '💰', label: t('accountant') },
        'autre': { icon: null, category: null, fallback: '📁', label: t('other') }
    };
    const item = labels[discipline];
    if (!item) return discipline;
    
    return (
        <>
            {item.icon ? (
                <Icon name={item.icon} category={item.category} fallback={item.fallback} style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            ) : (
                <span style={{ marginRight: '4px' }}>{item.fallback}</span>
            )}
            {item.label}
        </>
    );
};

// Couleur de fond selon discipline
const getDisciplineColor = (discipline) => {
    switch(discipline) {
        case 'pharmacien': return { bg: '#E8F3EF', color: '#0F6B3A' };
        case 'médecin': return { bg: '#DBEAFE', color: '#1E40AF' };
        case 'infirmier': return { bg: '#FEF3C7', color: '#92400E' };
        case 'assistant': return { bg: '#F3F4F6', color: '#374151' };
        case 'comptable': return { bg: '#D1FAE5', color: '#065F46' };
        default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
};

const getPermissionLabel = (permission, t) => {
    const labels = {
        manage_stock: { icon: 'products', category: 'nav', fallback: '📦', label: t('manage_stock') },
        make_sales: { icon: 'sales', category: 'nav', fallback: '💰', label: t('make_sales') },
        view_reports: { icon: 'reports', category: 'nav', fallback: '📊', label: t('view_reports') },
        manage_users: { icon: 'employees', category: 'nav', fallback: '👥', label: t('manage_employees') },
        manage_settings: { icon: 'settings', category: 'nav', fallback: '⚙️', label: t('manage_settings') },
        manage_establishments: { icon: null, category: null, fallback: '🏢', label: t('manage_establishments') }, // ⚠️ establishment.svg à créer
        view_dashboard: { icon: 'dashboard', category: 'nav', fallback: '📊', label: t('view_dashboard') },
        view_products: { icon: null, category: null, fallback: '👁️', label: t('view_products') }, // ⚠️ eye.svg à créer
        cancel_sales: { icon: null, category: null, fallback: '❌', label: t('cancel_sales') } // ⚠️ cancel.svg ou utiliser error ?
    };
    const item = labels[permission];
    if (!item) return permission;
    
    return (
        <>
            {item.icon ? (
                <Icon name={item.icon} category={item.category} fallback={item.fallback} style={{ width: '12px', height: '12px', marginRight: '2px' }} />
            ) : (
                <span style={{ marginRight: '2px' }}>{item.fallback}</span>
            )}
            {item.label}
        </>
    );
};

const Employees = () => {
    const { t } = useLanguage();
    const [employees, setEmployees] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        discipline: 'pharmacien',
        permissions: ['make_sales'],
        establishments: []
    });

    // ⭐ Charger les établissements
    const loadEstablishments = useCallback(async () => {
        try {
            const response = await getEstablishments();
            setEstablishments(response.establishments || []);
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/employees');
            setEmployees(response.employees || []);
        } catch (err) {
            setError(t('error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadEstablishments();
        fetchEmployees();
    }, [loadEstablishments, fetchEmployees]);

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: '',
            discipline: 'pharmacien',
            permissions: ['make_sales'],
            establishments: []
        });
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedEmployee(null);
        setModalOpen(true);
    };

    const openEditModal = (employee) => {
        setFormData({
            email: employee.email,
            password: '',
            confirmPassword: '',
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone || '',
            discipline: employee.discipline || 'pharmacien',
            permissions: employee.permissions || ['make_sales'],
            establishments: employee.establishments?.map(e => e._id) || []
        });
        setModalMode('edit');
        setSelectedEmployee(employee);
        setModalOpen(true);
    };

    // ⭐ Gérer la sélection des établissements
    const handleEstablishmentToggle = (establishmentId) => {
        const current = formData.establishments || [];
        if (current.includes(establishmentId)) {
            setFormData({
                ...formData,
                establishments: current.filter(id => id !== establishmentId)
            });
        } else {
            setFormData({
                ...formData,
                establishments: [...current, establishmentId]
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (modalMode === 'create' && formData.password !== formData.confirmPassword) {
            setError(t('password_mismatch'));
            return;
        }
        
        if (modalMode === 'create' && formData.password.length < 6) {
            setError(t('password_too_short'));
            return;
        }
        
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                discipline: formData.discipline,
                permissions: formData.permissions,
                establishments: formData.establishments
            };
            
            if (modalMode === 'create') {
                payload.email = formData.email;
                payload.password = formData.password;
                await api.post('/employees', payload);
                setSuccess(t('employee_added'));
            } else {
                await api.put(`/employees/${selectedEmployee._id}`, payload);
                setSuccess(t('employee_updated'));
            }
            
            setModalOpen(false);
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const toggleEmployee = async (employee) => {
        try {
            const response = await api.put(`/employees/${employee._id}/toggle`);
            setSuccess(response.message);
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const deleteEmployee = async (employee) => {
        if (window.confirm(`${t('confirm_delete')} ${employee.firstName} ${employee.lastName} ?`)) {
            try {
                await api.delete(`/employees/${employee._id}`);
                setSuccess(t('employee_deleted'));
                fetchEmployees();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || t('error'));
            }
        }
    };

    const handlePermissionToggle = (permission) => {
        const currentPermissions = [...formData.permissions];
        if (currentPermissions.includes(permission)) {
            setFormData({
                ...formData,
                permissions: currentPermissions.filter(p => p !== permission)
            });
        } else {
            setFormData({
                ...formData,
                permissions: [...currentPermissions, permission]
            });
        }
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)'
            }}>
                <div>
                    <h2>{t('employees_title')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>{t('employees_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Icon name="add" category="actions" fallback="+" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                    {t('add_employee')}
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Liste des employés */}
            <div className="card">
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    backgroundColor: 'var(--gray-50)',
                    borderBottom: '1px solid var(--gray-200)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ width: '180px' }}>{t('employee')}</div>
                    <div style={{ width: '120px' }}>{t('contact')}</div>
                    <div style={{ width: '140px' }}>{t('discipline')}</div>
                    <div style={{ width: '150px' }}>{t('permissions')}</div>
                    <div style={{ width: '120px' }}>{t('establishments')}</div>
                    <div style={{ width: '80px' }}>{t('status')}</div>
                    <div style={{ width: '100px' }}>{t('actions')}</div>
                </div>

                <div>
                    {employees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                            {t('no_employees')}
                        </div>
                    ) : (
                        employees.map(emp => {
                            const disciplineColors = getDisciplineColor(emp.discipline);
                            return (
                                <div
                                    key={emp._id}
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-4)',
                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                        borderBottom: '1px solid var(--gray-100)',
                                        alignItems: 'center',
                                        transition: 'background-color 0.2s',
                                        flexWrap: 'wrap'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ width: '180px' }}>
                                        <strong>{emp.firstName} {emp.lastName}</strong>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                            {emp.email}
                                        </div>
                                    </div>
                                    <div style={{ width: '120px', fontSize: '0.875rem' }}>
                                        {emp.phone || '-'}
                                    </div>
                                    <div style={{ width: '140px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            backgroundColor: disciplineColors.bg,
                                            color: disciplineColors.color,
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            {getDisciplineLabel(emp.discipline, t)}
                                        </span>
                                    </div>
                                    <div style={{ width: '150px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {emp.permissions?.slice(0, 3).map(p => (
                                            <span key={p} style={{
                                                display: 'inline-block',
                                                backgroundColor: 'var(--gray-100)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem'
                                            }}>
                                                {getPermissionLabel(p, t)}
                                            </span>
                                        ))}
                                        {emp.permissions?.length > 3 && (
                                            <span style={{
                                                backgroundColor: 'var(--gray-100)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem'
                                            }}>
                                                +{emp.permissions.length - 3}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ width: '120px', fontSize: '0.75rem' }}>
                                        {emp.establishments?.length > 0 ? (
                                            emp.establishments.map(e => (
                                                <div key={e._id}>
                                                    <Icon name={null} category={null} fallback="🏢" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {/* ⚠️ establishment.svg à créer */}
                                                    {e.name}
                                                </div>
                                            ))
                                        ) : (
                                            <span style={{ color: 'var(--gray-400)' }}>{t('all_establishments')}</span>
                                        )}
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <span className={emp.isActive ? 'badge-success' : 'badge-danger'}>
                                            {emp.isActive ? t('active') : t('inactive')}
                                        </span>
                                    </div>
                                    <div style={{ width: '100px', display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            onClick={() => openEditModal(emp)} 
                                            title={t('edit')}
                                        >
                                            <Icon name="edit" category="actions" fallback="✏️" style={{ width: '16px', height: '16px' }} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            onClick={() => toggleEmployee(emp)} 
                                            title={emp.isActive ? t('deactivate') : t('activate')} 
                                            style={{ color: emp.isActive ? 'var(--warning)' : 'var(--success)' }}
                                        >
                                            {/* ⚠️ lock.svg et unlock.svg à créer */}
                                            <Icon name={null} category={null} fallback={emp.isActive ? '🔒' : '🔓'} style={{ width: '16px', height: '16px' }} />
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            onClick={() => deleteEmployee(emp)} 
                                            title={t('delete')} 
                                            style={{ color: 'var(--danger)' }}
                                        >
                                            <Icon name="delete" category="actions" fallback="🗑️" style={{ width: '16px', height: '16px' }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal d'ajout/modification */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? t('add_employee') : t('edit')}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('first_name')}</label>
                            <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">{t('last_name')}</label>
                            <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">{t('email')}</label>
                        <input type="email" name="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={modalMode === 'edit'} />
                        {modalMode === 'edit' && <div className="form-hint">{t('email_cannot_change')}</div>}
                    </div>

                    {modalMode === 'create' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">{t('password')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? 'text' : 'password'} name="password" className="form-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength="6" style={{ paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6B7280' }}>
                                        {/* ⚠️ eye.svg et eye-off.svg à créer */}
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('confirm_password')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required style={{ paddingRight: '40px' }} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6B7280' }}>
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('phone')}</label>
                        <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">{t('discipline_label')}</label>
                        <select name="discipline" className="form-select" value={formData.discipline} onChange={(e) => setFormData({...formData, discipline: e.target.value})} required>
                            <option value="pharmacien">💊 {t('pharmacist')}</option>
                            <option value="médecin">🩺 {t('doctor')}</option>
                            <option value="infirmier">🩹 {t('nurse')}</option>
                            <option value="assistant">📋 {t('assistant')}</option>
                            <option value="comptable">💰 {t('accountant')}</option>
                            <option value="gestionnaire">📊 {t('manager')}</option>
                            <option value="caissier">💰 {t('cashier')}</option>
                            <option value="autre">📁 {t('other')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('permissions_label')}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('view_dashboard')} onChange={() => handlePermissionToggle('view_dashboard')} />
                                <Icon name="dashboard" category="nav" fallback="📊" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('view_dashboard')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('make_sales')} onChange={() => handlePermissionToggle('make_sales')} />
                                <Icon name="sales" category="nav" fallback="💰" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('make_sales')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('view_sales')} onChange={() => handlePermissionToggle('view_sales')} />
                                <Icon name={null} category={null} fallback="📋" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('view_sales')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('cancel_sales')} onChange={() => handlePermissionToggle('cancel_sales')} />
                                <Icon name={null} category={null} fallback="❌" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('cancel_sales')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('manage_stock')} onChange={() => handlePermissionToggle('manage_stock')} />
                                <Icon name="products" category="nav" fallback="📦" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('manage_stock')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('view_products')} onChange={() => handlePermissionToggle('view_products')} />
                                <Icon name="eye" category="actions" fallback="👁️" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('view_products')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('view_reports')} onChange={() => handlePermissionToggle('view_reports')} />
                                <Icon name="reports" category="nav" fallback="📊" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('view_reports')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('manage_employees')} onChange={() => handlePermissionToggle('manage_employees')} />
                                <Icon name="employees" category="nav" fallback="👥" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('manage_employees')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('manage_establishments')} onChange={() => handlePermissionToggle('manage_establishments')} />
                                <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('manage_establishments')}
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input type="checkbox" checked={formData.permissions.includes('manage_settings')} onChange={() => handlePermissionToggle('manage_settings')} />
                                <Icon name="settings" category="nav" fallback="⚙️" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {t('manage_settings')}
                            </label>
                        </div>
                    </div>

                    {/* ⭐ Sélecteur d'établissements (visible uniquement si plan Enterprise) */}
                    {establishments.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">{t('establishments_access')}</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                                {establishments.map(est => (
                                    <label key={est._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        <input type="checkbox" checked={formData.establishments?.includes(est._id) || false} onChange={() => handleEstablishmentToggle(est._id)} />
                                        <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                        {est.name}
                                    </label>
                                ))}
                            </div>
                            <div className="form-hint">
                                {t('establishments_hint')}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">{modalMode === 'create' ? t('add_employee') : t('save')}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;