/**
 * PAGE VENTES - Point de vente et historique
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import EstablishmentSelector from '../../components/establishment/EstablishmentSelector';
import api from '../../services/api';
import { authService } from '../../services/authService';

const Sales = () => {
    const { t } = useLanguage();
    const user = authService.getCurrentUser();
    const canMakeSales = user?.role === 'owner' || user?.role === 'super-admin' || (user?.permissions && user.permissions.includes('make_sales'));
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSaleData, setLastSaleData] = useState(null);
    const [selectedHistorySale, setSelectedHistorySale] = useState(null);    
    
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [prescriptionNumber, setPrescriptionNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('fixed');
    
    const [showHistory, setShowHistory] = useState(false);
    const [salesHistory, setSalesHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);

    // Charger les établissements
    useEffect(() => {
        loadEstablishments();
    }, []);

    const loadEstablishments = async () => {
        try {
            const response = await api.get('/establishments');
            setEstablishments(response.establishments || []);
            if (response.establishments?.length > 0) {
                setSelectedEstablishment(response.establishments[0]._id);
            }
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        }
    };

    // Charger tous les produits
    const loadProducts = async () => {
        try {
            const response = await productService.getProducts({});
            setProducts(response.products || []);
        } catch (err) {
            console.error('Erreur chargement produits:', err);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Recherche des produits
    useEffect(() => {
        if (searchTerm.length >= 2) {
            const term = searchTerm.toLowerCase();
            const hasEstablishments = establishments.length > 0;
            
            const results = products.filter(p => {
                let stockInEstablishment = p.quantity || 0;
                
                if (hasEstablishments && selectedEstablishment) {
                    const productEstId = p.establishmentId?._id || p.establishmentId;
                    if (productEstId !== selectedEstablishment) {
                        return false;
                    }
                    stockInEstablishment = p.quantity || 0;
                }
                
                return p.isActive && 
                       stockInEstablishment > 0 &&
                       (p.name?.toLowerCase().includes(term) ||
                        p.genericName?.toLowerCase().includes(term) ||
                        p.barcode?.toLowerCase().includes(term));
            });
            setSearchResults(results.slice(0, 10));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, products, selectedEstablishment, establishments]);

    // Ajout au panier
    const addToCart = (product) => {
        const stockInEstablishment = product.quantity || 0;

        if (stockInEstablishment === 0) {
            setError('Stock insuffisant');
            return;
        }

        if (product.prescriptionRequired && !prescriptionNumber) {
            setError(t('prescription_required_error') || 'Ce produit nécessite une ordonnance.');
            return;
        }

        const existingItem = cart.find(item => item.productId === product._id);
        
        if (existingItem) {
            if (existingItem.quantity + 1 > stockInEstablishment) {
                setError(`Stock insuffisant. Maximum: ${stockInEstablishment}`);
                return;
            }
            setCart(cart.map(item =>
                item.productId === product._id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product._id,
                name: product.name,
                unitPrice: product.sellingPrice,
                quantity: 1,
                subtotal: product.sellingPrice,
                maxStock: stockInEstablishment,
                prescriptionRequired: product.prescriptionRequired
            }]);
        }
        setError('');
    };

    const updateQuantity = (productId, newQuantity) => {
        const item = cart.find(i => i.productId === productId);
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        if (newQuantity > item.maxStock) {
            setError(`Stock insuffisant. Maximum: ${item.maxStock}`);
            return;
        }
        setCart(cart.map(item =>
            item.productId === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
    const taxAmount = (subtotal - discountAmount) * 0.18;
    const total = subtotal - discountAmount + taxAmount;

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
    };

    const validateSale = () => {
        if (cart.length === 0) {
            setError('Le panier est vide');
            return false;
        }
        return true;
    };

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
                prescriptionNumber: prescriptionNumber || undefined,
                establishmentId: establishments.length > 0 ? selectedEstablishment : undefined
            };

            const response = await saleService.createSale(saleData);
            
            if (response.success) {
                setLastSaleData(response.sale);
                setShowReceiptModal(true);
                setSuccess('Vente enregistrée avec succès !');
                clearCart();
                setCustomerName('');
                setCustomerPhone('');
                setPrescriptionNumber('');
                setConfirmModalOpen(false);
                loadProducts();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la vente');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = (sale) => {
        setSelectedHistorySale(sale);
        setShowReceiptModal(true);
    };

    const handlePrintReceipt = () => {
        window.print();
    };

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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)'
            }}>
                <div>
                    <h2>{t('sales_title')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>{t('sales_subtitle')}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
                    {showHistory ? `← ${t('back_to_pos')}` : `📋 ${t('history')}`}
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {!showHistory ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: 'var(--spacing-6)' }}>
                    {/* Panneau gauche */}
                    <div>
                        {establishments.length > 0 && (
                            <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                                <div className="card-body">
                                    <EstablishmentSelector
                                        selectedId={selectedEstablishment}
                                        onSelect={setSelectedEstablishment}
                                    />
                                </div>
                            </div>
                        )}

                        {establishments.length === 0 && user?.role === 'owner' && (
                            <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-4)' }}>
                                💡 Pour gérer plusieurs établissements, passez au plan <Link to="/subscription">Enterprise</Link>.
                            </div>
                        )}

                        <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <div className="card-body">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('search_product')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('search_placeholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="form-hint">{t('search_hint') || 'Saisissez au moins 2 caractères'}</div>
                                </div>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3>{t('available_products')}</h3>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {searchResults.map(product => {
                                        const stockInEstablishment = product.quantity || 0;
                                        return (
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
                                                        Stock: {stockInEstablishment} {product.unit}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                                                        {formatPrice(product.sellingPrice)} GNF
                                                    </div>
                                                    {product.prescriptionRequired && (
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>📋 Ordonnance requise</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {searchTerm.length >= 2 && searchResults.length === 0 && (
                            <div className="card">
                                <div className="card-body" style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                    {establishments.length > 0 ? 'Aucun produit trouvé dans cet établissement' : 'Aucun produit trouvé'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panneau droit - Panier */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <h3>{t('cart')}</h3>
                            </div>
                            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {cart.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 'var(--spacing-4)' }}>
                                        {t('empty_cart')}
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

                            <div className="card-body" style={{ borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('customer_name')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nom du client (optionnel)"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('customer_phone')}</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Téléphone (optionnel)"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('prescription_number')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Si applicable"
                                        value={prescriptionNumber}
                                        onChange={(e) => setPrescriptionNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                    <span>{t('subtotal')}</span>
                                    <span>{formatPrice(subtotal)} GNF</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                                    <span>{t('discount')}</span>
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
                                    <span>{t('tax')}</span>
                                    <span>{formatPrice(taxAmount)} GNF</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: 'var(--spacing-3)', paddingTop: 'var(--spacing-3)', borderTop: '2px solid var(--gray-200)' }}>
                                    <span>{t('total')}</span>
                                    <span style={{ color: 'var(--primary-500)' }}>{formatPrice(total)} GNF</span>
                                </div>

                                <div className="form-group" style={{ marginTop: 'var(--spacing-4)' }}>
                                    <label className="form-label">{t('payment_method')}</label>
                                    <select
                                        className="form-select"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">💰 {t('cash')}</option>
                                        <option value="card">💳 {t('card')}</option>
                                        <option value="mobile_money">📱 {t('mobile_money')}</option>
                                        <option value="mixed">🔀 {t('mixed')}</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 2 }}
                                        onClick={() => setConfirmModalOpen(true)}
                                        disabled={cart.length === 0 || loading || !canMakeSales}
                                        title={!canMakeSales ? "Vous n'avez pas la permission de créer des ventes" : ""}
                                    >
                                        {loading ? <Loader size="sm" /> : t('validate')}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={clearCart}
                                        disabled={cart.length === 0}
                                    >
                                        {t('clear')}
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
                        <h3>{t('history')}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {historyLoading ? (
                            <Loader />
                        ) : salesHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                                Aucune vente enregistrée
                            </div>
                        ) : (
                            <div>
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
                                    <div style={{ width: '120px' }}>N° vente</div>
                                    <div style={{ width: '150px' }}>Date</div>
                                    <div style={{ width: '150px' }}>Client</div>
                                    <div style={{ width: '80px' }}>Articles</div>
                                    <div style={{ width: '120px' }}>Total</div>
                                    <div style={{ width: '120px' }}>Paiement</div>
                                    <div style={{ width: '80px' }}>Statut</div>
                                    <div style={{ width: '60px' }}>Reçu</div>
                                </div>

                                {salesHistory.map(sale => (
                                    <div
                                        key={sale._id}
                                        style={{
                                            display: 'flex',
                                            gap: 'var(--spacing-4)',
                                            padding: 'var(--spacing-3) var(--spacing-4)',
                                            borderBottom: '1px solid var(--gray-100)',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ width: '120px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                            {sale.saleNumber}
                                        </div>
                                        <div style={{ width: '150px', fontSize: '0.875rem' }}>
                                            {new Date(sale.createdAt).toLocaleString('fr-FR')}
                                        </div>
                                        <div style={{ width: '150px', fontSize: '0.875rem' }}>
                                            {sale.customerName || '-'}
                                        </div>
                                        <div style={{ width: '80px', fontSize: '0.875rem' }}>
                                            {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                                        </div>
                                        <div style={{ width: '120px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-500)' }}>
                                            {formatPrice(sale.total)} GNF
                                        </div>
                                        <div style={{ width: '120px', fontSize: '0.875rem' }}>
                                            {sale.paymentMethod === 'cash' ? `💰 ${t('cash')}` :
                                             sale.paymentMethod === 'card' ? `💳 ${t('card')}` :
                                             sale.paymentMethod === 'mobile_money' ? `📱 ${t('mobile_money')}` : sale.paymentMethod}
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <span className={sale.isCancelled ? 'badge-danger' : 'badge-success'}>
                                                {sale.isCancelled ? t('cancelled') : t('validated')}
                                            </span>
                                        </div>
                                        <div style={{ width: '60px' }}>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleViewReceipt(sale)}
                                                title="Voir le reçu"
                                            >
                                                🧾
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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



                    {/* Modale de reçu optimisée */}
            <Modal
                isOpen={showReceiptModal}
                onClose={() => {
                    setShowReceiptModal(false);
                    setLastSaleData(null);
                    setSelectedHistorySale(null);
                }}
                title="Reçu de vente"
                size="md"
            >
                {(() => {
                    const sale = lastSaleData || selectedHistorySale;
                    if (!sale) return null;
                    
                    const company = sale.companyId || {};
                    const establishment = sale.establishmentId || {};
                    
                    // Style compact pour impression PDF
                    const receiptStyle = {
                        fontFamily: "'Courier New', monospace",
                        fontSize: '11px',
                        lineHeight: '1.3',
                        color: '#000',
                        maxWidth: '300px',
                        margin: '0 auto',
                        padding: '8px'
                    };
                    
                    return (
                        <div id="receipt-content" style={receiptStyle}>
                            {/* En-tête entreprise */}
                            <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #ccc', paddingBottom: '5px' }}>
                                {company.logo && <img src={company.logo} alt="Logo" style={{ maxWidth: '50px', maxHeight: '50px', marginBottom: '3px' }} />}
                                <strong style={{ fontSize: '12px' }}>{company.name || 'StockMedi'}</strong><br />
                                {establishment.name && <span>{establishment.name}<br /></span>}
                                {company.address && (
                                    <span>
                                        {company.address.street && `${company.address.street}, `}
                                        {company.address.city} {company.address.postalCode}<br />
                                        {company.address.country}<br />
                                    </span>
                                )}
                                <span>Tél: {establishment.phone || company.phone || ''}</span><br />
                                {company.email && <span>Email: {company.email}</span>}
                            </div>
                            
                            {/* Infos vente */}
                            <div style={{ marginBottom: '8px' }}>
                                <div><strong>Reçu N°:</strong> {sale.saleNumber}</div>
                                <div><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
                                <div><strong>Client:</strong> {sale.customerName || 'Client comptant'}</div>
                                {sale.customerPhone && <div><strong>Tél:</strong> {sale.customerPhone}</div>}
                                {sale.prescriptionNumber && <div><strong>Ordo:</strong> {sale.prescriptionNumber}</div>}
                            </div>
                            
                            {/* Tableau produits */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                                <thead>
                                    <tr style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}>
                                        <th style={{ textAlign: 'left', padding: '3px 0' }}>Produit</th>
                                        <th style={{ textAlign: 'center', padding: '3px 0' }}>Qté</th>
                                        <th style={{ textAlign: 'right', padding: '3px 0' }}>Prix</th>
                                        <th style={{ textAlign: 'right', padding: '3px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '2px 0' }}>{item.name.length > 15 ? item.name.substring(0, 15) + '.' : item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '2px 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '2px 0' }}>{formatPrice(item.unitPrice)}</td>
                                            <td style={{ textAlign: 'right', padding: '2px 0' }}>{formatPrice(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* Totaux */}
                            <div style={{ textAlign: 'right', borderTop: '1px dashed #ccc', paddingTop: '5px', marginBottom: '5px' }}>
                                <div>Sous-total: {formatPrice(sale.subtotal)} GNF</div>
                                {sale.discount > 0 && <div>Remise: -{formatPrice(sale.discount)} GNF</div>}
                                {sale.tax > 0 && <div>TVA: {formatPrice(sale.tax)} GNF</div>}
                                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '3px' }}>
                                    TOTAL: {formatPrice(sale.total)} GNF
                                </div>
                            </div>
                            
                            {/* Paiement et vendeur */}
                            <div style={{ marginBottom: '5px' }}>
                                <div><strong>Paiement:</strong> {
                                    sale.paymentMethod === 'cash' ? 'Espèces' :
                                    sale.paymentMethod === 'card' ? 'Carte' : 'Mobile Money'
                                }</div>
                                <div><strong>Vendeur:</strong> {sale.userId?.firstName} {sale.userId?.lastName}</div>
                            </div>
                            
                            {/* Pied de page */}
                            <div style={{ textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: '5px', fontSize: '10px' }}>
                                Merci de votre visite !<br />
                                {new Date().toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    );
                })()}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                        const element = document.getElementById('receipt-content');
                        const opt = {
                            margin: [0.2, 0.2, 0.2, 0.2],
                            filename: `recu_${(lastSaleData || selectedHistorySale)?.saleNumber || 'vente'}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'in', format: 'a6', orientation: 'portrait' }
                        };
                        html2pdf().set(opt).from(element).save();
                    }}>
                        🖨️ PDF
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                        const content = document.getElementById('receipt-content').innerHTML;
                        const style = '<style>body{font-family:monospace;font-size:11px;margin:5mm;}</style>';
                        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reçu</title>${style}</head><body>${content}</body></html>`;
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `recu_${(lastSaleData || selectedHistorySale)?.saleNumber || 'vente'}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}>
                        📥 HTML
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrintReceipt}>
                        🖨️ Imprimer
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                        setShowReceiptModal(false);
                        setLastSaleData(null);
                        setSelectedHistorySale(null);
                    }}>
                        Fermer
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;