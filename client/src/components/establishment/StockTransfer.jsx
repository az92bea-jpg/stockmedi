/**
 * COMPOSANT TRANSFERT DE STOCK
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getEstablishments } from '../../services/establishmentService';
import { productService } from '../../services/productService';
import { transferStock } from '../../services/establishmentService';
import Loader from '../common/Loader';
import Alert from '../common/Alert';

const StockTransfer = ({ onSuccess, onCancel }) => {
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
            setError('Erreur chargement des données');
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getAvailableStock = () => {
        if (!selectedProduct) return 0;
        // ⭐ Le stock est directement dans product.quantity
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
                setError(`Quantité maximale disponible: ${maxStock}`);
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
            setError('Veuillez remplir tous les champs');
            return;
        }
        
        if (formData.fromEstablishmentId === formData.toEstablishmentId) {
            setError('Les établissements source et destination doivent être différents');
            return;
        }
        
        const availableStock = getAvailableStock();
        if (formData.quantity <= 0) {
            setError('La quantité doit être supérieure à 0');
            return;
        }
        
        if (formData.quantity > availableStock) {
            setError(`Stock insuffisant (disponible: ${availableStock})`);
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
            
            setSuccess(response.message || 'Transfert effectué avec succès');
            await loadData();
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du transfert');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) return <Loader />;

    return (
        <div className="card">
            <div className="card-header">
                <h3>📦 Transfert de stock</h3>
            </div>
            <div className="card-body">
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}
                {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Produit</label>
                        <select
                            name="productId"
                            className="form-select"
                            value={formData.productId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionner un produit</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} - {p.establishmentId?.name || 'Établissement inconnu'} (Stock: {p.quantity || 0} {p.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Établissement source</label>
                            <input
                                type="text"
                                className="form-input"
                                value={selectedProduct?.establishmentId?.name || 'Sélectionnez un produit'}
                                disabled
                            />
                            <input
                                type="hidden"
                                name="fromEstablishmentId"
                                value={formData.fromEstablishmentId}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Établissement destination</label>
                            <select
                                name="toEstablishmentId"
                                className="form-select"
                                value={formData.toEstablishmentId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Sélectionner</option>
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
                            <label className="form-label">Quantité à transférer</label>
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
                                    Stock disponible: {getAvailableStock()} {selectedProduct.unit}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Motif (optionnel)</label>
                            <input
                                type="text"
                                name="reason"
                                className="form-input"
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Réapprovisionnement, mutation, etc."
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading || !selectedProduct || getAvailableStock() === 0}
                        >
                            {loading ? <Loader size="sm" /> : '📦 Transférer'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockTransfer;