/**
 * PAGE ÉTABLISSEMENTS - Gestion multi-sites (Plan Enterprise)
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import {
    getEstablishments,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment
} from '../../services/establishmentService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StockTransfer from '../../components/establishment/StockTransfer';

const Establishments = () => {
    const [loading, setLoading] = useState(true);
    const [establishments, setEstablishments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [subscription, setSubscription] = useState(null);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
    const [showTransferModal, setShowTransferModal] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'pharmacy',
        address: { street: '', city: '', postalCode: '', country: 'GN' },
        phone: '',
        email: '',
        isActive: true
    });

    // Vérifier le plan et charger les établissements
    useEffect(() => {
        const checkPlanAndLoad = async () => {
            try {
                // Vérifier le plan
                const subResponse = await api.get('/subscription');
                setSubscription(subResponse.subscription);
                
                if (subResponse.subscription?.plan !== 'enterprise') {
                    setError('Cette fonctionnalité est disponible uniquement avec le plan Enterprise.');
                    setLoading(false);
                    return;
                }
                
                // Charger les établissements
                const estResponse = await getEstablishments();
                setEstablishments(estResponse.establishments || []);
            } catch (err) {
                setError('Erreur lors du chargement des données');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        checkPlanAndLoad();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'pharmacy',
            address: { street: '', city: '', postalCode: '', country: 'GN' },
            phone: '',
            email: '',
            isActive: true
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedEstablishment(null);
        setModalOpen(true);
    };

    const openEditModal = (establishment) => {
        setFormData({
            name: establishment.name,
            type: establishment.type,
            address: establishment.address || { street: '', city: '', postalCode: '', country: 'GN' },
            phone: establishment.phone || '',
            email: establishment.email || '',
            isActive: establishment.isActive
        });
        setModalMode('edit');
        setSelectedEstablishment(establishment);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Vérifier à nouveau le plan avant création
        if (modalMode === 'create' && subscription?.plan !== 'enterprise') {
            setError('La création d\'établissements est réservée au plan Enterprise.');
            return;
        }

        if (!formData.name) {
            setError('Le nom de l\'établissement est requis');
            return;
        }

        try {
            if (modalMode === 'create') {
                await createEstablishment(formData);
                setSuccess('Établissement créé avec succès');
            } else {
                await updateEstablishment(selectedEstablishment._id, formData);
                setSuccess('Établissement modifié avec succès');
            }
            setModalOpen(false);
            // Recharger les établissements
            const estResponse = await getEstablishments();
            setEstablishments(estResponse.establishments || []);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            await deleteEstablishment(deleteModal.id);
            setSuccess('Établissement supprimé avec succès');
            const estResponse = await getEstablishments();
            setEstablishments(estResponse.establishments || []);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('address.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                address: { ...formData.address, [field]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            pharmacy: '🏪 Pharmacie',
            clinic: '🏥 Clinique',
            hospital: '🏨 Hôpital',
            warehouse: '📦 Entrepôt'
        };
        return labels[type] || type;
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
                    <h2>🏢 Établissements</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Gérez vos pharmacies, cliniques et points de vente
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>
                        📦 Transférer du stock
                    </button>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        + Nouvel établissement
                    </button>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {subscription?.plan !== 'enterprise' ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p>⛔ Les établissements sont disponibles uniquement avec le plan <strong>Enterprise</strong>.</p>
                        <Link to="/subscription" className="btn btn-primary" style={{ marginTop: 'var(--spacing-3)' }}>
                            💎 Passer au plan Enterprise
                        </Link>
                    </div>
                </div>
            ) : establishments.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p>Aucun établissement. Créez votre premier établissement.</p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Type</th>
                                    <th>Adresse</th>
                                    <th>Contact</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {establishments.map(est => (
                                    <tr key={est._id}>
                                        <td>
                                            <strong>{est.name}</strong>
                                        </td>
                                        <td>{getTypeLabel(est.type)}</td>
                                        <td>
                                            {est.address?.city || ''}
                                            {est.address?.city && est.address?.street && ' - '}
                                            {est.address?.street || ''}
                                        </td>
                                        <td>
                                            {est.phone}<br />
                                            <small>{est.email}</small>
                                        </td>
                                        <td>
                                            <span className={est.isActive ? 'badge-success' : 'badge-danger'}>
                                                {est.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => openEditModal(est)}
                                                    title="Modifier"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setDeleteModal({
                                                        isOpen: true,
                                                        id: est._id,
                                                        name: est.name
                                                    })}
                                                    style={{ color: 'var(--danger)' }}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal création/édition */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? 'Nouvel établissement' : 'Modifier l\'établissement'}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label required">Nom</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Pharmacie du Centre"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                            <option value="pharmacy">🏪 Pharmacie</option>
                            <option value="clinic">🏥 Clinique</option>
                            <option value="hospital">🏨 Hôpital</option>
                            <option value="warehouse">📦 Entrepôt</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Ville</label>
                            <input
                                type="text"
                                name="address.city"
                                className="form-input"
                                value={formData.address.city}
                                onChange={handleChange}
                                placeholder="Conakry"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rue</label>
                            <input
                                type="text"
                                name="address.street"
                                className="form-input"
                                value={formData.address.street}
                                onChange={handleChange}
                                placeholder="Kaloum, Rue KA001"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Téléphone</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+224 600 00 00 00"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contact@pharmacie.centrale"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            Actif
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">
                            {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Annuler
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal transfert de stock */}
            <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfert de stock" size="lg">
                <StockTransfer 
                    onSuccess={() => {
                        setShowTransferModal(false);
                        // Recharger les établissements après transfert
                        getEstablishments().then(res => setEstablishments(res.establishments || []));
                    }} 
                    onCancel={() => setShowTransferModal(false)} 
                />
            </Modal>

            {/* Modal confirmation suppression */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
                onConfirm={handleDelete}
                title="Supprimer l'établissement"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.name}" ? Cette action est irréversible.`}
                confirmText="Oui, supprimer"
                isDanger={true}
            />
        </div>
    );
};

export default Establishments;