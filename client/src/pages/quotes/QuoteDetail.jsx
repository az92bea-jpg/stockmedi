/**
 * PAGE DÉTAIL DEVIS - Visualisation et actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import html2pdf from 'html2pdf.js';

const QuoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);

    const loadQuote = useCallback(async () => {
        try {
            setLoading(true);
            const response = await quoteService.getQuote(id);
            setQuote(response.quote);
        } catch (err) {
            setError('Erreur lors du chargement du devis');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadQuote();
    }, [loadQuote]);

    const handleConvertToSale = async () => {
        setConverting(true);
        setError('');
        
        try {
            const response = await quoteService.convertToSale(id);
            if (response.success) {
                setSuccess('Devis converti en vente avec succès !');
                loadQuote();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la conversion');
        } finally {
            setConverting(false);
            setShowConvertConfirm(false);
        }
    };

    /* 
    const handlePrintPDF = () => {
        const element = document.getElementById('quote-content');
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `devis_${quote?.quoteNumber || 'document'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };
    */
   // Format pdf pour A6
   const handlePrintPDF = () => {
        const element = document.getElementById('quote-content');
        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `devis_${quote?.quoteNumber || 'document'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a6', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const formatPrice = (price) => price?.toLocaleString() || 0;

    if (loading) return <Loader />;
    if (!quote) return <Alert type="error" message="Devis non trouvé" />;

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
                    <h2>Devis {quote.quoteNumber}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')} par {quote.userId?.firstName} {quote.userId?.lastName}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/quotes')}>
                        ← Retour
                    </button>
                    <button className="btn btn-primary" onClick={handlePrintPDF}>
                        📄 Télécharger PDF
                    </button>
                    {quote.canBeConverted && (
                        <button className="btn btn-success" onClick={() => setShowConvertConfirm(true)} disabled={converting}>
                            💰 Convertir en vente
                        </button>
                    )}
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div id="quote-content" className="card" style={{ padding: 'var(--spacing-6)' }}>
                {/* En-tête entreprise */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <h2>{company.name || 'StockMedi'}</h2>
                    {establishment.name && <p>{establishment.name}</p>}
                    <p>{company.address?.street} {company.address?.city}</p>
                    <p>Tél: {establishment.phone || company.phone}</p>
                    <p>Email: {company.email}</p>
                </div>

                {/* Titre devis */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <h3>DEVIS N° {quote.quoteNumber}</h3>
                    <p>Date: {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
                    <p>Valable jusqu'au: {new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
                </div>

                {/* Infos client */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <p><strong>Client:</strong> {quote.customerName || 'Non renseigné'}</p>
                    {quote.customerPhone && <p><strong>Téléphone:</strong> {quote.customerPhone}</p>}
                    {quote.prescriptionNumber && <p><strong>Ordonnance n°:</strong> {quote.prescriptionNumber}</p>}
                </div>

                {/* Tableau produits */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-6)' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--gray-300)' }}>
                            <th style={{ textAlign: 'left', padding: 'var(--spacing-2)' }}>Désignation</th>
                            <th style={{ textAlign: 'center', padding: 'var(--spacing-2)' }}>Qté</th>
                            <th style={{ textAlign: 'right', padding: 'var(--spacing-2)' }}>P.U.</th>
                            <th style={{ textAlign: 'right', padding: 'var(--spacing-2)' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: 'var(--spacing-2)' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', padding: 'var(--spacing-2)' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', padding: 'var(--spacing-2)' }}>{formatPrice(item.unitPrice)} GNF</td>
                                <td style={{ textAlign: 'right', padding: 'var(--spacing-2)' }}>{formatPrice(item.subtotal)} GNF</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totaux */}
                <div style={{ textAlign: 'right', marginBottom: 'var(--spacing-6)' }}>
                    <p>Sous-total: {formatPrice(quote.subtotal)} GNF</p>
                    {quote.discount > 0 && <p>Remise: -{formatPrice(quote.discount)} GNF</p>}
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: 'var(--spacing-3)' }}>
                        TOTAL: {formatPrice(quote.total)} GNF
                    </p>
                </div>

                {/* Notes et pied de page */}
                {quote.notes && (
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        <p><strong>Notes:</strong> {quote.notes}</p>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', color: 'var(--gray-500)' }}>
                    <p>Ce devis est valable 7 jours.</p>
                    <p>Merci de votre confiance.</p>
                </div>

                {quote.status === 'converted' && (
                    <div style={{ 
                        marginTop: 'var(--spacing-4)', 
                        padding: 'var(--spacing-3)', 
                        backgroundColor: 'var(--success-light)', 
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        ✅ Ce devis a été converti en vente le {new Date(quote.convertedAt).toLocaleDateString('fr-FR')}
                    </div>
                )}
            </div>

            {/* Modale de confirmation conversion */}
            <ConfirmModal
                isOpen={showConvertConfirm}
                onClose={() => setShowConvertConfirm(false)}
                onConfirm={handleConvertToSale}
                title="Convertir en vente"
                message={`Êtes-vous sûr de vouloir convertir ce devis en vente ? Les stocks seront déduits.`}
                confirmText="Convertir"
                isDanger={false}
            />
        </div>
    );
};

export default QuoteDetail;