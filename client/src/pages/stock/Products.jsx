/**
 * PAGE PRODUITS - Gestion complète du stock
 * ⭐ Support multi-devises dynamique
 * ⭐ Traductions FR/EN complètes
 * ⭐ Correction saisie prix (accepte , et .)
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
    const canManageStock = user?.role === 'owner' || user?.role === 'super-admin' || (user?.permissions && user.permissions.includes('manage_stock'));
    
    // ⭐ État pour la devise configurée
    const [currency, setCurrency] = useState('GNF');
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
        type: 'Générique',
        category: 'Médicament',
        subCategory: '',
        manufacturer: '',
        batchNumber: '',
        barcode: '',
        quantity: 0,
        unit: 'Boîtes',
        reorderPoint: 10,
        location: '',
        purchasePrice: '',
        sellingPrice: '',
        manufacturingDate: '',
        expirationDate: '',
        prescriptionRequired: false,
        description: ''
    });

    // ⭐ Charger la devise configurée
    const loadCompanySettings = useCallback(async () => {
        try {
            const response = await api.get('/companies/me');
            if (response.success && response.company?.settings?.currency) {
                setCurrency(response.company.settings.currency);
            }
        } catch (err) {
            console.error('Erreur chargement devise:', err);
        }
    }, []);

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
            setError(t('error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadCompanySettings();
        fetchProducts();
        if (user?.role === 'owner') {
            loadEstablishments();
        }
    }, [loadCompanySettings, fetchProducts, user?.role, loadEstablishments]);

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

    // ⭐ Gestionnaire de saisie pour les prix (accepte , et .)
    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        // Remplacer la virgule par un point
        let cleanValue = value.replace(',', '.');
        
        // Autoriser uniquement les nombres et un point décimal
        if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
            setFormData({ ...formData, [name]: cleanValue });
        }
    };

    // ⭐ Validation des prix avec devise dynamique
    const validatePrices = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const selling = parseFloat(formData.sellingPrice) || 0;
        
        if (purchase === 0) {
            setError(t('purchase_price_zero'));
            return false;
        }
        if (selling < purchase) {
            setError(`⚠️ ${t('selling_price')} (${selling} ${currency}) ${t('lower_than')} ${t('purchase_price')} (${purchase} ${currency})`);
            return false;
        }
        if (selling === purchase) {
            if (!window.confirm(`⚠️ ${t('margin_zero_confirm')}`)) {
                return false;
            }
        }
        return true;
    };

    const validateDates = () => {
        if (!formData.manufacturingDate) return true;
        
        const fabDate = new Date(formData.manufacturingDate);
        const expDate = new Date(formData.expirationDate);
        fabDate.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        
        if (fabDate > expDate) {
            setError(t('manufacturing_after_expiration'));
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expDate < today) {
            if (!window.confirm(t('expired_confirm'))) {
                return false;
            }
        }
        return true;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: t('generique'),
            category: t('medication'),
            subCategory: '',
            manufacturer: '',
            batchNumber: '',
            barcode: '',
            quantity: 0,
            unit: 'Boîtes',
            reorderPoint: 10,
            location: '',
            purchasePrice: '',
            sellingPrice: '',
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
            type: product.type || t('generique'),
            category: product.category || t('medication'),
            subCategory: product.subCategory || '',
            manufacturer: product.manufacturer || '',
            batchNumber: product.batchNumber || '',
            barcode: product.barcode || '',
            quantity: product.quantity || 0,
            unit: product.unit || 'Boîtes',
            reorderPoint: product.reorderPoint || 10,
            location: product.location || '',
            purchasePrice: product.purchasePrice?.toString() || '',
            sellingPrice: product.sellingPrice?.toString() || '',
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

        if (modalMode === 'create' && user?.role === 'owner' && establishments.length > 0 && !selectedEstablishment) {
            setError(t('select_establishment'));
            return;
        }

        if (!validatePrices()) return;
        if (!validateDates()) return;
        if (!formData.name) {
            setError(t('dci_required'));
            return;
        }

        try {
            const shouldSendEstablishment = establishments.length > 0 && selectedEstablishment;
            
            // Convertir les prix en nombres
            const productData = {
                ...formData,
                purchasePrice: parseFloat(formData.purchasePrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                establishmentId: shouldSendEstablishment ? selectedEstablishment : undefined
            };
            
            if (modalMode === 'create') {
                await productService.createProduct(productData);
                setSuccess(t('product_created'));
            } else {
                const updateData = {
                    name: formData.name,
                    type: formData.type,
                    category: formData.category,
                    subCategory: formData.subCategory,
                    manufacturer: formData.manufacturer,
                    batchNumber: formData.batchNumber,
                    barcode: formData.barcode,
                    quantity: formData.quantity,
                    unit: formData.unit,
                    reorderPoint: formData.reorderPoint,
                    location: formData.location,
                    purchasePrice: parseFloat(formData.purchasePrice) || 0,
                    sellingPrice: parseFloat(formData.sellingPrice) || 0,
                    manufacturingDate: formData.manufacturingDate || null,
                    expirationDate: formData.expirationDate,
                    prescriptionRequired: formData.prescriptionRequired,
                    description: formData.description,
                    establishmentId: shouldSendEstablishment ? selectedEstablishment : undefined
                };
                await productService.updateProduct(selectedProduct._id, updateData);
                setSuccess(t('product_updated'));
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
                setSuccess(t('product_deleted'));
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

    const getCategoryLabel = (category) => {
        const labels = {
            'Médicament': `💊 ${t('medication')}`,
            'Dispositif médical': `🩺 ${t('medical_device')}`,
            'Parapharmaceutique': `🧴 ${t('parapharmacy')}`,
            'Complément alimentaire': `💪 ${t('food_supplement')}`,
            'Vitamine': `🌟 ${t('vitamin')}`,
            'Prestation médicale': `🏥 ${t('medical_service')}`,
            'médicament': `💊 ${t('medication')}`,
            'dispositif_médical': `🩺 ${t('medical_device')}`,
            'consommable': `🧻 ${t('consumable') || 'Consommable'}`,
            'parapharmacie': `🧴 ${t('parapharmacy')}`
        };
        return labels[category] || category;
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
                {canManageStock && (
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        + {t('new_product')}
                    </button>
                )}
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
                                <option value="Médicament">💊 {t('medication')}</option>
                                <option value="Dispositif médical">🩺 {t('medical_device')}</option>
                                <option value="Parapharmaceutique">🧴 {t('parapharmacy')}</option>
                                <option value="Complément alimentaire">💪 {t('food_supplement')}</option>
                                <option value="Vitamine">🌟 {t('vitamin')}</option>
                                <option value="Prestation médicale">🏥 {t('medical_service')}</option>
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


            {/* Liste des produits */}
            {filteredProducts.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                        {filters.search ? t('no_products_search') : t('no_products')}
                    </div>
                </div>
            ) : (
                <div className="card">
                    {/* Conteneur avec scroll horizontal */}
                    <div style={{
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        width: '100%'
                    }}>
                        {/* En-tête du tableau */}
                        <div style={{
                            display: 'flex',
                            minWidth: '1000px',
                            gap: 'var(--spacing-4)',
                            padding: 'var(--spacing-3) var(--spacing-4)',
                            backgroundColor: 'var(--gray-50)',
                            borderBottom: '1px solid var(--gray-200)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--gray-600)'
                        }}>
                            <div style={{ width: '180px' }}>{t('dci')}</div>
                            <div style={{ width: '100px' }}>{t('type')}</div>
                            <div style={{ width: '120px' }}>{t('category')}</div>
                            <div style={{ width: '80px' }}>{t('stock')}</div>
                            <div style={{ width: '100px' }}>{t('selling_price')}</div>
                            <div style={{ width: '80px' }}>{t('margin')}</div>
                            <div style={{ width: '100px' }}>{t('expiration')}</div>
                            <div style={{ width: '80px' }}>{t('actions')}</div>
                        </div>

                        {/* Lignes du tableau */}
                        {filteredProducts.map((product) => (
                            <div
                                key={product._id}
                                style={{
                                    display: 'flex',
                                    minWidth: '1000px',
                                    gap: 'var(--spacing-4)',
                                    padding: 'var(--spacing-3) var(--spacing-4)',
                                    borderBottom: '1px solid var(--gray-100)',
                                    alignItems: 'center',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ width: '180px' }}>
                                    <strong>{product.name}</strong>
                                    {product.batchNumber && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                            {t('lot')}: {product.batchNumber}
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '100px', fontSize: '0.8rem' }}>
                                    {product.type === 'Princeps' ? `💊 ${t('princeps')}` : `💊 ${t('generique')}`}
                                </div>

                                <div style={{ width: '120px', fontSize: '0.75rem' }}>
                                    <div>{getCategoryLabel(product.category)}</div>
                                    {product.subCategory && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>
                                            {product.subCategory}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                                        📍 {product.location || t('in_stock')}
                                    </div>
                                    {product.establishmentId?.name && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--primary-500)', marginTop: '2px' }}>
                                            🏪 {product.establishmentId.name}
                                        </div>
                                    )}
                                </div>

                                <div style={{ width: '80px' }}>
                                    <span className={product.quantity === 0 ? 'badge-danger' : product.quantity <= product.reorderPoint ? 'badge-warning' : 'badge-success'}>
                                        {formatPrice(product.quantity)} {product.unit}
                                    </span>
                                </div>

                                <div style={{ width: '100px', fontSize: '0.875rem' }}>
                                    <strong>{formatPrice(product.sellingPrice)} {currency}</strong>
                                </div>

                                <div style={{ width: '80px' }}>
                                    {(() => {
                                        const purchase = Number(product.purchasePrice);
                                        const selling = Number(product.sellingPrice);
                                        if (purchase === 0 || isNaN(purchase)) return <span style={{ color: '#F59E0B' }}>N/A</span>;
                                        const margin = ((selling - purchase) / purchase * 100).toFixed(1);
                                        if (selling < purchase) return <span style={{ color: '#EF4444' }}>{margin}%</span>;
                                        if (selling > purchase) return <span style={{ color: '#10B981' }}>+{margin}%</span>;
                                        return <span style={{ color: '#F59E0B' }}>{margin}%</span>;
                                    })()}
                                </div>

                                <div style={{ width: '100px' }}>
                                    <span className={getExpirationStatusClass(product)}>
                                        {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : t('na')}
                                    </span>
                                </div>

                                <div style={{ width: '80px', display: 'flex', gap: 'var(--spacing-2)' }}>
                                    {canManageStock && (
                                        <>
                                            <button className="btn btn-sm btn-outline" onClick={() => openEditModal(product)} title={t('edit')}>✏️</button>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleDelete(product)} style={{ color: '#EF4444' }} title={t('delete')}>🗑️</button>
                                        </>
                                    )}
                                    {!canManageStock && <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{t('read_only')}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Modal de création/édition */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? t('add_product') : t('edit')}
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
                            <label className="form-label required">{t('dci')}</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('type')}</label>
                            <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                                <option value="Princeps">💊 {t('princeps')}</option>
                                <option value="Générique">💊 {t('generique')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('category')}</label>
                            <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                                <option value="Médicament">💊 {t('medication')}</option>
                                <option value="Dispositif médical">🩺 {t('medical_device')}</option>
                                <option value="Parapharmaceutique">🧴 {t('parapharmacy')}</option>
                                <option value="Complément alimentaire">💪 {t('food_supplement')}</option>
                                <option value="Vitamine">🌟 {t('vitamin')}</option>
                                <option value="Prestation médicale">🏥 {t('medical_service')}</option>
                            </select>
                        </div>
                        {formData.category === 'Prestation médicale' && (
                            <div className="form-group">
                                <label className="form-label">{t('service_type')}</label>
                                <select name="subCategory" className="form-select" value={formData.subCategory} onChange={handleChange}>
                                    <option value="">{t('select')}</option>
                                    <option value="Prise de tension">❤️ {t('blood_pressure')}</option>
                                    <option value="Prise de poids">⚖️ {t('weight')}</option>
                                    <option value="Prise de taille">📏 {t('height')}</option>
                                    <option value="Prise de rythme">💓 {t('heart_rate')}</option>
                                    <option value="Test de glycémie rapide">🩸 {t('glycemia_test')}</option>
                                    <option value="Vaccination">💉 {t('vaccination')}</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('manufacturer')}</label>
                            <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('lot_number')}</label>
                            <input type="text" name="batchNumber" className="form-input" value={formData.batchNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('barcode_label')}</label>
                            <input type="text" name="barcode" className="form-input" value={formData.barcode} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('location_label')}</label>
                            <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('quantity')}</label>
                            <input type="number" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('unit_label')}</label>
                            <select name="unit" className="form-select" value={formData.unit} onChange={handleChange}>
                                <option value="Comprimés">💊 {t('tablets')}</option>
                                <option value="Capsules">💊 {t('capsules')}</option>
                                <option value="Plaquettes">📦 {t('blisters') || 'Plaquettes'}</option>
                                <option value="Ampoules">🧪 {t('ampoules')}</option>
                                <option value="Boîtes">📦 {t('boxes')}</option>
                                <option value="Bouteille">🍾 {t('bottle')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('alert_threshold')}</label>
                            <input type="number" name="reorderPoint" className="form-input" value={formData.reorderPoint} onChange={handleChange} min="0" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">{t('purchase_price_label')} ({currency})</label>
                            <input 
                                type="text" 
                                name="purchasePrice" 
                                className="form-input" 
                                value={formData.purchasePrice} 
                                onChange={handlePriceChange} 
                                placeholder="0.00"
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">{t('selling_price_label')} ({currency})</label>
                            <input 
                                type="text" 
                                name="sellingPrice" 
                                className="form-input" 
                                value={formData.sellingPrice} 
                                onChange={handlePriceChange} 
                                placeholder="0.00"
                                required 
                            />
                        </div>
                    </div>

                    {(() => {
                        const purchase = parseFloat(formData.purchasePrice) || 0;
                        const selling = parseFloat(formData.sellingPrice) || 0;
                        if (purchase === 0) return null;
                        
                        const margin = ((selling - purchase) / purchase * 100).toFixed(1);
                        const isLoss = selling < purchase;
                        const isZero = selling === purchase;
                        
                        return (
                            <div className="form-group">
                                <div style={{ 
                                    padding: 'var(--spacing-2)', 
                                    borderRadius: 'var(--radius-md)', 
                                    backgroundColor: isLoss ? '#FEE2E2' : isZero ? '#FEF3C7' : '#D1FAE5',
                                    color: isLoss ? '#991B1B' : isZero ? '#92400E' : '#065F46',
                                    fontSize: '0.875rem',
                                    textAlign: 'center',
                                    fontWeight: 500
                                }}>
                                    📊 {t('margin')} : {margin}%
                                    {isLoss && ` ⚠️ ${t('sell_at_loss')} (${selling} < ${purchase})`}
                                    {isZero && ` ⚠️ ${t('margin_zero')}`}
                                    {!isLoss && !isZero && ` ✅ ${t('profit')} : ${selling - purchase} ${currency}`}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('manufacturing_date_label')}</label>
                            <input type="date" name="manufacturingDate" className="form-input" value={formData.manufacturingDate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">{t('expiration_date_label')}</label>
                            <input type="date" name="expirationDate" className="form-input" value={formData.expirationDate} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('description_label')}</label>
                        <textarea name="description" className="form-textarea" rows="3" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <input type="checkbox" name="prescriptionRequired" checked={formData.prescriptionRequired} onChange={handleChange} />
                            {t('prescription_required_label')}
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