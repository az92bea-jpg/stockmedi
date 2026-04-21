/**
 * PAGE ADMIN - Gestion des entreprises
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import AdminNav from '../../components/admin/AdminNav';

const AdminCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    
    // Formulaire pour l'abonnement
    const [subscriptionForm, setSubscriptionForm] = useState({
        plan: 'basic',
        status: 'active',
        endDate: ''
    });

    const fetchCompanies = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status })
            });
            const response = await api.get(`/admin/companies?${params}`);
            setCompanies(response.companies);
            setPagination({
                page: response.page,
                total: response.total,
                pages: response.pages
            });
        } catch (err) {
            setError('Erreur lors du chargement des entreprises');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters.search, filters.status]); // ⭐ Dépendances primitives

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const openEditModal = (company) => {
        setSelectedCompany(company);
        setModalOpen(true);
    };

    const openSubscriptionModal = (company) => {
        setSelectedCompany(company);
        setSubscriptionForm({
            plan: company.subscription?.plan || 'basic',
            status: company.subscription?.status || 'active',
            endDate: company.subscription?.endDate ? company.subscription.endDate.split('T')[0] : ''
        });
        setSubscriptionModalOpen(true);
    };

    const handleSubscriptionUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/admin/companies/${selectedCompany._id}/subscription`, subscriptionForm);
            setSuccess(`Abonnement de ${selectedCompany.name} mis à jour`);
            fetchCompanies();
            setSubscriptionModalOpen(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            isActive: formData.get('isActive') === 'true',
            subscription: {
                plan: formData.get('plan'),
                status: formData.get('subscriptionStatus'),
                endDate: formData.get('endDate')
            }
        };

        try {
            await api.put(`/admin/companies/${selectedCompany._id}`, data);
            setSuccess('Entreprise mise à jour avec succès');
            fetchCompanies();
            setModalOpen(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    const handleDelete = async (company) => {
        if (!window.confirm(`Supprimer définitivement "${company.name}" ? Toutes les données seront perdues.`)) return;
        
        try {
            await api.delete(`/admin/companies/${company._id}`);
            setSuccess('Entreprise supprimée avec succès');
            fetchCompanies();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    const getPlanBadge = (plan) => {
        const colors = {
            trial: '#10B981',
            basic: '#3B82F6',
            premium: '#8B5CF6',
            enterprise: '#F59E0B'
        };
        return { backgroundColor: colors[plan] || '#6B7280', color: 'white' };
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <AdminNav />

            <h2>Gestion des entreprises</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-6)' }}>
                Gérez toutes les entreprises de la plateforme
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
                                placeholder="Rechercher par nom ou email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div style={{ width: '150px' }}>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">Tous</option>
                                <option value="active">Actives</option>
                                <option value="inactive">Inactives</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={() => fetchCompanies()}>
                            Rechercher
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des entreprises */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Entreprise</th>
                                <th>Contact</th>
                                <th>Propriétaire</th>
                                <th>Abonnement</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                                        Aucune entreprise
                                    </td>
                                </tr>
                            ) : (
                                companies.map(company => (
                                    <tr key={company._id}>
                                        <td>
                                            <strong>{company.name}</strong>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                                Créée le {formatDate(company.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            {company.email}<br />
                                            {company.phone || '-'}
                                        </td>
                                        <td>
                                            {company.ownerId?.firstName} {company.ownerId?.lastName}<br />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                                {company.ownerId?.email}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                                ...getPlanBadge(company.subscription?.plan)
                                            }}>
                                                {company.subscription?.plan || 'trial'}
                                            </span>
                                            <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                                Expire: {company.subscription?.endDate ? formatDate(company.subscription.endDate) : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={company.isActive ? 'badge-success' : 'badge-danger'}>
                                                {company.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button 
                                                    className="btn btn-sm btn-primary" 
                                                    onClick={() => openSubscriptionModal(company)}
                                                    title="Modifier l'abonnement"
                                                >
                                                    💎 Plan
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => openEditModal(company)}
                                                    title="Modifier"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => handleDelete(company)} 
                                                    style={{ color: 'var(--danger)' }}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

            {/* Modal édition entreprise */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modifier l'entreprise" size="md">
                {selectedCompany && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label className="form-label">Nom</label>
                            <input type="text" name="name" className="form-input" defaultValue={selectedCompany.name} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" name="email" className="form-input" defaultValue={selectedCompany.email} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Téléphone</label>
                            <input type="tel" name="phone" className="form-input" defaultValue={selectedCompany.phone || ''} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Statut</label>
                                <select name="isActive" className="form-select" defaultValue={selectedCompany.isActive}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Plan</label>
                                <select name="plan" className="form-select" defaultValue={selectedCompany.subscription?.plan || 'trial'}>
                                    <option value="trial">Trial</option>
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Statut abonnement</label>
                                <select name="subscriptionStatus" className="form-select" defaultValue={selectedCompany.subscription?.status || 'active'}>
                                    <option value="active">Actif</option>
                                    <option value="expired">Expiré</option>
                                    <option value="suspended">Suspendu</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date expiration</label>
                                <input type="date" name="endDate" className="form-input" defaultValue={selectedCompany.subscription?.endDate?.split('T')[0]} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                            <button type="submit" className="btn btn-primary">Enregistrer</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal modification abonnement (simple) */}
            <Modal isOpen={subscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} title={`Modifier l'abonnement - ${selectedCompany?.name}`} size="md">
                <form onSubmit={handleSubscriptionUpdate}>
                    <div className="form-group">
                        <label className="form-label">Plan</label>
                        <select className="form-select" value={subscriptionForm.plan} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan: e.target.value })}>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Statut</label>
                        <select className="form-select" value={subscriptionForm.status} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, status: e.target.value })}>
                            <option value="active">Actif</option>
                            <option value="expired">Expiré</option>
                            <option value="suspended">Suspendu</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date d'expiration</label>
                        <input type="date" className="form-input" value={subscriptionForm.endDate} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setSubscriptionModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminCompanies;