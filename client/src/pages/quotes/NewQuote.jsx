/**
 * PAGE NOUVEAU DEVIS - Création d'un devis
 * Réutilise le panier des ventes
 * ⭐ Support multi-devises dynamique
 * ⭐ Traductions FR/EN complètes
 * ⭐ Correction saisie remise (accepte , et .)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import { productService } from '../../services/productService';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Icon from '../../components/ui/Icon';
import EstablishmentSelector from '../../components/establishment/EstablishmentSelector';
import { useLanguage } from '../../context/LanguageContext';

const NewQuote = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    // ⭐ État pour la devise configurée
    const [currency, setCurrency] = useState('GNF');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [prescriptionNumber, setPrescriptionNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState('');
    const [discountType, setDiscountType] = useState('fixed');
    
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);

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

    useEffect(() => {
        const loadData = async () => {
            try {
                const [estRes, prodRes] = await Promise.all([
                    api.get('/establishments'),
                    productService.getProducts({})
                ]);
                setEstablishments(estRes.establishments || []);
                if (estRes.establishments?.length > 0) {
                    setSelectedEstablishment(estRes.establishments[0]._id);
                }
                setProducts(prodRes.products || []);
            } catch (err) {
                console.error('Erreur chargement données:', err);
            }
        };
        loadCompanySettings();
        loadData();
    }, [loadCompanySettings]);

    useEffect(() => {
        if (searchTerm.length >= 2) {
            const term = searchTerm.toLowerCase();
            const results = products.filter(p => 
                p.isActive && p.quantity > 0 &&
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
        const existingItem = cart.find(item => item.productId === product._id);
        
        if (existingItem) {
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
                subtotal: product.sellingPrice
            }]);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            setCart(cart.filter(item => item.productId !== productId));
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
    const discountAmount = discountType === 'percentage' 
        ? (subtotal * (parseFloat(discount) || 0) / 100) 
        : (parseFloat(discount) || 0);
    const total = Math.max(0, subtotal - discountAmount);

    // ⭐ Gestionnaire de saisie pour la remise (accepte , et .)
    const handleDiscountChange = (e) => {
        let value = e.target.value.replace(',', '.');
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setDiscount(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            setError(t('empty_cart'));
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const quoteData = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                discount: parseFloat(discount) || 0,
                discountType,
                customerName,
                customerPhone,
                prescriptionNumber,
                notes,
                establishmentId: establishments.length > 0 ? selectedEstablishment : undefined
            };
            
            const response = await quoteService.createQuote(quoteData);
            
            if (response.success) {
                navigate(`/quotes/${response.quote._id}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_creating_quote'));
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <h2>
                    <Icon name="document" category="actions" fallback="📄" style={{ marginRight: '0.5rem' }} />
                    {t('new_quote')}
                </h2>
                <p style={{ color: 'var(--gray-500)' }}>{t('create_quote')}</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-6)' }}>
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
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => addToCart(product)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{product.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                                {t('stock')}: {product.quantity} {product.unit}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                                            {formatPrice(product.sellingPrice)} {currency}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3>{t('cart')} ({cart.length})</h3>
                        </div>
                        <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                                {formatPrice(item.unitPrice)} {currency}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button className="btn btn-sm btn-outline" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                                            <button className="btn btn-sm btn-outline" onClick={() => removeFromCart(item.productId)} style={{ color: 'var(--danger)' }}>✕</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="card-body" style={{ borderTop: '1px solid var(--gray-200)' }}>
                            <div className="form-group">
                                <label className="form-label">{t('customer_name')}</label>
                                <input type="text" className="form-input" placeholder={t('customer_name_placeholder')} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('customer_phone')}</label>
                                <input type="tel" className="form-input" placeholder={t('customer_phone_placeholder')} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('prescription_number')}</label>
                                <input type="text" className="form-input" placeholder={t('prescription_placeholder')} value={prescriptionNumber} onChange={(e) => setPrescriptionNumber(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('notes')}</label>
                                <textarea className="form-textarea" rows="2" placeholder={t('notes_placeholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>

                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                <span>{t('subtotal')}</span>
                                <span>{formatPrice(subtotal)} {currency}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                                <span>{t('discount')}</span>
                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <input 
                                        type="text" 
                                        style={{ width: '80px', textAlign: 'right' }} 
                                        className="form-input" 
                                        value={discount} 
                                        onChange={handleDiscountChange} 
                                        placeholder="0"
                                    />
                                    <select className="form-select" style={{ width: '80px' }} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                                        <option value="fixed">{currency}</option>
                                        <option value="percentage">%</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: 'var(--spacing-3)', paddingTop: 'var(--spacing-3)', borderTop: '2px solid var(--gray-200)' }}>
                                <span>{t('total')}</span>
                                <span style={{ color: 'var(--primary-500)' }}>{formatPrice(total)} {currency}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading || cart.length === 0}>
                                    {loading ? <Loader size="sm" /> : t('generate_quote')}
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/quotes')}>
                                    {t('cancel_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewQuote;