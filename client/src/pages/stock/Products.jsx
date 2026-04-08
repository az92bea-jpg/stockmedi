/**
 * PAGE PRODUITS - Gestion complète du stock
 * Version avec div flex (sans tableau HTML)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { productService } from '../../services/productService';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import EstablishmentSelector from '../../components/establishment/EstablishmentSelector';

const Products = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const user = authService.getCurrentUser();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        stockStatus: ''
    });
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        category: 'médicament',
        manufacturer: '',
        batchNumber: '',
        barcode: '',
        quantity: 0,
        unit: 'boîte(s)',
        reorderPoint: 10,
        location: '',
        purchasePrice: 0,
        sellingPrice: 0,
        manufacturingDate: '',
        expirationDate: '',
        prescriptionRequired: false,
        description: ''
    });

    // Charger les établissements
    const loadEstablishments = useCallback(async () => {
        try {
            const response = await api.get('/establishments');
            setEstablishments(response.establishments || []);
            if (response.establishments?.length > 0 && !selectedEstablishment) {
                setSelectedEstablishment(response.establishments[0]._id);
            }
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        }
    }, [selectedEstablishment]);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await productService.getProducts({});
            setProducts(response.products || []);
            setFilteredProducts(response.products || []);
        } catch (err) {
            setError(t('error') || 'Erreur lors du chargement des produits');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchProducts();
        if (user?.role === 'owner') {
            loadEstablishments();
        }
    }, [fetchProducts, user?.role, loadEstablishments]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const stockStatusParam = params.get('stockStatus');
        if (stockStatusParam && (stockStatusParam === 'out_of_stock' || stockStatusParam === 'low_stock')) {
            setFilters(prev => ({ ...prev, stockStatus: stockStatusParam }));
        }
    }, [location.search]);

    useEffect(() => {
        let results = [...products];
        if (filters.search && filters.search.length >= 1) {
            const searchLower = filters.search.toLowerCase();
            results = results.filter(product => 
                product.name?.toLowerCase().includes(searchLower) ||
                product.genericName?.toLowerCase().includes(searchLower) ||
                product.barcode?.toLowerCase().includes(searchLower)
            );
        }
        if (filters.category) {
            results = results.filter(product => product.category === filters.category);
        }
        if (filters.stockStatus === 'out_of_stock') {
            results = results.filter(product => product.quantity === 0);
        } else if (filters.stockStatus === 'low_stock') {
            results = results.filter(product => product.quantity > 0 && product.quantity <= product.reorderPoint);
        }
        setFilteredProducts(results);
    }, [products, filters]);

    const calculateMargin = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const selling = parseFloat(formData.sellingPrice) || 0;
        if (purchase === 0) return 0;
        return ((selling - purchase) / purchase * 100).toFixed(1);
    };

    const validatePrices = () => {
        const purchase = parseFloat(formData.purchasePrice);
        const selling = parseFloat(formData.sellingPrice);
        if (purchase === 0) {
            setError(t('purchase_price_zero') || 'Le prix d\'achat ne peut pas être nul');
            return false;
        }
        if (selling < purchase) {
            setError(`⚠️ ${t('sell_at_loss')} : ${selling.toLocaleString()} GNF < ${purchase.toLocaleString()} GNF`);
            return false;
        }
        if (selling === purchase) {
            if (!window.confirm(`⚠️ ${t('margin_zero')} ${t('confirm')} ?`)) {
                return false;
            }
        }
        return true;
    };

    const validateDates = () => {
        if (formData.expirationDate && formData.manufacturingDate) {
            if (new Date(formData.manufacturingDate) > new Date(formData.expirationDate)) {
                setError(t('manufacturing_after_expiration') || 'La date de fabrication ne peut pas être postérieure à la date d\'expiration');
                return false;
            }
        }
        if (formData.expirationDate && new Date(formData.expirationDate) < new Date()) {
            if (!window.confirm(`⚠️ ${t('expired_confirm') || 'La date d\'expiration est déjà dépassée. Voulez-vous continuer ?'}`)) {
                return false;
            }
        }
        return true;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            genericName: '',
            category: 'médicament',
            manufacturer: '',
            batchNumber: '',
            barcode: '',
            quantity: 0,
            unit: 'boîte(s)',
            reorderPoint: 10,
            location: '',
            purchasePrice: 0,
            sellingPrice: 0,
            manufacturingDate: '',
            expirationDate: '',
            prescriptionRequired: false,
            description: ''
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setFormData({
            name: product.name || '',
            genericName: product.genericName || '',
            category: product.category || 'médicament',
            manufacturer: product.manufacturer || '',
            batchNumber: product.batchNumber || '',
            barcode: product.barcode || '',
            quantity: product.quantity || 0,
            unit: product.unit || 'boîte(s)',
            reorderPoint: product.reorderPoint || 10,
            location: product.location || '',
            purchasePrice: product.purchasePrice || 0,
            sellingPrice: product.sellingPrice || 0,
            manufacturingDate: product.manufacturingDate ? product.manufacturingDate.split('T')[0] : '',
            expirationDate: product.expirationDate ? product.expirationDate.split('T')[0] : '',
            prescriptionRequired: product.prescriptionRequired || false,
            description: product.description || ''
        });
        setModalMode('edit');
        setSelectedProduct(product);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (modalMode === 'create' && user?.role === 'owner' && !selectedEstablishment) {
            setError('Veuillez sélectionner un établissement');
            return;
        }

        if (!validatePrices()) return;
        if (!validateDates()) return;
        if (!formData.name) {
            setError(t('product_name_required') || 'Le nom du produit est requis');
            return;
        }
        if (!formData.purchasePrice) {
            setError(t('purchase_price_required') || 'Le prix d\'achat est requis');
            return;
        }
        if (!formData.sellingPrice) {
            setError(t('selling_price_required') || 'Le prix de vente est requis');
            return;
        }
        if (!formData.expirationDate) {
            setError(t('expiration_date_required') || 'La date d\'expiration est requise');
            return;
        }

        try {
            const productData = {
                ...formData,
                establishmentId: modalMode === 'create' ? selectedEstablishment : undefined
            };

            if (modalMode === 'create') {
                await productService.createProduct(productData);
                setSuccess(t('product_created') || 'Produit créé avec succès');
            } else {
                await productService.updateProduct(selectedProduct._id, {
                    name: formData.name,
                    genericName: formData.genericName,
                    category: formData.category,
                    manufacturer: formData.manufacturer,
                    batchNumber: formData.batchNumber,
                    barcode: formData.barcode,
                    unit: formData.unit,
                    reorderPoint: formData.reorderPoint,
                    location: formData.location,
                    purchasePrice: formData.purchasePrice,
                    sellingPrice: formData.sellingPrice,
                    manufacturingDate: formData.manufacturingDate,
                    expirationDate: formData.expirationDate,
                    prescriptionRequired: formData.prescriptionRequired,
                    description: formData.description,
                    quantity: formData.quantity,
                    establishmentId: selectedEstablishment
                });
                setSuccess(t('product_updated') || 'Produit modifié avec succès');
            }
            setModalOpen(false);
            fetchProducts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            console.error(err);
        }
    };

    const handleDelete = async (product) => {
        if (window.confirm(`${t('confirm_delete')} "${product.name}" ?`)) {
            try {
                await productService.deleteProduct(product._id);
                setSuccess(t('product_deleted') || 'Produit archivé avec succès');
                fetchProducts();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || t('error'));
                console.error(err);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const resetFilters = () => {
        setFilters({ search: '', category: '', stockStatus: '' });
    };

    const getExpirationStatusClass = (product) => {
        if (!product.expirationDate) return 'badge-info';
        const today = new Date();
        const expDate = new Date(product.expirationDate);
        const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'badge-danger';
        if (daysLeft <= 30) return 'badge-warning';
        return 'badge-success';
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (loading && products.length === 0) return <Loader />;

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
                    <h2>{t('products_title')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>{t('products_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + {t('new_product')}
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-4)'
                    }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('search')}</label>
                            <input
                                type="text"
                                name="search"
                                className="form-input"
                                placeholder={t('search_placeholder')}
                                value={filters.search}
                                onChange={handleFilterChange}
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('category')}</label>
                            <select
                                name="category"
                                className="form-select"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">{t('all_categories')}</option>
                                <option value="médicament">💊 {t('medication') || 'Médicament'}</option>
                                <option value="dispositif_médical">🩺 {t('medical_device') || 'Dispositif médical'}</option>
                                <option value="consommable">🧻 {t('consumable') || 'Consommable'}</option>
                                <option value="parapharmacie">🧴 {t('parapharmacy') || 'Parapharmacie'}</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('stock_status')}</label>
                            <select
                                name="stockStatus"
                                className="form-select"
                                value={filters.stockStatus}
                                onChange={handleFilterChange}
                            >
                                <option value="">{t('all_status')}</option>
                                <option value="out_of_stock">⚠️ {t('out_of_stock')}</option>
                                <option value="low_stock">📉 {t('low_stock')}</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={resetFilters}>
                                {t('reset')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des produits - Version simplifiée (un produit = un établissement) */}
            {filteredProducts.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                        {filters.search ? t('no_products_search') || 'Aucun produit ne correspond à votre recherche' : t('no_products')}
                    </div>
                </div>
            ) : (
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
                        <div style={{ width: '180px' }}>{t('name')}</div>
                        <div style={{ width: '100px' }}>{t('category_col')}</div>
                        <div style={{ width: '100px' }}>{t('stock')}</div>
                        <div style={{ width: '100px' }}>{t('purchase_price')}</div>
                        <div style={{ width: '100px' }}>{t('selling_price')}</div>
                        <div style={{ width: '80px' }}>{t('margin')}</div>
                        <div style={{ width: '120px' }}>{t('expiration')}</div>
                        <div style={{ width: '80px' }}>{t('actions')}</div>
                    </div>

                    {filteredProducts.map((product) => {
                        /* const margin = product.purchasePrice > 0 
                            ? ((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)
                            : 0;
                        const isLoss = product.sellingPrice < product.purchasePrice;
                        */
                        return (
                            <div
                                key={product._id}
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
                                    <strong>{product.name}</strong>
                                    {product.genericName && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                            {product.genericName}
                                        </div>
                                    )}
                                    {product.batchNumber && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                            {t('batch_number')}: {product.batchNumber}
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '100px', fontSize: '0.75rem' }}>
                                    <div>
                                        {product.category === 'médicament' ? '💊 ' + (t('medication') || 'Médicament') :
                                         product.category === 'dispositif_médical' ? '🩺 ' + (t('medical_device') || 'DM') :
                                         product.category === 'consommable' ? '🧻 ' + (t('consumable') || 'Consommable') : 
                                         product.category === 'parapharmacie' ? '🧴 ' + (t('parapharmacy') || 'Parapharmacie') : product.category}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary-500)', marginTop: '4px' }}>
                                        🏪 {product.establishmentId?.name || 'Chargement...'}
                                    </div>
                                </div>

                                <div style={{ width: '100px' }}>
                                    <span className={product.quantity === 0 ? 'badge-danger' : product.quantity <= product.reorderPoint ? 'badge-warning' : 'badge-success'}>
                                        {formatPrice(product.quantity)} {product.unit}
                                    </span>
                                    <div style={{ fontSize: '0.7rem' }}>
                                        {product.quantity === 0 ? t('out_of_stock') : product.quantity <= product.reorderPoint ? t('low_stock') : t('in_stock') || 'En stock'}
                                    </div>
                                    {product.location && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                                            📍 {product.location}
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '100px', fontSize: '0.875rem' }}>
                                    {formatPrice(product.purchasePrice)} GNF
                                </div>

                                <div style={{ width: '100px', fontSize: '0.875rem' }}>
                                    <strong>{formatPrice(product.sellingPrice)} GNF</strong>
                                </div>

                               
                             
                                 <div style={{ width: '80px' }}>
                                    {(() => {
                                        const purchase = Number(product.purchasePrice);
                                        const selling = Number(product.sellingPrice);
                                        
                                        if (purchase === 0 || isNaN(purchase)) {
                                            return <span style={{ color: '#F59E0B', fontWeight: 500 }}>N/A</span>;
                                        }
                                        
                                        const margin = ((selling - purchase) / purchase * 100).toFixed(1);
                                        
                                        if (selling < purchase) {
                                            return <span style={{ color: '#EF4444', fontWeight: 500 }}>{margin}% ⚠️ PERTE</span>;
                                        } else if (selling > purchase) {
                                            return <span style={{ color: '#10B981', fontWeight: 500 }}>+{margin}%</span>;
                                        } else {
                                            return <span style={{ color: '#F59E0B', fontWeight: 500 }}>{margin}%</span>;
                                        }
                                    })()}
                                </div>
                                <div style={{ width: '120px' }}>
                                    <span className={getExpirationStatusClass(product)}>
                                        {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : 'N/A'}
                                    </span>
                                    {product.manufacturingDate && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                            {t('manufacturing_date')}: {new Date(product.manufacturingDate).toLocaleDateString('fr-FR')}
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '80px', display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => openEditModal(product)}
                                        title={t('edit')}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleDelete(product)}
                                        style={{ color: '#EF4444' }}
                                        title={t('delete')}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de création/édition */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? t('add_product') : t('edit') + ' ' + t('product_name')}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    {modalMode === 'create' && user?.role === 'owner' && establishments.length > 0 && (
                        <EstablishmentSelector
                            selectedId={selectedEstablishment}
                            onSelect={setSelectedEstablishment}
                            className="mb-4"
                        />
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('product_name')}</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('generic_name')}</label>
                            <input type="text" name="genericName" className="form-input" value={formData.genericName} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('category')}</label>
                            <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                                <option value="médicament">💊 {t('medication') || 'Médicament'}</option>
                                <option value="dispositif_médical">🩺 {t('medical_device') || 'Dispositif médical'}</option>
                                <option value="consommable">🧻 {t('consumable') || 'Consommable'}</option>
                                <option value="parapharmacie">🧴 {t('parapharmacy') || 'Parapharmacie'}</option>
                                <option value="autre">📦 {t('other') || 'Autre'}</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('manufacturer')}</label>
                            <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('batch_number')}</label>
                            <input type="text" name="batchNumber" className="form-input" value={formData.batchNumber} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('barcode')}</label>
                            <input type="text" name="barcode" className="form-input" value={formData.barcode} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('quantity')}</label>
                            <input type="number" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('unit')}</label>
                            <select name="unit" className="form-select" value={formData.unit} onChange={handleChange}>
                                <option value="comprimé(s)">{t('tablets') || 'Comprimé(s)'}</option>
                                <option value="gélule(s)">{t('capsules') || 'Gélule(s)'}</option>
                                <option value="ml">ml</option>
                                <option value="mg">mg</option>
                                <option value="g">g</option>
                                <option value="boîte(s)">{t('box') || 'Boîte(s)'}</option>
                                <option value="flacon(s)">{t('bottle') || 'Flacon(s)'}</option>
                                <option value="ampoule(s)">{t('ampoule') || 'Ampoule(s)'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('reorder_point')}</label>
                            <input type="number" name="reorderPoint" className="form-input" value={formData.reorderPoint} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('location')}</label>
                            <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('purchase_price')} (GNF)</label>
                            <input type="number" name="purchasePrice" className="form-input" value={formData.purchasePrice} onChange={handleChange} min="0" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">{t('selling_price')} (GNF)</label>
                            <input type="number" name="sellingPrice" className="form-input" value={formData.sellingPrice} onChange={handleChange} min="0" required />
                        </div>
                    </div>

                    {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
                        <div className="form-group">
                            <div style={{ 
                                padding: 'var(--spacing-2)', 
                                borderRadius: 'var(--radius-md)', 
                                backgroundColor: formData.sellingPrice < formData.purchasePrice ? '#FEE2E2' : formData.sellingPrice === formData.purchasePrice ? '#FEF3C7' : '#D1FAE5',
                                color: formData.sellingPrice < formData.purchasePrice ? '#991B1B' : formData.sellingPrice === formData.purchasePrice ? '#92400E' : '#065F46',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                📊 {t('margin_info')} : {calculateMargin()}%
                                {formData.sellingPrice < formData.purchasePrice && ` ⚠️ ${t('sell_at_loss')}`}
                                {formData.sellingPrice === formData.purchasePrice && ` ⚠️ ${t('margin_zero')}`}
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('expiration_date')}</label>
                            <input type="date" name="expirationDate" className="form-input" value={formData.expirationDate} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('manufacturing_date')}</label>
                            <input type="date" name="manufacturingDate" className="form-input" value={formData.manufacturingDate} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('description')}</label>
                        <textarea name="description" className="form-textarea" rows="3" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <input type="checkbox" name="prescriptionRequired" checked={formData.prescriptionRequired} onChange={handleChange} />
                            {t('prescription_required')}
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">
                            {modalMode === 'create' ? t('add') : t('save')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            {t('cancel_btn')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Products;