/**
 * PAGE RAPPORTS - Export PDF/Excel
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services/authService';
import EstablishmentSelector from '../../components/establishment/EstablishmentSelector';

const Reports = () => {
    const { t } = useLanguage();
    const user = authService.getCurrentUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    
    // ⭐ État pour le sélecteur d'établissement
    const [selectedEstablishment, setSelectedEstablishment] = useState('');
    const [establishments, setEstablishments] = useState([]);
    const [subscription, setSubscription] = useState(null);

    // Charger les établissements et l'abonnement
    useEffect(() => {
        const loadData = async () => {
            try {
                const [subRes, estRes] = await Promise.all([
                    api.get('/subscription'),
                    api.get('/establishments')
                ]);
                setSubscription(subRes.subscription);
                setEstablishments(estRes.establishments || []);
                if (estRes.establishments?.length > 0) {
                    setSelectedEstablishment(estRes.establishments[0]._id);
                }
            } catch (err) {
                console.error('Erreur chargement données:', err);
            }
        };
        
        if (user?.role === 'owner') {
            loadData();
        }
    }, [user?.role]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange({
            ...dateRange,
            [name]: value
        });
    };

    const downloadFile = async (url, filename) => {
        setLoading(true);
        setError('');
        
        try {
            // ⭐ Ajouter l'établissement à l'URL si sélectionné
            let finalUrl = url;
            if (selectedEstablishment && subscription?.plan === 'enterprise') {
                const separator = url.includes('?') ? '&' : '?';
                finalUrl = `${url}${separator}establishmentId=${selectedEstablishment}`;
            }
            
            const response = await api.get(finalUrl, {
                responseType: 'blob'
            });
            
            const blob = new Blob([response], { 
                type: url.includes('pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
            
            setSuccess(t('download_success') || 'Fichier téléchargé avec succès');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(t('download_error') || 'Erreur lors du téléchargement');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const downloadInventoryPDF = () => {
        downloadFile('/reports/inventory/pdf', `inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadInventoryExcel = () => {
        downloadFile('/reports/inventory/excel', `inventaire_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadSalesExcel = () => {
        let url = '/reports/sales/excel';
        if (dateRange.startDate && dateRange.endDate) {
            url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        downloadFile(url, `ventes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const isEnterprise = subscription?.plan === 'enterprise';

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
                    <h2>{t('reports_title')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>{t('reports_subtitle')}</p>
                </div>
            </div>

            {/* ⭐ Sélecteur d'établissement (visible uniquement pour Enterprise) */}
            {user?.role === 'owner' && isEnterprise && establishments.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="card-body">
                        <EstablishmentSelector
                            selectedId={selectedEstablishment}
                            onSelect={setSelectedEstablishment}
                        />
                        <div className="form-hint" style={{ marginTop: '8px' }}>
                            ℹ️ Les rapports seront générés pour l'établissement sélectionné.
                        </div>
                    </div>
                </div>
            )}

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
            {loading && <Loader />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--spacing-6)' }}>
                
                {/* Rapport inventaire */}
                <div className="card">
                    <div className="card-header">
                        <h3>{t('inventory')}</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-4)' }}>
                            {t('inventory_desc')}
                        </p>
                        <div style={{ 
                            backgroundColor: 'var(--gray-50)', 
                            padding: 'var(--spacing-3)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: '0.875rem'
                        }}>
                            <strong>{t('info_title')}</strong>
                            <ul style={{ margin: 'var(--spacing-2) 0 0 var(--spacing-4)', color: 'var(--gray-600)' }}>
                                <li>{t('info_pdf')}</li>
                                <li>{t('info_excel')}</li>
                                {isEnterprise && <li>🏢 Filtrable par établissement</li>}
                            </ul>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                            <button 
                                className="btn btn-primary" 
                                onClick={downloadInventoryPDF}
                                disabled={loading}
                            >
                                📄 {t('download_pdf')}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={downloadInventoryExcel}
                                disabled={loading}
                            >
                                📊 {t('download_excel')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rapport des ventes */}
                <div className="card">
                    <div className="card-header">
                        <h3>{t('sales_report')}</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-4)' }}>
                            {t('sales_desc')}
                        </p>
                        <div style={{ 
                            backgroundColor: 'var(--gray-50)', 
                            padding: 'var(--spacing-3)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: '0.875rem'
                        }}>
                            <strong>{t('info_title')}</strong>
                            <ul style={{ margin: 'var(--spacing-2) 0 0 var(--spacing-4)', color: 'var(--gray-600)' }}>
                                <li>{t('info_filter')}</li>
                                <li>{t('info_currency')}</li>
                                {isEnterprise && <li>🏢 Filtrable par établissement</li>}
                            </ul>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('start_date')}</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="form-input"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('end_date')}</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="form-input"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={downloadSalesExcel}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            📊 {t('download_excel')}
                        </button>
                        <div className="form-hint" style={{ marginTop: 'var(--spacing-2)', textAlign: 'center' }}>
                            {t('leave_empty')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3>ℹ️ {t('info_title')}</h3>
                </div>
                <div className="card-body">
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-4)', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                        <li>📄 <strong>{t('info_pdf')}</strong></li>
                        <li>📊 <strong>{t('info_excel')}</strong></li>
                        <li>📅 <strong>{t('info_filter')}</strong></li>
                        <li>💵 <strong>{t('info_currency')}</strong></li>
                        {isEnterprise && <li>🏢 <strong>Rapports filtrables par établissement</strong> (plan Enterprise)</li>}
                    </ul>
                </div>
            </div>

            {/* Bouton retour */}
            <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
                <Link to="/dashboard" className="btn btn-secondary">
                    ← {t('back')}
                </Link>
            </div>
        </div>
    );
};

export default Reports;