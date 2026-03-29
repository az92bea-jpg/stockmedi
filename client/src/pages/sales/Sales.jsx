/**
 * PAGE VENTES - Point de vente et historique
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';

const Sales = () => {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    
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

    const addToCart = (product) => {
        if (product.prescriptionRequired && !prescriptionNumber) {
            setError(t('prescription_required_error') || 'Ce produit nécessite une ordonnance.');
            return;
        }

        const existingItem = cart.find(item => item.productId === product._id);
        
        if (existingItem) {
            if (existingItem.quantity + 1 > product.quantity) {
                setError(`${t('stock_insufficient') || 'Stock insuffisant'}. ${t('max_available') || 'Maximum'}: ${product.quantity}`);
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
                maxStock: product.quantity,
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
            setError(`${t('stock_insufficient') || 'Stock insuffisant'}. ${t('max_available') || 'Maximum'}: ${item.maxStock}`);
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
            setError(t('empty_cart') || 'Le panier est vide');
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
                prescriptionNumber: prescriptionNumber || undefined
            };

            const response = await saleService.createSale(saleData);
            
            if (response.success) {
                setSuccess(t('sale_success') || 'Vente enregistrée avec succès !');
                clearCart();
                setCustomerName('');
                setCustomerPhone('');
                setPrescriptionNumber('');
                setConfirmModalOpen(false);
                loadProducts();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
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
            {/* Navigation rapide */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-outline">📊 {t('nav_dashboard')}</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 {t('nav_products')}</Link>
                <Link to="/sales" className="btn btn-sm btn-primary">💰 {t('nav_sales')}</Link>
                <Link to="/reports" className="btn btn-sm btn-outline">📄 {t('nav_reports')}</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ {t('nav_settings')}</Link>
            </div>

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-6)' }}>
                    {/* Panneau gauche - Recherche */}
                    <div>
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
                                                    {t('stock')}: {product.quantity} {product.unit}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                                                    {formatPrice(product.sellingPrice)} GNF
                                                </div>
                                                {product.prescriptionRequired && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>📋 {t('prescription_required')}</div>
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
                                    {t('no_products')}
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
                                        placeholder={t('customer_name_placeholder') || 'Nom du client (optionnel)'}
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('customer_phone')}</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder={t('customer_phone_placeholder') || 'Téléphone (optionnel)'}
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('prescription_number')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('prescription_placeholder') || 'Si applicable'}
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
                                        disabled={cart.length === 0 || loading}
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
                // MODE HISTORIQUE - Version sans tableau
                <div className="card">
                    <div className="card-header">
                        <h3>{t('history')}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {historyLoading ? (
                            <Loader />
                        ) : salesHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                                {t('no_sales') || 'Aucune vente enregistrée'}
                            </div>
                        ) : (
                            <div>
                                {/* En-tête */}
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
                                    <div style={{ width: '120px' }}>{t('sale_number') || 'N° vente'}</div>
                                    <div style={{ width: '150px' }}>{t('date') || 'Date'}</div>
                                    <div style={{ width: '150px' }}>{t('customer')}</div>
                                    <div style={{ width: '80px' }}>{t('items')}</div>
                                    <div style={{ width: '120px' }}>{t('total')}</div>
                                    <div style={{ width: '120px' }}>{t('payment')}</div>
                                    <div style={{ width: '80px' }}>{t('status')}</div>
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
                title={t('confirm_sale')}
            >
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <p>{t('confirm_message')}</p>
                    <div style={{ 
                        backgroundColor: 'var(--gray-50)', 
                        padding: 'var(--spacing-3)', 
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--spacing-3)'
                    }}>
                        <div><strong>{t('total')} :</strong> {formatPrice(total)} GNF</div>
                        <div><strong>{t('items')} :</strong> {cart.reduce((sum, i) => sum + i.quantity, 0)}</div>
                        <div><strong>{t('payment_method')} :</strong> {paymentMethod === 'cash' ? t('cash') : paymentMethod === 'card' ? t('card') : t('mobile_money')}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-primary" onClick={handleConfirmSale} disabled={loading}>
                        {loading ? <Loader size="sm" /> : t('confirm')}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setConfirmModalOpen(false)}>
                        {t('cancel_btn')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;