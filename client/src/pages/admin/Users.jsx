/**
 * PAGE ADMIN - Gestion des utilisateurs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role })
            });
            const response = await api.get(`/admin/users?${params}`);
            setUsers(response.users);
            setPagination({
                page: response.page,
                total: response.total,
                pages: response.pages
            });
        } catch (err) {
            setError('Erreur lors du chargement des utilisateurs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const openEditModal = (user) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            isActive: formData.get('isActive') === 'true',
            discipline: formData.get('discipline')
        };

        try {
            await api.put(`/admin/users/${selectedUser._id}`, data);
            setSuccess('Utilisateur mis à jour avec succès');
            fetchUsers();
            setModalOpen(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    const toggleStatus = async (user) => {
        try {
            await api.put(`/admin/users/${user._id}/toggle`);
            setSuccess(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification');
        }
    };

    const handleDelete = async (user) => {
        if (user.role === 'super-admin') {
            setError('Impossible de supprimer le compte super-admin');
            return;
        }
        if (!window.confirm(`Supprimer définitivement ${user.firstName} ${user.lastName} ?`)) return;
        
        try {
            await api.delete(`/admin/users/${user._id}`);
            setSuccess('Utilisateur supprimé avec succès');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            'super-admin': '#F59E0B',
            owner: '#0F6B3A',
            employee: '#3B82F6'
        };
        const labels = {
            'super-admin': '👑 Super Admin',
            owner: '🏢 Propriétaire',
            employee: '👥 Employé'
        };
        return { backgroundColor: colors[role] || '#6B7280', color: 'white', label: labels[role] || role };
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation Admin */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/admin" className="btn btn-sm btn-outline">📊 Dashboard Admin</Link>
                <Link to="/admin/companies" className="btn btn-sm btn-outline">🏢 Entreprises</Link>
                <Link to="/admin/users" className="btn btn-sm btn-primary">👥 Utilisateurs</Link>
            </div>

            <h2>Gestion des utilisateurs</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Gérez tous les utilisateurs de la plateforme
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2 }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Rechercher par nom, prénom ou email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div style={{ width: '150px' }}>
                            <select
                                className="form-select"
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            >
                                <option value="">Tous les rôles</option>
                                <option value="super-admin">Super Admin</option>
                                <option value="owner">Propriétaire</option>
                                <option value="employee">Employé</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={() => fetchUsers()}>
                            Rechercher
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Contact</th>
                                <th>Entreprise</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                                        Aucun utilisateur
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => {
                                    const roleBadge = getRoleBadge(user.role);
                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <strong>{user.firstName} {user.lastName}</strong>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td>{user.phone || '-'}</td>
                                            <td>{user.companyId?.name || '-'}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500,
                                                    backgroundColor: roleBadge.backgroundColor,
                                                    color: roleBadge.color
                                                }}>
                                                    {roleBadge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={user.isActive ? 'badge-success' : 'badge-danger'}>
                                                    {user.isActive ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => openEditModal(user)}
                                                        title="Modifier"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => toggleStatus(user)} 
                                                        title={user.isActive ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {user.isActive ? '🔒' : '🔓'}
                                                    </button>
                                                    {user.role !== 'super-admin' && (
                                                        <button 
                                                            className="btn btn-sm btn-outline" 
                                                            onClick={() => handleDelete(user)} 
                                                            style={{ color: 'var(--danger)' }}
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)' }}>
                        <button 
                            className="btn btn-sm btn-outline" 
                            disabled={pagination.page === 1} 
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                            ◀ Précédent
                        </button>
                        <span>Page {pagination.page} / {pagination.pages}</span>
                        <button 
                            className="btn btn-sm btn-outline" 
                            disabled={pagination.page === pagination.pages} 
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        >
                            Suivant ▶
                        </button>
                    </div>
                )}
            </div>

            {/* Modal édition */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modifier l'utilisateur" size="md">
                {selectedUser && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Prénom</label>
                                <input type="text" name="firstName" className="form-input" defaultValue={selectedUser.firstName} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom</label>
                                <input type="text" name="lastName" className="form-input" defaultValue={selectedUser.lastName} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Téléphone</label>
                            <input type="tel" name="phone" className="form-input" defaultValue={selectedUser.phone || ''} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Rôle</label>
                                <select name="role" className="form-select" defaultValue={selectedUser.role}>
                                    <option value="owner">Propriétaire</option>
                                    <option value="employee">Employé</option>
                                </select>
                                {selectedUser.role === 'super-admin' && (
                                    <div className="form-hint">Le rôle super-admin ne peut pas être modifié</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Statut</label>
                                <select name="isActive" className="form-select" defaultValue={selectedUser.isActive}>
                                    <option value="true">Actif</option>
                                    <option value="false">Inactif</option>
                                </select>
                            </div>
                        </div>
                        {selectedUser.role === 'employee' && (
                            <div className="form-group">
                                <label className="form-label">Discipline</label>
                                <select name="discipline" className="form-select" defaultValue={selectedUser.discipline || 'pharmacien'}>
                                    <option value="pharmacien">Pharmacien</option>
                                    <option value="médecin">Médecin</option>
                                    <option value="infirmier">Infirmier</option>
                                    <option value="assistant">Assistant</option>
                                    <option value="comptable">Comptable</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                            <button type="submit" className="btn btn-primary">Enregistrer</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminUsers;