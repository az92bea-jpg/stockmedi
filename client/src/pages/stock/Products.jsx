/**
 * PAGE PRODUITS - Gestion complète du stock
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

    /* const calculateMargin = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const selling = parseFloat(formData.sellingPrice) || 0;
        if (purchase === 0) return 0;
        return ((selling - purchase) / purchase * 100).toFixed(1);
    };
    */

    const validatePrices = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const selling = parseFloat(formData.sellingPrice) || 0;
        
        if (purchase === 0) {
            setError("Le prix d'achat ne peut pas être nul");
            return false;
        }
        if (selling < purchase) {
            setError(`⚠️ Prix de vente (${selling} GNF) inférieur au prix d'achat (${purchase} GNF)`);
            return false;
        }
        if (selling === purchase) {
            if (!window.confirm(`⚠️ Marge nulle. Confirmer ?`)) {
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
            setError(`La date de fabrication (${formData.manufacturingDate}) est postérieure à la date d'expiration (${formData.expirationDate})`);
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expDate < today) {
            if (!window.confirm(`⚠️ La date d'expiration (${formData.expirationDate}) est déjà dépassée. Voulez-vous continuer ?`)) {
                return false;
            }
        }
        return true;
    };

    const resetForm = () => {
        setFormData({
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
            type: product.type || 'Générique',
            category: product.category || 'Médicament',
            subCategory: product.subCategory || '',
            manufacturer: product.manufacturer || '',
            batchNumber: product.batchNumber || '',
            barcode: product.barcode || '',
            quantity: product.quantity || 0,
            unit: product.unit || 'Boîtes',
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

        if (modalMode === 'create' && user?.role === 'owner' && establishments.length > 0 && !selectedEstablishment) {
            setError('Veuillez sélectionner un établissement');
            return;
        }

        if (!validatePrices()) return;
        if (!validateDates()) return;
        if (!formData.name) {
            setError('La DCI est requise');
            return;
        }

        try {
            const shouldSendEstablishment = establishments.length > 0 && selectedEstablishment;
            
            if (modalMode === 'create') {
                const productData = {
                    ...formData,
                    establishmentId: shouldSendEstablishment ? selectedEstablishment : undefined
                };
                await productService.createProduct(productData);
                setSuccess(t('product_created') || 'Produit créé avec succès');
            } else {
                // ⭐ Pour l'édition, n'envoyer que les champs modifiables
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
                    purchasePrice: formData.purchasePrice,
                    sellingPrice: formData.sellingPrice,
                    manufacturingDate: formData.manufacturingDate || null,
                    expirationDate: formData.expirationDate,
                    prescriptionRequired: formData.prescriptionRequired,
                    description: formData.description,
                    establishmentId: shouldSendEstablishment ? selectedEstablishment : undefined
                };
                await productService.updateProduct(selectedProduct._id, updateData);
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

    const getCategoryLabel = (category) => {
        const labels = {
            'Médicament': '💊 Médicament',
            'Dispositif médical': '🩺 Dispositif médical',
            'Parapharmaceutique': '🧴 Parapharmaceutique',
            'Complément alimentaire': '💪 Complément alimentaire',
            'Vitamine': '🌟 Vitamine',
            'Prestation médicale': '🏥 Prestation médicale',
            'médicament': '💊 Médicament',
            'dispositif_médical': '🩺 Dispositif médical',
            'consommable': '🧻 Consommable',
            'parapharmacie': '🧴 Parapharmacie'
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
                                <option value="Médicament">💊 Médicament</option>
                                <option value="Dispositif médical">🩺 Dispositif médical</option>
                                <option value="Parapharmaceutique">🧴 Parapharmaceutique</option>
                                <option value="Complément alimentaire">💪 Complément alimentaire</option>
                                <option value="Vitamine">🌟 Vitamine</option>
                                <option value="Prestation médicale">🏥 Prestation médicale</option>
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
                        <div style={{ width: '180px' }}>DCI</div>
                        <div style={{ width: '100px' }}>Type</div>
                        <div style={{ width: '120px' }}>Catégorie</div>
                        <div style={{ width: '80px' }}>Stock</div>
                        <div style={{ width: '100px' }}>Prix vente</div>
                        <div style={{ width: '80px' }}>Marge</div>
                        <div style={{ width: '100px' }}>Expiration</div>
                        <div style={{ width: '80px' }}>Actions</div>
                    </div>

                    {filteredProducts.map((product) => (
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
                                {product.batchNumber && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                        Lot: {product.batchNumber}
                                    </div>
                                )}
                            </div>

                            <div style={{ width: '100px', fontSize: '0.8rem' }}>
                                {product.type === 'Princeps' ? '💊 Princeps' : '💊 Générique'}
                            </div>

                           <div style={{ width: '120px', fontSize: '0.75rem' }}>
                                <div>{getCategoryLabel(product.category)}</div>
                                {product.subCategory && (
                                    <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>
                                        {product.subCategory}
                                    </div>
                                )}
                                {/* ⭐ Location affichée sous la catégorie */}
                                <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                                    📍 {product.location || 'En stock'}
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
                                <strong>{formatPrice(product.sellingPrice)} GNF</strong>
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
                                    {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : 'N/A'}
                                </span>
                            </div>

                            <div style={{ width: '80px', display: 'flex', gap: 'var(--spacing-2)' }}>
                                {canManageStock && (
                                    <>
                                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(product)} title={t('edit')}>✏️</button>
                                        <button className="btn btn-sm btn-outline" onClick={() => handleDelete(product)} style={{ color: '#EF4444' }} title={t('delete')}>🗑️</button>
                                    </>
                                )}
                                {!canManageStock && <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Lecture seule</span>}
                            </div>
                        </div>
                    ))}
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
                            <label className="form-label required">DCI</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                                <option value="Princeps">💊 Princeps</option>
                                <option value="Générique">💊 Générique</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Catégorie</label>
                            <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                                <option value="Médicament">💊 Médicament</option>
                                <option value="Dispositif médical">🩺 Dispositif médical</option>
                                <option value="Parapharmaceutique">🧴 Parapharmaceutique</option>
                                <option value="Complément alimentaire">💪 Complément alimentaire</option>
                                <option value="Vitamine">🌟 Vitamine</option>
                                <option value="Prestation médicale">🏥 Prestation médicale</option>
                            </select>
                        </div>
                        {formData.category === 'Prestation médicale' && (
                            <div className="form-group">
                                <label className="form-label">Type de prestation</label>
                                <select name="subCategory" className="form-select" value={formData.subCategory} onChange={handleChange}>
                                    <option value="">Sélectionner</option>
                                    <option value="Prise de tension">❤️ Prise de tension</option>
                                    <option value="Prise de poids">⚖️ Prise de poids</option>
                                    <option value="Prise de taille">📏 Prise de taille</option>
                                    <option value="Prise de rythme">💓 Prise de rythme</option>
                                    <option value="Test de glycémie rapide">🩸 Test de glycémie rapide</option>
                                    <option value="Vaccination">💉 Vaccination</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Fabricant</label>
                            <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">N° de lot</label>
                            <input type="text" name="batchNumber" className="form-input" value={formData.batchNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Code-barres</label>
                            <input type="text" name="barcode" className="form-input" value={formData.barcode} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Emplacement</label>
                            <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Quantité</label>
                            <input type="number" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unité</label>
                            <select name="unit" className="form-select" value={formData.unit} onChange={handleChange}>
                                <option value="Comprimés">💊 Comprimés</option>
                                <option value="Capsules">💊 Capsules</option>
                                <option value="Plaquettes">📦 Plaquettes</option>
                                <option value="Ampoules">🧪 Ampoules</option>
                                <option value="Boîtes">📦 Boîtes</option>
                                <option value="Bouteille">🍾 Bouteille</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Seuil d'alerte</label>
                            <input type="number" name="reorderPoint" className="form-input" value={formData.reorderPoint} onChange={handleChange} min="0" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Prix d'achat (GNF)</label>
                            <input type="number" name="purchasePrice" className="form-input" value={formData.purchasePrice} onChange={handleChange} min="0" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Prix de vente (GNF)</label>
                            <input type="number" name="sellingPrice" className="form-input" value={formData.sellingPrice} onChange={handleChange} min="0" required />
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
                                    📊 Marge : {margin}%
                                    {isLoss && ` ⚠️ Vente à perte (${selling} < ${purchase})`}
                                    {isZero && ` ⚠️ Marge nulle`}
                                    {!isLoss && !isZero && ` ✅ Bénéfice : ${selling - purchase} GNF`}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date de fabrication</label>
                            <input type="date" name="manufacturingDate" className="form-input" value={formData.manufacturingDate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Date d'expiration</label>
                            <input type="date" name="expirationDate" className="form-input" value={formData.expirationDate} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-textarea" rows="3" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <input type="checkbox" name="prescriptionRequired" checked={formData.prescriptionRequired} onChange={handleChange} />
                            Nécessite une ordonnance
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