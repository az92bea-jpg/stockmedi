/**
 * COMPOSANT TRANSFERT DE STOCK
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getEstablishments, transferStock } from '../../services/establishmentService';
import { productService } from '../../services/productService';
import Loader from '../common/Loader';
import Alert from '../common/Alert';
import { useLanguage } from '../../context/LanguageContext';

const StockTransfer = ({ onSuccess, onCancel }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [establishments, setEstablishments] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [formData, setFormData] = useState({
        productId: '',
        fromEstablishmentId: '',
        toEstablishmentId: '',
        quantity: 1,
        reason: ''
    });
    
    const [selectedProduct, setSelectedProduct] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoadingData(true);
            
            const [establishmentsRes, productsRes] = await Promise.all([
                getEstablishments(),
                productService.getProducts({})
            ]);
            
            setEstablishments(establishmentsRes.establishments || []);
            setProducts(productsRes.products || []);
            
        } catch (err) {
            setError(t('error_loading_data'));
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    }, [t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getAvailableStock = () => {
        if (!selectedProduct) return 0;
        return selectedProduct.quantity || 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'productId') {
            const product = products.find(p => p._id === value);
            setSelectedProduct(product);
            setFormData({
                productId: value,
                fromEstablishmentId: product?.establishmentId || '',
                toEstablishmentId: '',
                quantity: 1,
                reason: ''
            });
        } 
        else if (name === 'toEstablishmentId') {
            setFormData(prev => ({ ...prev, toEstablishmentId: value }));
        }
        else if (name === 'quantity') {
            const quantity = parseInt(value) || 0;
            const maxStock = getAvailableStock();
            if (quantity > maxStock) {
                setError(`${t('max_quantity_available')}: ${maxStock}`);
                return;
            }
            setError('');
            setFormData(prev => ({ ...prev, quantity }));
        }
        else if (name === 'reason') {
            setFormData(prev => ({ ...prev, reason: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.productId || !formData.fromEstablishmentId || !formData.toEstablishmentId) {
            setError(t('fill_all_fields'));
            return;
        }
        
        if (formData.fromEstablishmentId === formData.toEstablishmentId) {
            setError(t('different_establishments_required'));
            return;
        }
        
        const availableStock = getAvailableStock();
        if (formData.quantity <= 0) {
            setError(t('quantity_greater_than_zero'));
            return;
        }
        
        if (formData.quantity > availableStock) {
            setError(`${t('stock_insufficient')} (${t('available')}: ${availableStock})`);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await transferStock({
                productId: formData.productId,
                fromEstablishmentId: formData.fromEstablishmentId,
                toEstablishmentId: formData.toEstablishmentId,
                quantity: formData.quantity,
                reason: formData.reason
            });
            
            setSuccess(response.message || t('transfer_success'));
            await loadData();
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || t('error_transfer'));
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) return <Loader />;

    return (
        <div className="card">
            <div className="card-header">
                <h3>📦 {t('transfer_stock')}</h3>
            </div>
            <div className="card-body">
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('product')}</label>
                        <select
                            name="productId"
                            className="form-select"
                            value={formData.productId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">{t('select_product')}</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} - {p.establishmentId?.name || t('unknown_establishment')} ({t('stock')}: {p.quantity || 0} {p.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('source_establishment')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={selectedProduct?.establishmentId?.name || t('select_product_first')}
                                disabled
                            />
                            <input
                                type="hidden"
                                name="fromEstablishmentId"
                                value={formData.fromEstablishmentId}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('destination_establishment')}</label>
                            <select
                                name="toEstablishmentId"
                                className="form-select"
                                value={formData.toEstablishmentId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">{t('select')}</option>
                                {establishments
                                    .filter(est => est._id !== formData.fromEstablishmentId)
                                    .map(est => (
                                        <option key={est._id} value={est._id}>
                                            {est.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">{t('quantity_to_transfer')}</label>
                            <input
                                type="number"
                                name="quantity"
                                className="form-input"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                max={getAvailableStock()}
                                required
                                disabled={!selectedProduct || getAvailableStock() === 0}
                            />
                            {selectedProduct && (
                                <div className="form-hint">
                                    {t('available_stock')}: {getAvailableStock()} {selectedProduct.unit}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('reason_optional')}</label>
                            <input
                                type="text"
                                name="reason"
                                className="form-input"
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder={t('restock_transfer_etc')}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading || !selectedProduct || getAvailableStock() === 0}
                        >
                            {loading ? <Loader size="sm" /> : `📦 ${t('transfer')}`}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            {t('cancel_btn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockTransfer;