/**
 * PAGE PRODUITS - Gestion complète du stock
 * Version avec validation des prix, indicateur de marge et filtrage URL
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';

const Products = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // États pour le modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // États pour les filtres
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        stockStatus: ''
    });
    
    // État du formulaire
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

    // Charger les produits
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await productService.getProducts({});
            setProducts(response.products || []);
            setFilteredProducts(response.products || []);
        } catch (err) {
            setError('Erreur lors du chargement des produits');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Récupérer les paramètres d'URL (ex: ?stockStatus=low_stock)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const stockStatusParam = params.get('stockStatus');
        
        if (stockStatusParam && (stockStatusParam === 'out_of_stock' || stockStatusParam === 'low_stock')) {
            setFilters(prev => ({ ...prev, stockStatus: stockStatusParam }));
        }
    }, [location.search]);

    // Filtrage local avec recherche insensible à la casse
    useEffect(() => {
        let results = [...products];
        
        // Recherche textuelle (insensible à la casse)
        if (filters.search && filters.search.length >= 1) {
            const searchLower = filters.search.toLowerCase();
            results = results.filter(product => 
                product.name?.toLowerCase().includes(searchLower) ||
                product.genericName?.toLowerCase().includes(searchLower) ||
                product.barcode?.toLowerCase().includes(searchLower)
            );
        }
        
        // Filtre par catégorie
        if (filters.category) {
            results = results.filter(product => product.category === filters.category);
        }
        
        // Filtre par statut de stock
        if (filters.stockStatus === 'out_of_stock') {
            results = results.filter(product => product.quantity === 0);
        } else if (filters.stockStatus === 'low_stock') {
            results = results.filter(product => product.quantity > 0 && product.quantity <= product.reorderPoint);
        }
        
        setFilteredProducts(results);
    }, [products, filters]);

    // Calcul de la marge bénéficiaire
    const calculateMargin = () => {
        const purchase = parseFloat(formData.purchasePrice) || 0;
        const selling = parseFloat(formData.sellingPrice) || 0;
        if (purchase === 0) return 0;
        return ((selling - purchase) / purchase * 100).toFixed(1);
    };

    // Validation des prix
    const validatePrices = () => {
        const purchase = parseFloat(formData.purchasePrice);
        const selling = parseFloat(formData.sellingPrice);
        
        if (purchase === 0) {
            setError('Le prix d\'achat ne peut pas être nul');
            return false;
        }
        
        if (selling < purchase) {
            setError(`⚠️ Attention : Prix de vente (${selling.toLocaleString()} GNF) inférieur au prix d'achat (${purchase.toLocaleString()} GNF). Vous allez vendre à perte !`);
            return false;
        }
        
        if (selling === purchase) {
            if (!window.confirm('⚠️ Attention : Prix de vente égal au prix d\'achat. Marge bénéficiaire nulle. Voulez-vous continuer ?')) {
                return false;
            }
        }
        
        return true;
    };

    // Validation des dates
    const validateDates = () => {
        if (formData.expirationDate && formData.manufacturingDate) {
            if (new Date(formData.manufacturingDate) > new Date(formData.expirationDate)) {
                setError('La date de fabrication ne peut pas être postérieure à la date d\'expiration');
                return false;
            }
        }
        
        if (formData.expirationDate && new Date(formData.expirationDate) < new Date()) {
            if (!window.confirm('⚠️ Attention : La date d\'expiration est déjà dépassée. Voulez-vous continuer ?')) {
                return false;
            }
        }
        
        return true;
    };

    // Réinitialiser le formulaire
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

    // Ouvrir le modal pour créer
    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setSelectedProduct(null);
        setModalOpen(true);
    };

    // Ouvrir le modal pour éditer
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

    // Soumettre le formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation des prix
        if (!validatePrices()) {
            return;
        }
        
        // Validation des dates
        if (!validateDates()) {
            return;
        }
        
        // Validation des champs obligatoires
        if (!formData.name) {
            setError('Le nom du produit est requis');
            return;
        }
        if (!formData.purchasePrice) {
            setError('Le prix d\'achat est requis');
            return;
        }
        if (!formData.sellingPrice) {
            setError('Le prix de vente est requis');
            return;
        }
        if (!formData.expirationDate) {
            setError('La date d\'expiration est requise');
            return;
        }
        
        try {
            if (modalMode === 'create') {
                await productService.createProduct(formData);
                setSuccess('Produit créé avec succès');
            } else {
                await productService.updateProduct(selectedProduct._id, formData);
                setSuccess('Produit modifié avec succès');
            }
            
            setModalOpen(false);
            fetchProducts();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
            console.error(err);
        }
    };

    // Supprimer un produit
    const handleDelete = async (product) => {
        if (window.confirm(`Voulez-vous vraiment archiver le produit "${product.name}" ?`)) {
            try {
                await productService.deleteProduct(product._id);
                setSuccess('Produit archivé avec succès');
                fetchProducts();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors de la suppression');
                console.error(err);
            }
        }
    };

    // Gérer les changements du formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Gérer les changements de filtres
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setFilters({
            search: '',
            category: '',
            stockStatus: ''
        });
    };

    // Obtenir la classe CSS pour le statut de stock
    const getStockStatusClass = (product) => {
        if (product.quantity === 0) return 'badge-danger';
        if (product.quantity <= product.reorderPoint) return 'badge-warning';
        return 'badge-success';
    };

    const getStockStatusText = (product) => {
        if (product.quantity === 0) return 'Rupture';
        if (product.quantity <= product.reorderPoint) return 'Stock faible';
        return 'En stock';
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
            {/* Navigation rapide */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-outline">📊 Tableau de bord</Link>
                <Link to="/products" className="btn btn-sm btn-primary">📦 Produits</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 Ventes</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 Rapports</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ Paramètres</Link>
            </div>

            {/* En-tête */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)'
            }}>
                <div>
                    <h2>Gestion des produits</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Gérez votre stock de produits médicaux</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + Nouveau produit
                </button>
            </div>

            {/* Messages */}
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
                            <label className="form-label">Recherche instantanée</label>
                            <input
                                type="text"
                                name="search"
                                className="form-input"
                                placeholder="Nom, générique, code-barres..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                autoComplete="off"
                            />
                            <div className="form-hint">La recherche s'effectue automatiquement</div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Catégorie</label>
                            <select
                                name="category"
                                className="form-select"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">Toutes</option>
                                <option value="médicament">💊 Médicament</option>
                                <option value="dispositif_médical">🩺 Dispositif médical</option>
                                <option value="consommable">🧻 Consommable</option>
                                <option value="parapharmacie">🧴 Parapharmacie</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Statut stock</label>
                            <select
                                name="stockStatus"
                                className="form-select"
                                value={filters.stockStatus}
                                onChange={handleFilterChange}
                            >
                                <option value="">Tous</option>
                                <option value="out_of_stock">⚠️ Rupture</option>
                                <option value="low_stock">📉 Stock faible</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={resetFilters}>
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des produits */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Catégorie</th>
                                <th>Stock</th>
                                <th>Prix achat</th>
                                <th>Prix vente</th>
                                <th>Marge</th>
                                <th>Expiration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                                        {filters.search ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit trouvé'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const margin = product.purchasePrice > 0 
                                        ? ((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)
                                        : 0;
                                    const isLoss = product.sellingPrice < product.purchasePrice;
                                    
                                    return (
                                        <tr key={product._id}>
                                            <td>
                                                <strong>{product.name}</strong>
                                                {product.genericName && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                        {product.genericName}
                                                    </div>
                                                )}
                                                {product.batchNumber && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                                        Lot: {product.batchNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.75rem' }}>
                                                    {product.category === 'médicament' ? '💊 Médicament' :
                                                     product.category === 'dispositif_médical' ? '🩺 DM' :
                                                     product.category === 'consommable' ? '🧻 Consommable' : 
                                                     product.category === 'parapharmacie' ? '🧴 Parapharmacie' : product.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStockStatusClass(product)}>
                                                    {formatPrice(product.quantity)} {product.unit}
                                                </span>
                                                <div style={{ fontSize: '0.7rem' }}>{getStockStatusText(product)}</div>
                                            </td>
                                            <td>{formatPrice(product.purchasePrice)} GNF</td>
                                            <td><strong>{formatPrice(product.sellingPrice)} GNF</strong></td>
                                            <td>
                                                <span style={{ 
                                                    color: isLoss ? 'var(--danger)' : margin > 0 ? 'var(--success)' : 'var(--warning)',
                                                    fontWeight: 500
                                                }}>
                                                    {margin}%
                                                    {isLoss && ' ⚠️'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getExpirationStatusClass(product)}>
                                                    {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : 'N/A'}
                                                </span>
                                                {product.manufacturingDate && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                                        Fab: {new Date(product.manufacturingDate).toLocaleDateString('fr-FR')}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => openEditModal(product)}
                                                        title="Modifier"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => handleDelete(product)}
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Archiver"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de création/édition */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? 'Ajouter un produit' : 'Modifier le produit'}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Nom du produit</label>
                            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nom générique</label>
                            <input type="text" name="genericName" className="form-input" value={formData.genericName} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Catégorie</label>
                            <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                                <option value="médicament">💊 Médicament</option>
                                <option value="dispositif_médical">🩺 Dispositif médical</option>
                                <option value="consommable">🧻 Consommable</option>
                                <option value="parapharmacie">🧴 Parapharmacie</option>
                                <option value="autre">📦 Autre</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fabricant</label>
                            <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Numéro de lot</label>
                            <input type="text" name="batchNumber" className="form-input" value={formData.batchNumber} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code-barres</label>
                            <input type="text" name="barcode" className="form-input" value={formData.barcode} onChange={handleChange} />
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
                                <option value="comprimé(s)">Comprimé(s)</option>
                                <option value="gélule(s)">Gélule(s)</option>
                                <option value="ml">ml</option>
                                <option value="mg">mg</option>
                                <option value="g">g</option>
                                <option value="boîte(s)">Boîte(s)</option>
                                <option value="flacon(s)">Flacon(s)</option>
                                <option value="ampoule(s)">Ampoule(s)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Seuil d'alerte</label>
                            <input type="number" name="reorderPoint" className="form-input" value={formData.reorderPoint} onChange={handleChange} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Emplacement</label>
                            <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} placeholder="Étagère, armoire..." />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Prix d'achat (GNF)</label>
                            <input 
                                type="number" 
                                name="purchasePrice" 
                                className="form-input" 
                                value={formData.purchasePrice} 
                                onChange={handleChange} 
                                min="0" 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Prix de vente (GNF)</label>
                            <input 
                                type="number" 
                                name="sellingPrice" 
                                className="form-input" 
                                value={formData.sellingPrice} 
                                onChange={handleChange} 
                                min="0" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Indicateur de marge */}
                    {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
                        <div className="form-group">
                            <div style={{ 
                                padding: 'var(--spacing-2)', 
                                borderRadius: 'var(--radius-md)', 
                                backgroundColor: (() => {
                                    const purchase = parseFloat(formData.purchasePrice);
                                    const selling = parseFloat(formData.sellingPrice);
                                    if (selling < purchase) return '#FEE2E2';
                                    if (selling === purchase) return '#FEF3C7';
                                    return '#D1FAE5';
                                })(),
                                color: (() => {
                                    const purchase = parseFloat(formData.purchasePrice);
                                    const selling = parseFloat(formData.sellingPrice);
                                    if (selling < purchase) return '#991B1B';
                                    if (selling === purchase) return '#92400E';
                                    return '#065F46';
                                })(),
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                📊 Marge bénéficiaire : {calculateMargin()}%
                                {formData.sellingPrice < formData.purchasePrice && ' ⚠️ VENTE À PERTE !'}
                                {formData.sellingPrice === formData.purchasePrice && ' ⚠️ MARGE NULLE'}
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label required">Date d'expiration</label>
                            <input
                                type="date"
                                name="expirationDate"
                                className="form-input"
                                value={formData.expirationDate}
                                onChange={handleChange}
                                required
                            />
                            <div className="form-hint">Date de péremption du produit</div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date de fabrication</label>
                            <input
                                type="date"
                                name="manufacturingDate"
                                className="form-input"
                                value={formData.manufacturingDate}
                                onChange={handleChange}
                            />
                            <div className="form-hint">Optionnelle - Pour la traçabilité</div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-textarea" rows="3" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <input type="checkbox" name="prescriptionRequired" checked={formData.prescriptionRequired} onChange={handleChange} />
                            Ordonnance requise
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)' }}>
                        <button type="submit" className="btn btn-primary">
                            {modalMode === 'create' ? 'Créer le produit' : 'Enregistrer'}
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

export default Products;