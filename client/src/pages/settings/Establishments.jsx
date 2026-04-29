/**
 * PAGE ÉTABLISSEMENTS - Gestion multi-sites (Plan Enterprise)
 * Traductions FR/EN complètes
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import {
    getEstablishments,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
    migrateProductsToEstablishment
} from '../../services/establishmentService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StockTransfer from '../../components/establishment/StockTransfer';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const Establishments = () => {
    const { t } = useLanguage();
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

    useEffect(() => {
        const checkPlanAndLoad = async () => {
            try {
                const subResponse = await api.get('/subscription');
                setSubscription(subResponse.subscription);
                
                if (subResponse.subscription?.plan !== 'enterprise') {
                    setError(t('enterprise_only_feature'));
                    setLoading(false);
                    return;
                }
                
                const estResponse = await getEstablishments();
                setEstablishments(estResponse.establishments || []);
            } catch (err) {
                setError(t('error_loading_data'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        checkPlanAndLoad();
    }, [t]);

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

    if (modalMode === 'create' && subscription?.plan !== 'enterprise') {
        setError(t('enterprise_only_create'));
        return;
    }

    if (!formData.name) {
        setError(t('establishment_name_required'));
        return;
    }

    try {
        let newEstablishmentId = null;
        
        if (modalMode === 'create') {
            const response = await createEstablishment(formData);
            newEstablishmentId = response.establishment?._id;
            setSuccess(t('establishment_created'));
        } else {
            await updateEstablishment(selectedEstablishment._id, formData);
            setSuccess(t('establishment_updated'));
        }
        
        // Recharger les établissements
        const estResponse = await getEstablishments();
        setEstablishments(estResponse.establishments || []);
        
        // Migration : proposer si c'est le PREMIER établissement créé
        if (modalMode === 'create' && establishments.length === 0 && newEstablishmentId) {
            // Compter les produits sans établissement
            const productsResponse = await api.get('/products');
            const productsWithoutEstablishment = productsResponse.products?.filter(p => !p.establishmentId) || [];
            
            if (productsWithoutEstablishment.length > 0) {
                const message = t('migrate_products_confirm')
                    .replace('{{count}}', productsWithoutEstablishment.length)
                    .replace('{name}', formData.name);
                const shouldMigrate = window.confirm(message);

                
                if (shouldMigrate) {
                    try {
                        await migrateProductsToEstablishment(newEstablishmentId);
                        setSuccess(t('products_migrated_success'));
                    } catch (err) {
                        console.error('Erreur migration:', err);
                        setError(t('error_migrating_products'));
                    }
                }
            }
        }
        
        setModalOpen(false);
        setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
        setError(err.response?.data?.message || t('error_saving'));
    }
};



    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            await deleteEstablishment(deleteModal.id);
            setSuccess(t('establishment_deleted'));
            const estResponse = await getEstablishments();
            setEstablishments(estResponse.establishments || []);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error_deleting'));
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
            pharmacy: { icon: 'pharmacy', category: 'establishment', fallback: '🏪', label: t('pharmacy') },
            clinic: { icon: 'clinic', category: 'establishment', fallback: '🏥', label: t('clinic') },
            hospital: { icon: 'hospital', category: 'establishment', fallback: '🏨', label: t('hospital') },
            warehouse: { icon: 'products', category: 'nav', fallback: '📦', label: t('warehouse') }
        };
        const item = labels[type];
        if (!item) return type;
        
        return (
            <>
                {item.icon ? (
                    <Icon name={item.icon} category={item.category} fallback={item.fallback} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                ) : (
                    <span style={{ marginRight: '4px' }}>{item.fallback}</span>
                )}
                {item.label}
            </>
        );
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
                    <h2>
                        <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '24px', height: '24px', marginRight: '8px' }} />
                        {t('establishments_title')}
                    </h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        {t('establishments_subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>
                        <Icon name="products" category="nav" fallback="📦" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {t('transfer_stock')}
                    </button>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Icon name="add" category="actions" fallback="+" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {t('new_establishment')}
                    </button>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {subscription?.plan !== 'enterprise' ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p>
                            <Icon name="error" category="status" fallback="⛔" style={{ width: '20px', height: '20px', marginRight: '4px' }} />
                            {t('enterprise_only_message')}
                        </p>
                        <Link to="/subscription" className="btn btn-primary" style={{ marginTop: 'var(--spacing-3)' }}>
                            <Icon name="subscription" category="nav" fallback="💎" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                            {t('upgrade_to_enterprise')}
                        </Link>
                    </div>
                </div>
            ) : establishments.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p>{t('no_establishments_create_one')}</p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('name')}</th>
                                    <th>{t('type')}</th>
                                    <th>{t('address')}</th>
                                    <th>{t('contact')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {establishments.map(est => (
                                    <tr key={est._id}>
                                        <td><strong>{est.name}</strong></td>
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
                                                {est.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => openEditModal(est)}
                                                    title={t('edit')}
                                                >
                                                    <Icon name="edit" category="actions" fallback="✏️" style={{ width: '16px', height: '16px' }} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setDeleteModal({
                                                        isOpen: true,
                                                        id: est._id,
                                                        name: est.name
                                                    })}
                                                    style={{ color: 'var(--danger)' }}
                                                    title={t('delete')}
                                                >
                                                    <Icon name="delete" category="actions" fallback="🗑️" style={{ width: '16px', height: '16px' }} />
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
                title={modalMode === 'create' ? t('new_establishment') : t('edit_establishment')}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label required">{t('name')}</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder={t('establishment_name_placeholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('type')}</label>
                        <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                            <option value="pharmacy">{t('pharmacy')}</option>
                            <option value="clinic">{t('clinic')}</option>
                            <option value="hospital">{t('hospital')}</option>
                            <option value="warehouse">{t('warehouse')}</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('city')}</label>
                            <input
                                type="text"
                                name="address.city"
                                className="form-input"
                                value={formData.address.city}
                                onChange={handleChange}
                                placeholder={t('city_placeholder')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('street')}</label>
                            <input
                                type="text"
                                name="address.street"
                                className="form-input"
                                value={formData.address.street}
                                onChange={handleChange}
                                placeholder={t('street_placeholder')}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('phone')}</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={t('phone_placeholder')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('email')}</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t('email_placeholder')}
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
                            {t('active')}
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">
                            {modalMode === 'create' ? t('create') : t('save')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            {t('cancel_btn')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal transfert de stock */}
            <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title={t('transfer_stock')} size="lg">
                <StockTransfer 
                    onSuccess={() => {
                        setShowTransferModal(false);
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
                title={t('delete_establishment')}
                message={`${t('confirm_delete_establishment')} "${deleteModal.name}" ? ${t('action_irreversible')}`}
                confirmText={t('yes_delete')}
                isDanger={true}
            />
        </div>
    );
};

export default Establishments;