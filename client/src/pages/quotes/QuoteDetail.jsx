/**
 * PAGE DÉTAIL DEVIS - Visualisation et actions
 * ⭐ Support multi-devises dynamique
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import html2pdf from 'html2pdf.js';
import { useLanguage } from '../../context/LanguageContext';

const QuoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    // ⭐ État pour la devise configurée
    const [currency, setCurrency] = useState('GNF');
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);

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

    const loadQuote = useCallback(async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuote(id);
            setQuote(response.quote);
        } catch (err) {
            setError(t('error_loading_quote'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        loadCompanySettings();
        loadQuote();
    }, [loadCompanySettings, loadQuote]);

    const handleConvertToSale = async () => {
        setConverting(true);
        setError('');
        
        try {
            const response = await quoteService.convertToSale(id);
            if (response.success) {
                setSuccess(t('quote_converted_success'));
                loadQuote();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error_converting'));
        } finally {
            setConverting(false);
            setShowConvertConfirm(false);
        }
    };

    const handlePrintPDF = () => {
        const element = document.getElementById('quote-content');
        const opt = {
            margin: [0.1, 0.1, 0.1, 0.1],
            filename: `devis_${quote?.quoteNumber || 'document'}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, letterRendering: true },
            jsPDF: { unit: 'in', format: 'a6', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return Math.round(price).toLocaleString('fr-FR');
    };

    if (loading) return <Loader />;
    if (!quote) return <Alert type="error" message={t('quote_not_found')} />;

    const company = quote.companyId || {};
    const establishment = quote.establishmentId || {};

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
                    <h2>{t('quote')} {quote.quoteNumber}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        {t('created_on')} {new Date(quote.createdAt).toLocaleDateString('fr-FR')} {t('by')} {quote.userId?.firstName} {quote.userId?.lastName}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/quotes')}>
                        ← {t('back')}
                    </button>
                    <button className="btn btn-primary" onClick={handlePrintPDF}>
                        📄 {t('download_pdf')}
                    </button>
                    {quote.canBeConverted && (
                        <button className="btn btn-success" onClick={() => setShowConvertConfirm(true)} disabled={converting}>
                            💰 {t('convert_to_sale')}
                        </button>
                    )}
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div id="quote-content" className="card" style={{ 
                padding: '8px',
                fontFamily: "'Courier New', monospace",
                fontSize: '9px',
                lineHeight: '1.2',
                maxWidth: '280px',
                margin: '0 auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '6px', borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}>
                    {company.logo && <img src={company.logo} alt="Logo" style={{ maxWidth: '40px', maxHeight: '40px', marginBottom: '2px' }} />}
                    <strong style={{ fontSize: '11px' }}>{company.name || 'StockMedi'}</strong><br />
                    {establishment.name && <span>{establishment.name}<br /></span>}
                    <span>
                        {company.address?.street && `${company.address.street}, `}
                        {company.address?.city} {company.address?.postalCode}<br />
                        {company.address?.country}<br />
                    </span>
                    <span>{t('phone')}: {establishment.phone || company.phone || ''}</span><br />
                    {company.email && <span>Email: {company.email}</span>}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '11px', margin: '2px 0' }}>{t('quote_number')}: {quote.quoteNumber}</h3>
                    <p style={{ margin: '1px 0' }}>{t('date')}: {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
                    <p style={{ margin: '1px 0' }}>{t('quote_valid_until')}: {new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
                </div>

                <div style={{ marginBottom: '6px' }}>
                    <p style={{ margin: '1px 0' }}><strong>{t('client')}:</strong> {quote.customerName || t('not_provided')}</p>
                    {quote.customerPhone && <p style={{ margin: '1px 0' }}><strong>{t('phone')}:</strong> {quote.customerPhone}</p>}
                    {quote.prescriptionNumber && <p style={{ margin: '1px 0' }}><strong>{t('prescription_number')}:</strong> {quote.prescriptionNumber}</p>}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
                    <thead>
                        <tr style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '2px 0' }}>{t('designation')}</th>
                            <th style={{ textAlign: 'center', padding: '2px 0' }}>{t('quantity_short')}</th>
                            <th style={{ textAlign: 'right', padding: '2px 0' }}>{t('unit_price_short')}</th>
                            <th style={{ textAlign: 'right', padding: '2px 0' }}>{t('total_short')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ padding: '1px 0' }}>{item.name.length > 12 ? item.name.substring(0, 12) + '.' : item.name}</td>
                                <td style={{ textAlign: 'center', padding: '1px 0' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', padding: '1px 0' }}>{formatPrice(item.unitPrice)}</td>
                                <td style={{ textAlign: 'right', padding: '1px 0' }}>{formatPrice(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ textAlign: 'right', borderTop: '1px dashed #ccc', paddingTop: '4px', marginBottom: '6px' }}>
                    <p style={{ margin: '1px 0' }}>{t('subtotal')}: {formatPrice(quote.subtotal)} {currency}</p>
                    {quote.discount > 0 && <p style={{ margin: '1px 0' }}>{t('discount')}: -{formatPrice(quote.discount)} {currency}</p>}
                    <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '2px 0' }}>
                        {t('total')}: {formatPrice(quote.total)} {currency}
                    </p>
                </div>

                {quote.notes && (
                    <div style={{ marginBottom: '4px' }}>
                        <p style={{ margin: '1px 0' }}><strong>{t('notes')}:</strong> {quote.notes}</p>
                    </div>
                )}

                <div style={{ textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: '4px', fontSize: '8px', color: 'var(--gray-500)' }}>
                    <p style={{ margin: '1px 0' }}>{t('quote_validity')}</p>
                    <p style={{ margin: '1px 0' }}>{t('quote_thank_you')}</p>
                </div>

                {quote.status === 'converted' && (
                    <div style={{ 
                        marginTop: '4px', 
                        padding: '4px', 
                        backgroundColor: 'var(--success-light)', 
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        fontSize: '8px'
                    }}>
                        ✅ {t('quote_converted_on')} {new Date(quote.convertedAt).toLocaleDateString('fr-FR')}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showConvertConfirm}
                onClose={() => setShowConvertConfirm(false)}
                onConfirm={handleConvertToSale}
                title={t('convert_to_sale')}
                message={t('convert_confirm')}
                confirmText={t('convert')}
                isDanger={false}
            />
        </div>
    );
};

export default QuoteDetail;