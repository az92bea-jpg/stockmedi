/**
 * PAGE GESTION EMPLOYÉS
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';

// Mapping des disciplines
const getDisciplineLabel = (discipline) => {
    const labels = {
        'pharmacien': '💊 Pharmacien',
        'médecin': '🩺 Médecin',
        'infirmier': '🩹 Infirmier',
        'assistant': '📋 Assistant',
        'comptable': '💰 Comptable',
        'autre': '📁 Autre'
    };
    
    if (!discipline) {
        return '📁 Non défini';
    }
    
    return labels[discipline] || discipline;
};

// Couleur de fond selon discipline
const getDisciplineColor = (discipline) => {
    switch(discipline) {
        case 'pharmacien':
            return { bg: '#E8F3EF', color: '#0F6B3A' };
        case 'médecin':
            return { bg: '#DBEAFE', color: '#1E40AF' };
        case 'infirmier':
            return { bg: '#FEF3C7', color: '#92400E' };
        case 'assistant':
            return { bg: '#F3F4F6', color: '#374151' };
        case 'comptable':
            return { bg: '#D1FAE5', color: '#065F46' };
        default:
            return { bg: '#F3F4F6', color: '#6B7280' };
    }
};

const getPermissionLabel = (permission) => {
    const labels = {
        manage_stock: '📦 Gestion stock',
        make_sales: '💰 Ventes',
        view_reports: '📊 Rapports',
        manage_users: '👥 Gestion utilisateurs',
        manage_settings: '⚙️ Paramètres'
    };
    return labels[permission] || permission;
};

const Employees = () => {
    const [employees, setEmployees] = useState([]);
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
        permissions: ['make_sales']
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get('/employees');
            setEmployees(response.employees || []);
        } catch (err) {
            setError('Erreur lors du chargement des employés');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: '',
            discipline: 'pharmacien',
            permissions: ['make_sales']
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
            permissions: employee.permissions || ['make_sales']
        });
        setModalMode('edit');
        setSelectedEmployee(employee);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (modalMode === 'create' && formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (modalMode === 'create' && formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        try {
            if (modalMode === 'create') {
                await api.post('/employees', {
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    discipline: formData.discipline,
                    permissions: formData.permissions
                });
                setSuccess('Employé ajouté avec succès');
            } else {
                await api.put(`/employees/${selectedEmployee._id}`, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    discipline: formData.discipline,
                    permissions: formData.permissions
                });
                setSuccess('Employé modifié avec succès');
            }
            
            setModalOpen(false);
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
    };

    const toggleEmployee = async (employee) => {
        try {
            const response = await api.put(`/employees/${employee._id}/toggle`);
            setSuccess(response.message);
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification');
        }
    };

    const deleteEmployee = async (employee) => {
        if (window.confirm(`Voulez-vous vraiment supprimer ${employee.firstName} ${employee.lastName} ?`)) {
            try {
                await api.delete(`/employees/${employee._id}`);
                setSuccess('Employé supprimé avec succès');
                fetchEmployees();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors de la suppression');
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
                <Link to="/employees" className="btn btn-sm btn-primary">👥 Employés</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ Paramètres</Link>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)'
            }}>
                <div>
                    <h2>Gestion des employés</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Gérez les comptes de vos employés et leurs permissions</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Ajouter un employé
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Liste des employés - Version sans tableau */}
            <div className="card">
                {/* En-tête */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    backgroundColor: 'var(--gray-50)',
                    borderBottom: '1px solid var(--gray-200)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                }}>
                    <div style={{ width: '200px' }}>Employé</div>
                    <div style={{ width: '120px' }}>Contact</div>
                    <div style={{ width: '140px' }}>Discipline</div>
                    <div style={{ width: '200px' }}>Permissions</div>
                    <div style={{ width: '80px' }}>Statut</div>
                    <div style={{ flex: 1 }}>Actions</div>
                </div>

                {/* Corps de la liste */}
                <div>
                    {employees.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-8)',
                            color: 'var(--gray-500)'
                        }}>
                            Aucun employé. Cliquez sur "Ajouter un employé" pour commencer.
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
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ width: '200px' }}>
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
                                            {getDisciplineLabel(emp.discipline)}
                                        </span>
                                    </div>
                                    <div style={{ width: '200px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {emp.permissions?.map(p => (
                                            <span key={p} style={{
                                                display: 'inline-block',
                                                backgroundColor: 'var(--gray-100)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem'
                                            }}>
                                                {getPermissionLabel(p)}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <span className={emp.isActive ? 'badge-success' : 'badge-danger'}>
                                            {emp.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => openEditModal(emp)}
                                            title="Modifier"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => toggleEmployee(emp)}
                                            title={emp.isActive ? 'Désactiver' : 'Activer'}
                                            style={{ color: emp.isActive ? 'var(--warning)' : 'var(--success)' }}
                                        >
                                            {emp.isActive ? '🔒' : '🔓'}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => deleteEmployee(emp)}
                                            title="Supprimer"
                                            style={{ color: 'var(--danger)' }}
                                        >
                                            🗑️
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
                title={modalMode === 'create' ? 'Ajouter un employé' : 'Modifier l\'employé'}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Prénom</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            disabled={modalMode === 'edit'}
                        />
                        {modalMode === 'edit' && (
                            <div className="form-hint">L'email ne peut pas être modifié</div>
                        )}
                    </div>

                    {modalMode === 'create' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">Mot de passe</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                                <label className="form-label required">Confirmer</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        className="form-input"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
                    )}

                    <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Discipline / Spécialité</label>
                        <select
                            name="discipline"
                            className="form-select"
                            value={formData.discipline}
                            onChange={(e) => setFormData({...formData, discipline: e.target.value})}
                            required
                        >
                            <option value="pharmacien">💊 Pharmacien</option>
                            <option value="médecin">🩺 Médecin</option>
                            <option value="infirmier">🩹 Infirmier</option>
                            <option value="assistant">📋 Assistant</option>
                            <option value="comptable">💰 Comptable</option>
                            <option value="autre">📁 Autre</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Permissions</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 'var(--spacing-2)',
                            marginTop: 'var(--spacing-2)'
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes('manage_stock')}
                                    onChange={() => handlePermissionToggle('manage_stock')}
                                />
                                📦 Gestion stock
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes('make_sales')}
                                    onChange={() => handlePermissionToggle('make_sales')}
                                />
                                💰 Ventes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes('view_reports')}
                                    onChange={() => handlePermissionToggle('view_reports')}
                                />
                                📊 Rapports
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes('manage_users')}
                                    onChange={() => handlePermissionToggle('manage_users')}
                                />
                                👥 Gestion utilisateurs
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes('manage_settings')}
                                    onChange={() => handlePermissionToggle('manage_settings')}
                                />
                                ⚙️ Paramètres
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">
                            {modalMode === 'create' ? 'Ajouter l\'employé' : 'Enregistrer'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Annuler
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;