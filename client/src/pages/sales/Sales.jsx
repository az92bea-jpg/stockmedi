/**
 * PAGE VENTES - Point de vente et historique
 */

import React, { useState, useEffect } from 'react';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';

const Sales = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // États pour la recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    
    // États pour la vente
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [prescriptionNumber, setPrescriptionNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('fixed');
    
    // États pour l'historique
    const [showHistory, setShowHistory] = useState(false);
    const [salesHistory, setSalesHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // États pour le modal de confirmation
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Charger les produits pour la recherche
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await productService.getProducts({});
            setProducts(response.products || []);
        } catch (err) {
            console.error('Erreur chargement produits:', err);
        }
    };

    // Recherche de produits (instantanée)
    useEffect(() => {
        if (searchTerm.length >= 2) {
            const term = searchTerm.toLowerCase();
            const results = products.filter(p => 
                p.isActive && 
                p.quantity > 0 &&
                (p.name?.toLowerCase().includes(term) ||
                 p.genericName?.toLowerCase().includes(term) ||
                 p.barcode?.toLowerCase().includes(term))
            );
            setSearchResults(results.slice(0, 10));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, products]);

    // Ajouter au panier
    const addToCart = (product) => {
        // Vérifier si produit sous ordonnance
        if (product.prescriptionRequired && !prescriptionNumber) {
            setError('Ce produit nécessite une ordonnance. Veuillez saisir le numéro d\'ordonnance.');
            return;
        }

        const existingItem = cart.find(item => item.productId === product._id);
        
        if (existingItem) {
            // Augmenter la quantité
            if (existingItem.quantity + 1 > product.quantity) {
                setError(`Stock insuffisant. Maximum disponible: ${product.quantity}`);
                return;
            }
            setCart(cart.map(item =>
                item.productId === product._id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            // Ajouter nouveau produit
            setCart([...cart, {
                productId: product._id,
                name: product.name,
                unitPrice: product.sellingPrice,
                quantity: 1,
                subtotal: product.sellingPrice,
                maxStock: product.quantity,
                prescriptionRequired: product.prescriptionRequired
            }]);
        }
        setError('');
    };

    // Modifier la quantité
    const updateQuantity = (productId, newQuantity) => {
        const item = cart.find(i => i.productId === productId);
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        if (newQuantity > item.maxStock) {
            setError(`Stock insuffisant. Maximum disponible: ${item.maxStock}`);
            return;
        }
        setCart(cart.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
                : item
        ));
    };

    // Supprimer du panier
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Calcul des totaux
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
    const taxAmount = (subtotal - discountAmount) * 0.18; // TVA 18%
    const total = subtotal - discountAmount + taxAmount;

    // Vider le panier
    const clearCart = () => {
        setCart([]);
        setDiscount(0);
    };

    // Valider la vente
    const validateSale = () => {
        if (cart.length === 0) {
            setError('Le panier est vide');
            return false;
        }
        return true;
    };

    // Enregistrer la vente
    const handleConfirmSale = async () => {
        if (!validateSale()) return;

        setLoading(true);
        setError('');

        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                discount,
                discountType,
                paymentMethod,
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                prescriptionNumber: prescriptionNumber || undefined
            };

            const response = await saleService.createSale(saleData);
            
            if (response.success) {
                setSuccess('Vente enregistrée avec succès !');
                clearCart();
                setCustomerName('');
                setCustomerPhone('');
                setPrescriptionNumber('');
                setConfirmModalOpen(false);
                loadProducts(); // Recharger les produits pour mettre à jour les stocks
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    // Charger l'historique
    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await saleService.getSales({ limit: 50 });
            setSalesHistory(response.sales || []);
        } catch (err) {
            console.error('Erreur chargement historique:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
    }, [showHistory]);

    const formatPrice = (price) => price?.toLocaleString() || 0;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
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
                    <h2>Point de vente</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Enregistrez vos ventes rapidement</p>
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowHistory(!showHistory)}
                >
                    {showHistory ? '← Retour au point de vente' : '📋 Historique des ventes'}
                </button>
            </div>

            {/* Messages */}
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {!showHistory ? (
                // MODE POINT DE VENTE
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-6)' }}>
                    {/* Panneau gauche - Recherche et produits */}
                    <div>
                        {/* Recherche */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <div className="card-body">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Rechercher un produit</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nom, générique ou code-barres..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="form-hint">Saisissez au moins 2 caractères</div>
                                </div>
                            </div>
                        </div>

                        {/* Résultats de recherche */}
                        {searchResults.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3>Produits disponibles</h3>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {searchResults.map(product => (
                                        <div
                                            key={product._id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-3) var(--spacing-4)',
                                                borderBottom: '1px solid var(--gray-100)',
                                                cursor: 'pointer',
                                                transition: 'background-color var(--transition-fast)'
                                            }}
                                            onClick={() => addToCart(product)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{product.name}</div>
                                                {product.genericName && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                        {product.genericName}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                                    Stock: {product.quantity} {product.unit}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                                                    {formatPrice(product.sellingPrice)} GNF
                                                </div>
                                                {product.prescriptionRequired && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>📋 Ordonnance</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchTerm.length >= 2 && searchResults.length === 0 && (
                            <div className="card">
                                <div className="card-body" style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                    Aucun produit trouvé
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panneau droit - Panier */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <h3>Panier</h3>
                            </div>
                            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {cart.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 'var(--spacing-4)' }}>
                                        Aucun produit dans le panier
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.productId} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-2) 0',
                                            borderBottom: '1px solid var(--gray-100)'
                                        }}>
                                            <div style={{ flex: 2 }}>
                                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                    {formatPrice(item.unitPrice)} GNF
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    style={{ padding: '2px 8px' }}
                                                >
                                                    -
                                                </button>
                                                <span style={{ minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    style={{ padding: '2px 8px' }}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => removeFromCart(item.productId)}
                                                    style={{ color: 'var(--danger)', marginLeft: 'var(--spacing-2)' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Informations client et paiement */}
                            <div className="card-body" style={{ borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
                                <div className="form-group">
                                    <label className="form-label">Client</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nom du client (optionnel)"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Téléphone (optionnel)"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Numéro d'ordonnance</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Si applicable"
                                        value={prescriptionNumber}
                                        onChange={(e) => setPrescriptionNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Totaux */}
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                    <span>Sous-total</span>
                                    <span>{formatPrice(subtotal)} GNF</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                                    <span>Remise</span>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <input
                                            type="number"
                                            style={{ width: '80px', textAlign: 'right' }}
                                            className="form-input"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            min="0"
                                        />
                                        <select
                                            className="form-select"
                                            style={{ width: '80px' }}
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                        >
                                            <option value="fixed">GNF</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                    <span>TVA (18%)</span>
                                    <span>{formatPrice(taxAmount)} GNF</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: 'var(--spacing-3)', paddingTop: 'var(--spacing-3)', borderTop: '2px solid var(--gray-200)' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary-500)' }}>{formatPrice(total)} GNF</span>
                                </div>

                                <div className="form-group" style={{ marginTop: 'var(--spacing-4)' }}>
                                    <label className="form-label">Mode de paiement</label>
                                    <select
                                        className="form-select"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">💰 Espèces</option>
                                        <option value="card">💳 Carte bancaire</option>
                                        <option value="mobile_money">📱 Mobile Money</option>
                                        <option value="mixed">🔀 Mixte</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 2 }}
                                        onClick={() => setConfirmModalOpen(true)}
                                        disabled={cart.length === 0 || loading}
                                    >
                                        {loading ? <Loader size="sm" /> : 'Valider la vente'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={clearCart}
                                        disabled={cart.length === 0}
                                    >
                                        Vider
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // MODE HISTORIQUE
                <div className="card">
                    <div className="card-header">
                        <h3>Historique des ventes</h3>
                    </div>
                    <div className="table-container">
                        {historyLoading ? (
                            <Loader />
                        ) : salesHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                                Aucune vente enregistrée
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>N° vente</th>
                                        <th>Date</th>
                                        <th>Client</th>
                                        <th>Articles</th>
                                        <th>Total</th>
                                        <th>Paiement</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesHistory.map(sale => (
                                        <tr key={sale._id}>
                                            <td style={{ fontFamily: 'monospace' }}>{sale.saleNumber}</td>
                                            <td>{new Date(sale.createdAt).toLocaleString('fr-FR')}</td>
                                            <td>{sale.customerName || '-'}</td>
                                            <td>{sale.items.reduce((sum, i) => sum + i.quantity, 0)} articles</td>
                                            <td><strong>{formatPrice(sale.total)} GNF</strong></td>
                                            <td>
                                                {sale.paymentMethod === 'cash' ? '💰 Espèces' :
                                                 sale.paymentMethod === 'card' ? '💳 Carte' :
                                                 sale.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : sale.paymentMethod}
                                            </td>
                                            <td>
                                                <span className={sale.isCancelled ? 'badge-danger' : 'badge-success'}>
                                                    {sale.isCancelled ? 'Annulée' : 'Validée'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de confirmation */}
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                title="Confirmer la vente"
            >
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <p>Confirmez-vous cette vente ?</p>
                    <div style={{ 
                        backgroundColor: 'var(--gray-50)', 
                        padding: 'var(--spacing-3)', 
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--spacing-3)'
                    }}>
                        <div><strong>Total :</strong> {formatPrice(total)} GNF</div>
                        <div><strong>Articles :</strong> {cart.reduce((sum, i) => sum + i.quantity, 0)}</div>
                        <div><strong>Paiement :</strong> {paymentMethod === 'cash' ? 'Espèces' : paymentMethod === 'card' ? 'Carte' : 'Mobile Money'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-primary" onClick={handleConfirmSale} disabled={loading}>
                        {loading ? <Loader size="sm" /> : 'Confirmer'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setConfirmModalOpen(false)}>
                        Annuler
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;