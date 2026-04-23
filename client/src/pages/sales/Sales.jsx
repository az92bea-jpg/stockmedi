/**
 * PAGE VENTES - Point de vente et historique
 * Support multi-devises dynamique
 * Traductions FR/EN complètes
 * Correction saisie remise + TVA sans arrondi
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import '../../styles/pages/Sales.css';

const Sales = () => {
    const { t } = useLanguage();
    const user = authService.getCurrentUser();
    const canMakeSales = user?.role === 'owner' || user?.role === 'super-admin' || (user?.permissions && user.permissions.includes('make_sales'));
    
    // État pour la devise configurée
    const [currency, setCurrency] = useState('GNF');
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
    const [discount, setDiscount] = useState('');
    const [discountType, setDiscountType] = useState('fixed');
    
    const [showHistory, setShowHistory] = useState(false);
    const [salesHistory, setSalesHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);
    const [taxRate, setTaxRate] = useState(18);

    // Charger la devise configurée et le taux de TVA
    const loadCompanySettings = useCallback(async () => {
        try {
            const response = await api.get('/companies/me');
            if (response.success) {
                setCurrency(response.company?.settings?.currency || 'GNF');
                setTaxRate(response.company?.settings?.taxRate || 18);
            }
        } catch (err) {
            console.error('Erreur chargement devise:', err);
        }
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

    const loadProducts = async () => {
        try {
            const response = await productService.getProducts({});
            setProducts(response.products || []);
        } catch (err) {
            console.error('Erreur chargement produits:', err);
        }
    };

    useEffect(() => {
        loadCompanySettings();
        loadEstablishments();
        loadProducts();
    }, [loadCompanySettings]);

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

    const addToCart = (product) => {
        const stockInEstablishment = product.quantity || 0;

        if (stockInEstablishment === 0) {
            setError(t('stock_insufficient'));
            return;
        }

        if (product.prescriptionRequired && !prescriptionNumber) {
            setError(t('prescription_required_error'));
            return;
        }

        const existingItem = cart.find(item => item.productId === product._id);
        
        if (existingItem) {
            if (existingItem.quantity + 1 > stockInEstablishment) {
                setError(`${t('stock_insufficient')}. ${t('max_available')}: ${stockInEstablishment}`);
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
            setError(`${t('stock_insufficient')}. ${t('max_available')}: ${item.maxStock}`);
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
    const discountAmount = discountType === 'percentage' ? (subtotal * (parseFloat(discount) || 0) / 100) : (parseFloat(discount) || 0);
    // Correction TVA : pas d'arrondi pour afficher les centimes
    //const taxAmount = (subtotal - discountAmount) * 0.18;
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;

    const clearCart = () => {
        setCart([]);
        setDiscount('');
    };

    const validateSale = () => {
        if (cart.length === 0) {
            setError(t('empty_cart'));
            return false;
        }
        return true;
    };

    // Gestionnaire de saisie pour la remise (accepte , et .)
    const handleDiscountChange = (e) => {
        let value = e.target.value.replace(',', '.');
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setDiscount(value);
        }
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
                discount: parseFloat(discount) || 0,
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
                setSuccess(t('sale_success'));
                clearCart();
                localStorage.removeItem('employee_daily_sales');
                setCustomerName('');
                setCustomerPhone('');
                setPrescriptionNumber('');
                setConfirmModalOpen(false);
                loadProducts();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
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

    // Formatage du prix avec 2 décimales
    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

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
                <div className="sales-grid">
                    {/* Colonne gauche - Recherche et produits */}
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
                                💡 {t('enterprise_plan_promo')} <Link to="/subscription">Enterprise</Link>.
                            </div>
                        )}

                        <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <div className="card-body">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('search_product')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('search_placeholder_sales')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="form-hint">{t('search_hint')}</div>
                                </div>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3>{t('available_products')}</h3>
                                </div>
                                <div className="card-body search-results-container">
                                    {searchResults.map(product => {
                                        const stockInEstablishment = product.quantity || 0;
                                        return (
                                            <div
                                                key={product._id}
                                                className="search-result-item"
                                                onClick={() => addToCart(product)}
                                            >
                                                <div className="search-result-info">
                                                    <div className="search-result-name">{product.name}</div>
                                                    {product.genericName && (
                                                        <div className="search-result-generic">
                                                            {product.genericName}
                                                        </div>
                                                    )}
                                                    <div className="search-result-stock">
                                                        {t('stock')}: {stockInEstablishment} {product.unit}
                                                    </div>
                                                </div>
                                                <div className="search-result-price">
                                                    {formatPrice(product.sellingPrice)} {currency}
                                                    {product.prescriptionRequired && (
                                                        <div className="search-result-prescription">
                                                            📋 {t('prescription_required')}
                                                        </div>
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
                                    {establishments.length > 0 ? t('no_products_in_establishment') : t('no_products')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Colonne droite - Panier */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <h3>{t('cart')}</h3>
                            </div>
                            
                            <div className="card-body cart-items">
                                {cart.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 'var(--spacing-4)' }}>
                                        {t('empty_cart')}
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.productId} className="cart-item">
                                            <div className="cart-item-info">
                                                <div className="cart-item-name">{item.name}</div>
                                                <div className="cart-item-price">
                                                    {formatPrice(item.unitPrice)} {currency}
                                                </div>
                                            </div>
                                            <div className="cart-item-actions">
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="cart-item-quantity">{item.quantity}</span>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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

                            <div className="cart-customer-section">
                                <div className="form-group">
                                    <label className="form-label">{t('customer_name')}</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder={t('customer_name_placeholder')} 
                                        value={customerName} 
                                        onChange={(e) => setCustomerName(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('customer_phone')}</label>
                                    <input 
                                        type="tel" 
                                        className="form-input" 
                                        placeholder={t('customer_phone_placeholder')} 
                                        value={customerPhone} 
                                        onChange={(e) => setCustomerPhone(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('prescription_number')}</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder={t('prescription_placeholder')} 
                                        value={prescriptionNumber} 
                                        onChange={(e) => setPrescriptionNumber(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="cart-total-row">
                                    <span>{t('subtotal')}</span>
                                    <span>{formatPrice(subtotal)} {currency}</span>
                                </div>
                                
                                <div className="cart-total-discount">
                                    <span>{t('discount')}</span>
                                    <div className="cart-discount-inputs">
                                        <input 
                                            type="text" 
                                            className="form-input cart-discount-input" 
                                            value={discount} 
                                            onChange={handleDiscountChange} 
                                            placeholder="0"
                                        />
                                        <select 
                                            className="form-select cart-discount-select" 
                                            value={discountType} 
                                            onChange={(e) => setDiscountType(e.target.value)}
                                        >
                                            <option value="fixed">{currency}</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="cart-total-row">
                                    <span>{t('tax')} ({taxRate}%)</span>
                                    <span>{formatPrice(taxAmount)} {currency}</span>
                                </div>
                                
                                <div className="cart-total-final">
                                    <span>{t('total')}</span>
                                    <span style={{ color: 'var(--primary-500)' }}>{formatPrice(total)} {currency}</span>
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

                                <div className="cart-actions">
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ flex: 2 }} 
                                        onClick={() => setConfirmModalOpen(true)} 
                                        disabled={cart.length === 0 || loading || !canMakeSales} 
                                        title={!canMakeSales ? t('no_permission_sales') : ""}
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

                // ... historique ...
                <div className="card">
                    <div className="card-header">
                        <h3>{t('history')}</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {historyLoading ? (
                            <Loader />
                        ) : salesHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                                {t('no_sales')}
                            </div>
                        ) : (
                            <div className="sales-history-container" style={{ overflowX: 'auto' }}>
                                <div style={{
                                    display: 'flex',
                                    minWidth: '900px',
                                    gap: 'var(--spacing-4)',
                                    padding: 'var(--spacing-3) var(--spacing-4)',
                                    backgroundColor: 'var(--gray-50)',
                                    borderBottom: '1px solid var(--gray-200)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: 'var(--gray-600)'
                                }}>
                                    <div style={{ width: '120px' }}>{t('sale_number')}</div>
                                    <div style={{ width: '150px' }}>{t('date')}</div>
                                    <div style={{ width: '150px' }}>{t('customer')}</div>
                                    <div style={{ width: '80px' }}>{t('items')}</div>
                                    <div style={{ width: '120px' }}>{t('total')}</div>
                                    <div style={{ width: '120px' }}>{t('payment')}</div>
                                    <div style={{ width: '80px' }}>{t('status')}</div>
                                    <div style={{ width: '60px' }}>{t('receipt')}</div>
                                </div>

                                {salesHistory.map(sale => (
                                    <div key={sale._id} style={{
                                        display: 'flex',
                                        minWidth: '900px',
                                        gap: 'var(--spacing-4)',
                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                        borderBottom: '1px solid var(--gray-100)',
                                        alignItems: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <div style={{ width: '120px', fontFamily: 'monospace', fontSize: '0.875rem' }}>{sale.saleNumber}</div>
                                        <div style={{ width: '150px', fontSize: '0.875rem' }}>{new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
                                        <div style={{ width: '150px', fontSize: '0.875rem' }}>{sale.customerName || '-'}</div>
                                        <div style={{ width: '80px', fontSize: '0.875rem' }}>{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</div>
                                        <div style={{ width: '120px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-500)' }}>{formatPrice(sale.total)} {currency}</div>
                                        <div style={{ width: '120px', fontSize: '0.875rem' }}>
                                            {sale.paymentMethod === 'cash' ? `💰 ${t('cash')}` : sale.paymentMethod === 'card' ? `💳 ${t('card')}` : sale.paymentMethod === 'mobile_money' ? `📱 ${t('mobile_money')}` : sale.paymentMethod}
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <span className={sale.isCancelled ? 'badge-danger' : 'badge-success'}>
                                                {sale.isCancelled ? t('cancelled') : t('validated')}
                                            </span>
                                        </div>
                                        <div style={{ width: '60px' }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleViewReceipt(sale)} title={t('view_receipt')}>🧾</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de confirmation */}
            <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title={t('confirm_sale')}>
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <p>{t('confirm_message')}</p>
                    <div style={{ backgroundColor: 'var(--gray-50)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--spacing-3)' }}>
                        <div><strong>{t('total')} :</strong> {formatPrice(total)} {currency}</div>
                        <div><strong>{t('items')} :</strong> {cart.reduce((sum, i) => sum + i.quantity, 0)}</div>
                        <div><strong>{t('payment')} :</strong> {paymentMethod === 'cash' ? t('cash') : paymentMethod === 'card' ? t('card') : t('mobile_money')}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-primary" onClick={handleConfirmSale} disabled={loading}>{loading ? <Loader size="sm" /> : t('confirm')}</button>
                    <button className="btn btn-secondary" onClick={() => setConfirmModalOpen(false)}>{t('cancel_btn')}</button>
                </div>
            </Modal>

            {/* Modale de reçu optimisée */}
            <Modal isOpen={showReceiptModal} onClose={() => { setShowReceiptModal(false); setLastSaleData(null); setSelectedHistorySale(null); }} title={t('receipt')} size="md">
                {(() => {
                    const sale = lastSaleData || selectedHistorySale;
                    if (!sale) return null;
                    
                    const company = sale.companyId || {};
                    const establishment = sale.establishmentId || {};
                    
                    const receiptStyle = { fontFamily: "'Courier New', monospace", fontSize: '9px', lineHeight: '1.2', color: '#000', maxWidth: '280px', margin: '0 auto', padding: '4px' };
                    
                    return (
                        <div id="receipt-content" style={receiptStyle}>
                            <div style={{ textAlign: 'center', marginBottom: '4px', borderBottom: '1px dashed #ccc', paddingBottom: '3px' }}>
                                {company.logo && <img src={company.logo} alt="Logo" style={{ maxWidth: '40px', maxHeight: '40px', marginBottom: '2px' }} />}
                                <strong style={{ fontSize: '11px' }}>{company.name || 'StockMedi'}</strong><br />
                                {establishment.name && <span>{establishment.name}<br /></span>}
                                {company.address && (<span>{company.address.street && `${company.address.street}, `}{company.address.city} {company.address.postalCode}<br />{company.address.country}<br /></span>)}
                                <span>{t('phone')}: {establishment.phone || company.phone || ''}</span><br />
                                {company.email && <span>Email: {company.email}</span>}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                                <div><strong>{t('receipt')} N°:</strong> {sale.saleNumber}</div>
                                <div><strong>{t('date')}:</strong> {new Date(sale.createdAt).toLocaleString('fr-FR')}</div>
                                <div><strong>{t('customer')}:</strong> {sale.customerName || t('client_comptant')}</div>
                                {sale.customerPhone && <div><strong>{t('phone')}:</strong> {sale.customerPhone}</div>}
                                {sale.prescriptionNumber && <div><strong>{t('prescription_number')}:</strong> {sale.prescriptionNumber}</div>}
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                                <thead>
                                    <tr style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}>
                                        <th style={{ textAlign: 'left', padding: '2px 0' }}>{t('product')}</th>
                                        <th style={{ textAlign: 'center', padding: '2px 0' }}>{t('quantity_short')}</th>
                                        <th style={{ textAlign: 'right', padding: '2px 0' }}>{t('price_short')}</th>
                                        <th style={{ textAlign: 'right', padding: '2px 0' }}>{t('total_short')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '1px 0' }}>{item.name.length > 12 ? item.name.substring(0, 12) + '.' : item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '1px 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '1px 0' }}>{formatPrice(item.unitPrice)}</td>
                                            <td style={{ textAlign: 'right', padding: '1px 0' }}>{formatPrice(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ textAlign: 'right', borderTop: '1px dashed #ccc', paddingTop: '3px', marginBottom: '3px' }}>
                                <div>{t('subtotal')}: {formatPrice(sale.subtotal)} {currency}</div>
                                {sale.discount > 0 && <div>{t('discount')}: -{formatPrice(sale.discount)} {currency}</div>}
                                {sale.tax > 0 && <div>{t('tax')}: {formatPrice(sale.tax)} {currency}</div>}
                                <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>{t('total')}: {formatPrice(sale.total)} {currency}</div>
                            </div>
                            <div style={{ marginBottom: '3px' }}>
                                <div><strong>{t('payment_method')}:</strong> {sale.paymentMethod === 'cash' ? t('cash') : sale.paymentMethod === 'card' ? t('card') : t('mobile_money')}</div>
                                <div><strong>{t('seller')}:</strong> {sale.userId?.firstName} {sale.userId?.lastName}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: '3px', fontSize: '8px' }}>
                                {t('thank_you')}<br />{new Date().toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    );
                })()}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { const element = document.getElementById('receipt-content'); const opt = { margin: [0.1, 0.1, 0.1, 0.1], filename: `recu_${(lastSaleData || selectedHistorySale)?.saleNumber || 'vente'}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, letterRendering: true }, jsPDF: { unit: 'in', format: 'a6', orientation: 'portrait' } }; html2pdf().set(opt).from(element).save(); }}>🖨️ PDF</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { const content = document.getElementById('receipt-content').innerHTML; const style = '<style>body{font-family:monospace;font-size:9px;margin:2mm;}</style>'; const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t('receipt')}</title>${style}</head><body>${content}</body></html>`; const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `recu_${(lastSaleData || selectedHistorySale)?.saleNumber || 'vente'}.html`; a.click(); URL.revokeObjectURL(url); }}>📥 HTML</button>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrintReceipt}>🖨️ {t('print')}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowReceiptModal(false); setLastSaleData(null); setSelectedHistorySale(null); }}>{t('close')}</button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;