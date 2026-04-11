/**
 * PAGE DEVIS - Liste des devis
 * Accessible à tous les plans
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import Icon from '../../components/ui/Icon';

const Quotes = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);

    const loadQuotes = useCallback(async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { status: statusFilter } : {};
            const response = await quoteService.getQuotes(params);
            setQuotes(response.quotes || []);
        } catch (err) {
            setError('Erreur lors du chargement des devis');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadQuotes();
    }, [loadQuotes]);

    const handleDeleteClick = (quote) => {
        setQuoteToDelete(quote);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!quoteToDelete) return;
        
        try {
            await quoteService.deleteQuote(quoteToDelete._id);
            setSuccess('Devis supprimé avec succès');
            loadQuotes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setShowDeleteConfirm(false);
            setQuoteToDelete(null);
        }
    };

    const handleConvertToSale = async (quote) => {
        if (!quote.canBeConverted) {
            setError('Ce devis ne peut pas être converti en vente');
            return;
        }
        
        try {
            const response = await quoteService.convertToSale(quote._id);
            if (response.success) {
                setSuccess('Devis converti en vente avec succès !');
                loadQuotes();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la conversion');
        }
    };

    const formatPrice = (price) => price?.toLocaleString() || 0;

    const getStatusBadge = (quote) => {
        const isExpired = new Date(quote.validUntil) < new Date();
        
        if (quote.status === 'converted') {
            return <span className="badge-success">✅ Converti</span>;
        }
        if (quote.status === 'cancelled') {
            return <span className="badge-danger">❌ Annulé</span>;
        }
        if (isExpired) {
            return <span className="badge-warning">⏰ Expiré</span>;
        }
        if (quote.status === 'sent') {
            return <span className="badge-info">📤 Envoyé</span>;
        }
        return <span className="badge-secondary">📝 Brouillon</span>;
    };

    if (loading && quotes.length === 0) return <Loader />;

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
                    <h2>
                        <Icon name="document" category="actions" fallback="📄" style={{ marginRight: '0.5rem' }} />
                        Devis / Proformas
                    </h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Gérez vos devis et convertissez-les en ventes
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}>
                    + Nouveau devis
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                        <label>Statut :</label>
                        <select
                            className="form-select"
                            style={{ width: '200px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tous</option>
                            <option value="draft">Brouillon</option>
                            <option value="sent">Envoyé</option>
                            <option value="converted">Converti</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des devis */}
            <div className="card">
                <div className="card-header">
                    <h3>Liste des devis ({quotes.length})</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {quotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                            Aucun devis trouvé
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>N° Devis</th>
                                        <th>Date</th>
                                        <th>Client</th>
                                        <th>Articles</th>
                                        <th>Total</th>
                                        <th>Valide jusqu'au</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map(quote => (
                                        <tr key={quote._id}>
                                            <td style={{ fontFamily: 'monospace' }}>{quote.quoteNumber}</td>
                                            <td>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</td>
                                            <td>{quote.customerName || '-'}</td>
                                            <td>{quote.items?.length || 0}</td>
                                            <td><strong>{formatPrice(quote.total)} GNF</strong></td>
                                            <td>{new Date(quote.validUntil).toLocaleDateString('fr-FR')}</td>
                                            <td>{getStatusBadge(quote)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => navigate(`/quotes/${quote._id}`)}
                                                        title="Voir"
                                                    >
                                                        👁️
                                                    </button>
                                                    {quote.canBeConverted && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleConvertToSale(quote)}
                                                            title="Convertir en vente"
                                                        >
                                                            💰
                                                        </button>
                                                    )}
                                                    {quote.status !== 'converted' && (
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => handleDeleteClick(quote)}
                                                            style={{ color: 'var(--danger)' }}
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modale de confirmation suppression */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Supprimer le devis"
                message={`Êtes-vous sûr de vouloir supprimer le devis ${quoteToDelete?.quoteNumber} ?`}
                confirmText="Supprimer"
                isDanger={true}
            />
        </div>
    );
};

export default Quotes;