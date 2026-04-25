/**
 * PAGE DEVIS - Liste des devis
 * Accessible à tous les plans
 * Support multi-devises dynamique
 * Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const Quotes = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    const [currency, setCurrency] = useState('GNF');
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);

    const hasFetchedSettings = useRef(false);

    const loadCompanySettings = useCallback(async () => {
        if (hasFetchedSettings.current) return;
        hasFetchedSettings.current = true;
        
        try {
            const response = await api.get('/companies/me');
            if (response.success && response.company?.settings?.currency) {
                setCurrency(response.company.settings.currency);
            }
        } catch (err) {
            console.error('Erreur chargement devise:', err);
        }
    }, []);

    const loadQuotes = useCallback(async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { status: statusFilter } : {};
            const response = await quoteService.getQuotes(params);
            setQuotes(response.quotes || []);
        } catch (err) {
            setError(t('error_loading_quotes'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, t]);

    useEffect(() => {
        loadCompanySettings();
    }, [loadCompanySettings]);

    useEffect(() => {
        loadQuotes();
    }, [statusFilter, loadQuotes]);

    const handleDeleteClick = (quote) => {
        setQuoteToDelete(quote);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!quoteToDelete) return;
        
        try {
            await quoteService.deleteQuote(quoteToDelete._id);
            setSuccess(t('quote_deleted_success'));
            loadQuotes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setShowDeleteConfirm(false);
            setQuoteToDelete(null);
        }
    };

    const handleConvertToSale = async (quote) => {
        if (!quote.canBeConverted) {
            setError(t('cannot_convert'));
            return;
        }
        
        try {
            const response = await quoteService.convertToSale(quote._id);
            if (response.success) {
                setSuccess(t('quote_converted_success'));
                loadQuotes();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return Math.round(price).toLocaleString('fr-FR');
    };

    const getStatusBadge = (quote) => {
        const isExpired = new Date(quote.validUntil) < new Date();
        
        if (quote.status === 'converted') {
            return <span className="badge-success"><Icon name="success" category="status" fallback="✅" style={{ width: '12px', height: '12px', marginRight: '4px' }} />{t('quote_status_converted')}</span>;
        }
        if (quote.status === 'cancelled') {
            return <span className="badge-danger"><Icon name="error" category="status" fallback="❌" style={{ width: '12px', height: '12px', marginRight: '4px' }} />{t('quote_status_cancelled')}</span>;
        }
        if (isExpired) {
            return <span className="badge-warning"><Icon name="clock" category="status" fallback="⏰" style={{ width: '12px', height: '12px', marginRight: '4px' }} />{t('quote_status_expired')}</span>;
        }
        if (quote.status === 'sent') {
            return <span className="badge-info"><Icon name="send" category="actions" fallback="📤" style={{ width: '12px', height: '12px', marginRight: '4px' }} />{t('quote_status_sent')}</span>;
        }
        return <span className="badge-secondary"><Icon name="edit" category="actions" fallback="📝" style={{ width: '12px', height: '12px', marginRight: '4px' }} />{t('quote_status_draft')}</span>;
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
                        {t('quotes_title')}
                    </h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        {t('quotes_subtitle')}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}>
                    + {t('new_quote')}
                </button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                        <label>{t('status')} :</label>
                        <select
                            className="form-select"
                            style={{ width: '200px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('all')}</option>
                            <option value="draft">{t('quote_status_draft')}</option>
                            <option value="sent">{t('quote_status_sent')}</option>
                            <option value="converted">{t('quote_status_converted')}</option>
                            <option value="cancelled">{t('quote_status_cancelled')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des devis */}
            <div className="card">
                <div className="card-header">
                    <h3>{t('all_quotes')} ({quotes.length})</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {quotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>
                            {t('no_quotes')}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('quote_number')}</th>
                                        <th>{t('date')}</th>
                                        <th>{t('client')}</th>
                                        <th>{t('items')}</th>
                                        <th>{t('total')}</th>
                                        <th>{t('quote_valid_until')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map(quote => (
                                        <tr key={quote._id}>
                                            <td style={{ fontFamily: 'monospace' }}>{quote.quoteNumber}</td>
                                            <td>{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</td>
                                            <td>{quote.customerName || '-'}</td>
                                            <td>{quote.items?.length || 0}</td>
                                            <td><strong>{formatPrice(quote.total)} {currency}</strong></td>
                                            <td>{new Date(quote.validUntil).toLocaleDateString('fr-FR')}</td>
                                            <td>{getStatusBadge(quote)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn btn-sm btn-outline" onClick={() => navigate(`/quotes/${quote._id}`)} title={t('view')}>
                                                        <Icon name="eye" category="actions" fallback="👁️" style={{ width: '16px', height: '16px' }} />
                                                    </button>
                                                    {quote.canBeConverted && (
                                                        <button className="btn btn-sm btn-success" onClick={() => handleConvertToSale(quote)} title={t('convert_to_sale')}>
                                                            <Icon name="sales" category="nav" fallback="💰" style={{ width: '16px', height: '16px' }} />
                                                        </button>
                                                    )}
                                                    {quote.status !== 'converted' && (
                                                        <button className="btn btn-sm btn-outline" onClick={() => handleDeleteClick(quote)} style={{ color: 'var(--danger)' }} title={t('delete')}>
                                                            <Icon name="delete" category="actions" fallback="🗑️" style={{ width: '16px', height: '16px' }} />
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
                title={t('delete_quote')}
                message={`${t('quote_delete_confirm')} ${quoteToDelete?.quoteNumber} ?`}
                confirmText={t('delete')}
                isDanger={true}
            />
        </div>
    );
};

export default Quotes;