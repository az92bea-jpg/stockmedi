/**
 * PAGE FOURNISSEURS - Gestion des fournisseurs
 * ⭐ Consultation, création, modification, désactivation et export PDF
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';
import html2pdf from 'html2pdf.js';

const Suppliers = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewSupplier, setViewSupplier] = useState(null);
    const [company, setCompany] = useState(null);

    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', notes: '',
        address: { street: '', city: '', country: '' },
        contactPerson: { name: '', phone: '', email: '' }
    });

    const fetchCompany = async () => {
        try {
            const res = await api.get('/companies/me');
            if (res.success) setCompany(res.company);
        } catch (err) {}
    };

    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/suppliers');
            setSuppliers(response.suppliers || []);
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchCompany(); fetchSuppliers(); }, [fetchSuppliers]);

    const resetForm = () => {
        setFormData({
            name: '', phone: '', email: '', notes: '',
            address: { street: '', city: '', country: '' },
            contactPerson: { name: '', phone: '', email: '' }
        });
    };

    const openCreateModal = () => { resetForm(); setModalMode('create'); setModalOpen(true); };
    const openEditModal = (sup) => {
        setFormData({
            name: sup.name || '', phone: sup.phone || '', email: sup.email || '', notes: sup.notes || '',
            address: sup.address || { street: '', city: '', country: '' },
            contactPerson: sup.contactPerson || { name: '', phone: '', email: '' }
        });
        setModalMode('edit'); setSelectedSupplier(sup); setModalOpen(true);
    };
    const openDetailModal = (sup) => { setViewSupplier(sup); setDetailModalOpen(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return setError('Nom et téléphone requis');
        try {
            if (modalMode === 'create') {
                await api.post('/suppliers', formData);
                setSuccess('Fournisseur créé');
            } else {
                await api.put(`/suppliers/${selectedSupplier._id}`, formData);
                setSuccess('Fournisseur mis à jour');
            }
            setModalOpen(false); fetchSuppliers(); setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Désactiver ce fournisseur ?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            setSuccess('Fournisseur désactivé'); fetchSuppliers(); setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const generateSupplierPDF = (supplier) => {
        const companyName = company?.name || 'StockMedi';
        const style = `<style>
            body{font-family:'Inter',Arial,sans-serif;font-size:11px;margin:12mm;color:#1F2937;}
            .header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #065F46;}
            .header h2{color:#065F46;margin:0;font-size:16px;}
            .header p{color:#6B7280;margin:2px 0;font-size:9px;}
            .section{margin:14px 0;}
            .section h3{color:#065F46;font-size:12px;border-bottom:1px solid #D1D5DB;padding-bottom:3px;}
            .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
            .info-item{background:#F9FAFB;padding:6px 10px;border-radius:4px;border-left:3px solid #0F6B3A;}
            .info-item strong{color:#0F6B3A;display:block;font-size:9px;text-transform:uppercase;}
            .footer{text-align:center;margin-top:16px;padding-top:6px;border-top:1px solid #D1D5DB;font-size:8px;color:#9CA3AF;}
        </style>`;

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fournisseur-${supplier.name}</title>${style}</head><body>
            <div class="header"><h2>${supplier.name}</h2><p>Fiche fournisseur — ${companyName}</p></div>
            <div class="section"><h3>📋 Informations générales</h3>
                <div class="info-grid">
                    <div class="info-item"><strong>Nom</strong>${supplier.name}</div>
                    <div class="info-item"><strong>Téléphone</strong>${supplier.phone || '-'}</div>
                    <div class="info-item"><strong>Email</strong>${supplier.email || '-'}</div>
                    <div class="info-item"><strong>Ville</strong>${supplier.address?.city || '-'}</div>
                    <div class="info-item"><strong>Adresse</strong>${supplier.address?.street || '-'}</div>
                    <div class="info-item"><strong>Pays</strong>${supplier.address?.country || '-'}</div>
                </div>
            </div>
            ${supplier.contactPerson?.name ? `<div class="section"><h3>👤 Contact</h3>
                <div class="info-grid">
                    <div class="info-item"><strong>Nom</strong>${supplier.contactPerson.name}</div>
                    <div class="info-item"><strong>Téléphone</strong>${supplier.contactPerson.phone || '-'}</div>
                    <div class="info-item"><strong>Email</strong>${supplier.contactPerson.email || '-'}</div>
                </div></div>` : ''}
            ${supplier.notes ? `<div class="section"><h3>📝 Notes</h3><p>${supplier.notes}</p></div>` : ''}
            <div class="footer">${companyName} — Fiche fournisseur générée le ${new Date().toLocaleDateString('fr-FR')}</div>
        </body></html>`;

        const opt = { margin: [5, 5, 5, 5], filename: `Fournisseur_${supplier.name.replace(/\s/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        const container = document.createElement('div');
        container.innerHTML = html;
        html2pdf().set(opt).from(container).save();
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                <div>
                    <h2><Icon name="suppliers" category="nav" fallback="🏭" style={{ width: '24px', height: '24px', marginRight: '8px' }} />Fournisseurs</h2>
                    <p style={{ color: 'var(--gray-500)' }}>Gérez vos fournisseurs de produits</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}><Icon name="add" category="actions" fallback="+" style={{ width: '16px', height: '16px', marginRight: '4px' }} />Nouveau fournisseur</button>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="card">
                <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                    {suppliers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>Aucun fournisseur</div>
                    ) : (
                        <div style={{ minWidth: '750px' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                                <div style={{ width: '200px' }}>Nom</div><div style={{ width: '150px' }}>Téléphone</div><div style={{ width: '200px' }}>Email</div><div style={{ width: '120px' }}>Ville</div><div style={{ width: '160px' }}>Actions</div>
                            </div>
                            {suppliers.map(sup => (
                                <div key={sup._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', fontSize: '0.875rem', alignItems: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <div style={{ width: '200px' }}><strong>{sup.name}</strong></div>
                                    <div style={{ width: '150px' }}>{sup.phone}</div>
                                    <div style={{ width: '200px' }}>{sup.email || '-'}</div>
                                    <div style={{ width: '120px' }}>{sup.address?.city || '-'}</div>
                                    <div style={{ width: '160px', display: 'flex', gap: '4px' }}>
                                        <button className="btn btn-sm btn-outline" onClick={() => openDetailModal(sup)} title="Voir"><Icon name="eye" category="actions" fallback="👁️" style={{ width: '14px', height: '14px' }} /></button>
                                        <button className="btn btn-sm btn-outline" onClick={() => openEditModal(sup)} title="Modifier"><Icon name="edit" category="actions" fallback="✏️" style={{ width: '14px', height: '14px' }} /></button>
                                        <button className="btn btn-sm btn-outline" onClick={() => handleDelete(sup._id)} style={{ color: 'var(--danger)' }} title="Désactiver"><Icon name="delete" category="actions" fallback="🗑️" style={{ width: '14px', height: '14px' }} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modale création/édition */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Nouveau fournisseur' : 'Modifier'} size="lg">
                <form onSubmit={handleSubmit}>
                    <h4 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="info" category="status" fallback="📋" style={{ width: '18px', height: '18px' }} />Informations générales</h4>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label required">Nom</label><input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                        <div className="form-group"><label className="form-label required">Téléphone</label><input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="form-group"><label className="form-label">Ville</label><input type="text" className="form-input" value={formData.address.city} onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Adresse</label><input type="text" className="form-input" value={formData.address.street} onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})} /></div>
                        <div className="form-group"><label className="form-label">Pays</label><input type="text" className="form-input" value={formData.address.country} onChange={(e) => setFormData({...formData, address: {...formData.address, country: e.target.value}})} /></div>
                    </div>
                    <h4 style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="user" category="nav" fallback="👤" style={{ width: '18px', height: '18px' }} />Contact</h4>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Nom</label><input type="text" className="form-input" value={formData.contactPerson.name} onChange={(e) => setFormData({...formData, contactPerson: {...formData.contactPerson, name: e.target.value}})} /></div>
                        <div className="form-group"><label className="form-label">Téléphone</label><input type="tel" className="form-input" value={formData.contactPerson.phone} onChange={(e) => setFormData({...formData, contactPerson: {...formData.contactPerson, phone: e.target.value}})} /></div>
                        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={formData.contactPerson.email} onChange={(e) => setFormData({...formData, contactPerson: {...formData.contactPerson, email: e.target.value}})} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Observations, commentaires..."></textarea></div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        <button type="submit" className="btn btn-primary">{modalMode === 'create' ? 'Créer' : 'Enregistrer'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </Modal>

            {/* Modale détail */}
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={viewSupplier?.name || 'Détail'} size="lg">
                {viewSupplier && (
                    <div id="supplier-detail-content">
                        <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                            <Icon name="info" category="status" fallback="📋" style={{ width: '16px', height: '16px', marginRight: '6px' }} />Informations générales
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Nom</strong>{viewSupplier.name}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Téléphone</strong>{viewSupplier.phone || '-'}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Email</strong>{viewSupplier.email || '-'}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Ville</strong>{viewSupplier.address?.city || '-'}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Adresse</strong>{viewSupplier.address?.street || '-'}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Pays</strong>{viewSupplier.address?.country || '-'}</div>
                        </div>
                        {viewSupplier.contactPerson?.name && (
                            <>
                                <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                    <Icon name="user" category="nav" fallback="👤" style={{ width: '16px', height: '16px', marginRight: '6px' }} />Contact
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                                    <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Nom</strong>{viewSupplier.contactPerson.name}</div>
                                    <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Téléphone</strong>{viewSupplier.contactPerson.phone || '-'}</div>
                                    <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-500)' }}><strong style={{ color: 'var(--primary-500)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase' }}>Email</strong>{viewSupplier.contactPerson.email || '-'}</div>
                                </div>
                            </>
                        )}
                        {viewSupplier.notes && (
                            <>
                                <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                    <Icon name="edit" category="actions" fallback="📝" style={{ width: '16px', height: '16px', marginRight: '6px' }} />Notes
                                </h4>
                                <div style={{ background: '#FFFBEB', padding: 'var(--spacing-3)', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: 'var(--spacing-3)' }}>{viewSupplier.notes}</div>
                            </>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--spacing-4)', paddingTop: 'var(--spacing-3)', borderTop: '1px solid var(--gray-200)' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => generateSupplierPDF(viewSupplier)}>
                                <Icon name="pdf" category="actions" fallback="📄" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Télécharger PDF
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setDetailModalOpen(false)}>
                                <Icon name="close" category="actions" fallback="✕" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Suppliers;