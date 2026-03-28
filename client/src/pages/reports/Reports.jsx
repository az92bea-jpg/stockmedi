/**
 * PAGE RAPPORTS - Export PDF/Excel avec navigation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

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
            const response = await api.get(url, {
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
            
            setSuccess('Fichier téléchargé avec succès');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Erreur lors du téléchargement');
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

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Navigation interne */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--gray-200)',
                flexWrap: 'wrap'
            }}>
                <Link to="/dashboard" className="btn btn-sm btn-outline">📊 Tableau de bord</Link>
                <Link to="/products" className="btn btn-sm btn-outline">📦 Produits</Link>
                <Link to="/sales" className="btn btn-sm btn-outline">💰 Ventes</Link>
                <Link to="/reports" className="btn btn-sm btn-primary">📄 Rapports</Link>
                <Link to="/settings" className="btn btn-sm btn-outline">⚙️ Paramètres</Link>
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
                    <h2>Rapports et exportations</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Exportez vos données en PDF ou Excel
                    </p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
            {loading && <Loader />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--spacing-6)' }}>
                
                {/* Rapport inventaire */}
                <div className="card">
                    <div className="card-header">
                        <h3>📦 Rapport d'inventaire</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-4)' }}>
                            Exportez la liste complète de vos produits avec les stocks, prix et dates d'expiration.
                        </p>
                        <div style={{ 
                            backgroundColor: 'var(--gray-50)', 
                            padding: 'var(--spacing-3)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: '0.875rem'
                        }}>
                            <strong>Contenu :</strong>
                            <ul style={{ margin: 'var(--spacing-2) 0 0 var(--spacing-4)', color: 'var(--gray-600)' }}>
                                <li>Liste complète des produits</li>
                                <li>Stocks et seuils d'alerte</li>
                                <li>Prix d'achat et de vente</li>
                                <li>Dates de fabrication et expiration</li>
                                <li>Résumé des valeurs totales</li>
                            </ul>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                            <button 
                                className="btn btn-primary" 
                                onClick={downloadInventoryPDF}
                                disabled={loading}
                            >
                                📄 Télécharger PDF
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={downloadInventoryExcel}
                                disabled={loading}
                            >
                                📊 Télécharger Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rapport des ventes */}
                <div className="card">
                    <div className="card-header">
                        <h3>💰 Rapport des ventes</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-4)' }}>
                            Exportez l'historique de vos ventes avec détails par transaction.
                        </p>
                        <div style={{ 
                            backgroundColor: 'var(--gray-50)', 
                            padding: 'var(--spacing-3)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)',
                            fontSize: '0.875rem'
                        }}>
                            <strong>Contenu :</strong>
                            <ul style={{ margin: 'var(--spacing-2) 0 0 var(--spacing-4)', color: 'var(--gray-600)' }}>
                                <li>Numéro de vente et date</li>
                                <li>Articles vendus et quantités</li>
                                <li>Montants (sous-total, remise, TVA, total)</li>
                                <li>Mode de paiement</li>
                                <li>Chiffre d'affaires total</li>
                            </ul>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date début</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="form-input"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date fin</label>
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
                            📊 Télécharger Excel
                        </button>
                        <div className="form-hint" style={{ marginTop: 'var(--spacing-2)', textAlign: 'center' }}>
                            Laissez vide pour exporter toutes les ventes
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                <div className="card-header">
                    <h3>ℹ️ Informations sur les exports</h3>
                </div>
                <div className="card-body">
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-4)', color: 'var(--gray-600)', lineHeight: '1.8' }}>
                        <li>📄 <strong>PDF :</strong> Format optimisé pour l'impression et l'archivage</li>
                        <li>📊 <strong>Excel :</strong> Format modifiable avec feuille de résumé et données détaillées</li>
                        <li>📅 <strong>Filtrage :</strong> Les rapports de ventes peuvent être filtrés par période</li>
                        <li>💵 <strong>Devise :</strong> Tous les montants sont affichés en Francs Guinéens (GNF)</li>
                        <li>📁 <strong>Nom des fichiers :</strong> Format automatique avec date (ex: inventaire_2024-01-15.pdf)</li>
                    </ul>
                </div>
            </div>

            {/* Bouton retour */}
            <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center' }}>
                <Link to="/dashboard" className="btn btn-secondary">
                    ← Retour au tableau de bord
                </Link>
            </div>
        </div>
    );
};

export default Reports;