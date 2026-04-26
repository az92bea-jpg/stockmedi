/**
 * PAGE DOSSIERS PHARMACEUTIQUES PATIENTS (DPP)
 * Liste, recherche, archivage, export PDF/Excel
 * Suivi des traitements et constantes dynamiques
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';
import html2pdf from 'html2pdf.js';

const PatientRecords = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [showArchives, setShowArchives] = useState(false);
    const [archives, setArchives] = useState([]);

    const emptyRecord = {
        lastName: '', firstName: '', dateOfBirth: '', phone: '', email: '', address: '',
        medicalHistory: { chronicDiseases: '', allergies: '', currentTreatments: '', surgicalHistory: '', drugIntolerances: '' },
        treatmentFollowUps: [],
        vitalSigns: [],
        pharmacistNotes: ''
    };

    const [formData, setFormData] = useState(emptyRecord);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/patients?search=${search}&page=${page}&limit=20`);
            setRecords(response.records || []);
            setPagination(response.pagination);
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    }, [search, page, t]);

    const fetchArchives = async () => {
        try {
            const response = await api.get('/patients/archives');
            setArchives(response.records || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchRecords(); }, [fetchRecords]);
    useEffect(() => { if (showArchives) fetchArchives(); }, [showArchives]);

    const openCreateModal = () => {
        setFormData(emptyRecord);
        setModalMode('create');
        setSelectedRecord(null);
        setModalOpen(true);
    };

    const openEditModal = (record) => {
        setFormData({
            lastName: record.lastName || '',
            firstName: record.firstName || '',
            dateOfBirth: record.dateOfBirth ? record.dateOfBirth.split('T')[0] : '',
            phone: record.phone || '',
            email: record.email || '',
            address: record.address || '',
            medicalHistory: record.medicalHistory || { chronicDiseases: '', allergies: '', currentTreatments: '', surgicalHistory: '', drugIntolerances: '' },
            treatmentFollowUps: record.treatmentFollowUps || [],
            vitalSigns: record.vitalSigns || [],
            pharmacistNotes: record.pharmacistNotes || ''
        });
        setModalMode('edit');
        setSelectedRecord(record);
        setModalOpen(true);
    };

    const openDetailModal = (record) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.lastName || !formData.firstName) {
            setError(t('fill_required_fields'));
            return;
        }
        try {
            if (modalMode === 'create') {
                await api.post('/patients', formData);
                setSuccess(t('record_created') || 'Dossier créé');
            } else {
                await api.put(`/patients/${selectedRecord._id}`, formData);
                setSuccess(t('record_updated') || 'Dossier mis à jour');
            }
            setModalOpen(false);
            fetchRecords();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete') || 'Supprimer définitivement ?')) return;
        try {
            await api.delete(`/patients/${id}`);
            setSuccess(t('record_deleted') || 'Dossier supprimé');
            if (showArchives) fetchArchives(); else fetchRecords();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const handleArchive = async (id) => {
        try {
            await api.put(`/patients/${id}/archive`);
            setSuccess(t('record_archived') || 'Dossier archivé');
            fetchRecords();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const addTreatment = () => {
        setFormData({
            ...formData,
            treatmentFollowUps: [...formData.treatmentFollowUps, { date: '', medication: '', dosage: '', duration: '', observation: '' }]
        });
    };

    const removeTreatment = (index) => {
        const updated = formData.treatmentFollowUps.filter((_, i) => i !== index);
        setFormData({ ...formData, treatmentFollowUps: updated });
    };

    const updateTreatment = (index, field, value) => {
        const updated = [...formData.treatmentFollowUps];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, treatmentFollowUps: updated });
    };

    const addVitalSign = () => {
        setFormData({
            ...formData,
            vitalSigns: [...formData.vitalSigns, { date: '', systolicPressure: '', diastolicPressure: '', glycemia: '', heartRate: '', weight: '', temperature: '' }]
        });
    };

    const removeVitalSign = (index) => {
        const updated = formData.vitalSigns.filter((_, i) => i !== index);
        setFormData({ ...formData, vitalSigns: updated });
    };

    const updateVitalSign = (index, field, value) => {
        const updated = [...formData.vitalSigns];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, vitalSigns: updated });
    };

    if (loading && records.length === 0) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                <div>
                    <h2>
                        <Icon name="patients" category="nav" fallback="🩺" style={{ width: '24px', height: '24px', marginRight: '8px' }} />
                        {t('patients_title') || 'Dossiers Pharmaceutiques Patients'}
                    </h2>
                    <p style={{ color: 'var(--gray-500)' }}>{t('patients_subtitle') || 'Suivi pharmaceutique de vos patients'}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" onClick={() => setShowArchives(!showArchives)}>
                        <Icon name="archives" category="nav" fallback="📁" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {showArchives ? t('active_records') || 'Dossiers actifs' : t('archives') || 'Archives'}
                    </button>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Icon name="add" category="actions" fallback="+" style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {t('new_record') || 'Nouveau dossier'}
                    </button>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {!showArchives && (
                <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="card-body">
                        <input type="text" className="form-input" placeholder={t('search_patient') || 'Rechercher...'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                </div>
            )}

            {!showArchives && (
                <div className="card">
                    <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                        {records.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>{t('no_records') || 'Aucun dossier'}</div>
                        ) : (
                            <div style={{ minWidth: '900px' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                    <div style={{ width: '160px' }}>{t('record_number') || 'N° Dossier'}</div>
                                    <div style={{ width: '140px' }}>{t('patient') || 'Patient'}</div>
                                    <div style={{ width: '100px' }}>{t('date_of_birth') || 'Né(e) le'}</div>
                                    <div style={{ width: '120px' }}>{t('phone') || 'Téléphone'}</div>
                                    <div style={{ width: '100px' }}>{t('treatments') || 'Traitements'}</div>
                                    <div style={{ width: '100px' }}>{t('last_update') || 'Mis à jour'}</div>
                                    <div style={{ width: '180px' }}>{t('actions') || 'Actions'}</div>
                                </div>
                                {records.map(record => (
                                    <div key={record._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', alignItems: 'center', fontSize: '0.875rem', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <div style={{ width: '160px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-500)' }}>{record.recordNumber}</div>
                                        <div style={{ width: '140px' }}><strong>{record.lastName}</strong> {record.firstName}</div>
                                        <div style={{ width: '100px' }}>{record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString('fr-FR') : '-'}</div>
                                        <div style={{ width: '120px' }}>{record.phone || '-'}</div>
                                        <div style={{ width: '100px' }}>{record.treatmentFollowUps?.length || 0}</div>
                                        <div style={{ width: '100px' }}>{new Date(record.updatedAt).toLocaleDateString('fr-FR')}</div>
                                        <div style={{ width: '180px', display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => openDetailModal(record)} title={t('view') || 'Voir'}><Icon name="eye" category="actions" fallback="👁️" style={{ width: '14px', height: '14px' }} /></button>
                                            <button className="btn btn-sm btn-outline" onClick={() => openEditModal(record)} title={t('edit') || 'Modifier'}><Icon name="edit" category="actions" fallback="✏️" style={{ width: '14px', height: '14px' }} /></button>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleArchive(record._id)} title={t('archive') || 'Archiver'}><Icon name="archives" category="nav" fallback="📁" style={{ width: '14px', height: '14px' }} /></button>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleDelete(record._id)} style={{ color: 'var(--danger)' }} title={t('delete') || 'Supprimer'}><Icon name="delete" category="actions" fallback="🗑️" style={{ width: '14px', height: '14px' }} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {pagination && pagination.pages > 1 && (
                        <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)' }}>
                            <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                            <span style={{ padding: '4px 12px' }}>{page} / {pagination.pages}</span>
                            <button className="btn btn-sm btn-outline" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>→</button>
                        </div>
                    )}
                </div>
            )}

            {showArchives && (
                <div className="card">
                    <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                        {archives.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--gray-500)' }}>{t('no_archives') || 'Aucun dossier archivé'}</div>
                        ) : (
                            <div style={{ minWidth: '700px' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                    <div style={{ width: '160px' }}>N° Dossier</div>
                                    <div style={{ width: '140px' }}>Patient</div>
                                    <div style={{ width: '120px' }}>Archivé le</div>
                                    <div style={{ width: '120px' }}>Suppression auto</div>
                                    <div style={{ width: '160px' }}>Actions</div>
                                </div>
                                {archives.map(record => (
                                    <div key={record._id} style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--gray-100)', alignItems: 'center', fontSize: '0.875rem' }}>
                                        <div style={{ width: '160px', fontFamily: 'monospace' }}>{record.recordNumber}</div>
                                        <div style={{ width: '140px' }}><strong>{record.lastName}</strong> {record.firstName}</div>
                                        <div style={{ width: '120px' }}>{record.archivedAt ? new Date(record.archivedAt).toLocaleDateString('fr-FR') : '-'}</div>
                                        <div style={{ width: '120px', color: 'var(--danger)' }}>{record.archiveAutoDeleteAt ? new Date(record.archiveAutoDeleteAt).toLocaleDateString('fr-FR') : '-'}</div>
                                        <div style={{ width: '160px', display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleDelete(record._id)} style={{ color: 'var(--danger)' }} title={t('delete_permanently') || 'Supprimer définitivement'}><Icon name="delete" category="actions" fallback="🗑️" style={{ width: '14px', height: '14px' }} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modale détail */}
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedRecord?.recordNumber || 'Détail'} size="lg">
                {selectedRecord && (
                    <>
                        <div id="patient-detail-content">
                            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)', paddingBottom: 'var(--spacing-3)', borderBottom: '2px solid var(--primary-500)' }}>
                                <h3 style={{ color: 'var(--primary-500)', margin: 0 }}>StockMedi</h3>
                                <p style={{ color: 'var(--gray-500)', margin: '4px 0', fontSize: '0.85rem' }}>Dossier Pharmaceutique Patient</p>
                                <p style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gray-700)', margin: '4px 0' }}>{selectedRecord.recordNumber}</p>
                            </div>

                            <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                <Icon name="user" category="nav" fallback="👤" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                {t('personal_info') || 'Informations personnelles'}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('last_name')}:</strong> {selectedRecord.lastName}</div>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('first_name')}:</strong> {selectedRecord.firstName}</div>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('date_of_birth')}:</strong> {selectedRecord.dateOfBirth ? new Date(selectedRecord.dateOfBirth).toLocaleDateString('fr-FR') : '-'}</div>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('phone')}:</strong> {selectedRecord.phone || '-'}</div>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('email')}:</strong> {selectedRecord.email || '-'}</div>
                                <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: '6px' }}><strong style={{ color: 'var(--primary-500)' }}>{t('address')}:</strong> {selectedRecord.address || '-'}</div>
                            </div>
                            
                            <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                <Icon name="medical" category="actions" fallback="🏥" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                {t('medical_history') || 'Antécédents médicaux'}
                            </h4>
                            <div style={{ backgroundColor: '#F0FDF4', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-3)', border: '1px solid #D1FAE5' }}>
                                <p style={{ margin: '4px 0' }}><strong style={{ color: '#065F46' }}>{t('chronic_diseases') || 'Maladies chroniques'}:</strong> {selectedRecord.medicalHistory?.chronicDiseases || '-'}</p>
                                <p style={{ margin: '4px 0' }}><strong style={{ color: '#065F46' }}>{t('allergies') || 'Allergies'}:</strong> {selectedRecord.medicalHistory?.allergies || '-'}</p>
                                <p style={{ margin: '4px 0' }}><strong style={{ color: '#065F46' }}>{t('current_treatments') || 'Traitement en cours'}:</strong> {selectedRecord.medicalHistory?.currentTreatments || '-'}</p>
                                <p style={{ margin: '4px 0' }}><strong style={{ color: '#065F46' }}>{t('surgical_history') || 'Antécédents chirurgicaux'}:</strong> {selectedRecord.medicalHistory?.surgicalHistory || '-'}</p>
                                <p style={{ margin: '4px 0' }}><strong style={{ color: '#065F46' }}>{t('drug_intolerances') || 'Intolérances médicamenteuses'}:</strong> {selectedRecord.medicalHistory?.drugIntolerances || '-'}</p>
                            </div>

                            <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                <Icon name="treatment" category="actions" fallback="💊" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                {t('treatment_followup') || 'Suivi des traitements'}
                            </h4>
                            {selectedRecord.treatmentFollowUps?.length > 0 ? (
                                <div style={{ overflowX: 'auto', marginBottom: 'var(--spacing-3)' }}>
                                    <table className="table">
                                        <thead><tr style={{ backgroundColor: '#065F46' }}><th style={{ color: 'white' }}>Date</th><th style={{ color: 'white' }}>Médicament</th><th style={{ color: 'white' }}>Posologie</th><th style={{ color: 'white' }}>Durée</th><th style={{ color: 'white' }}>Observation</th></tr></thead>
                                        <tbody>{selectedRecord.treatmentFollowUps.map((tr, i) => (<tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F0FDF4' : 'white' }}><td>{new Date(tr.date).toLocaleDateString('fr-FR')}</td><td>{tr.medication}</td><td>{tr.dosage}</td><td>{tr.duration}</td><td>{tr.observation || '-'}</td></tr>))}</tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-3)', fontStyle: 'italic' }}>Aucun suivi</p>}

                            <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                <Icon name="vitals" category="actions" fallback="🩺" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                {t('vital_signs') || 'Suivi des constantes'}
                            </h4>
                            {selectedRecord.vitalSigns?.length > 0 ? (
                                <div style={{ overflowX: 'auto', marginBottom: 'var(--spacing-3)' }}>
                                    <table className="table">
                                        <thead><tr style={{ backgroundColor: '#065F46' }}><th style={{ color: 'white' }}>Date</th><th style={{ color: 'white' }}>Tension</th><th style={{ color: 'white' }}>Glycémie</th><th style={{ color: 'white' }}>Pouls</th><th style={{ color: 'white' }}>Poids</th><th style={{ color: 'white' }}>Temp.</th></tr></thead>
                                        <tbody>{selectedRecord.vitalSigns.map((vs, i) => (<tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F0FDF4' : 'white' }}><td>{new Date(vs.date).toLocaleDateString('fr-FR')}</td><td>{vs.systolicPressure || '-'}/{vs.diastolicPressure || '-'}</td><td>{vs.glycemia || '-'}</td><td>{vs.heartRate || '-'}</td><td>{vs.weight || '-'}</td><td>{vs.temperature || '-'}</td></tr>))}</tbody>
                                    </table>
                                </div>
                            ) : <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-3)', fontStyle: 'italic' }}>Aucune constante</p>}

                            <h4 style={{ color: 'var(--primary-500)', fontSize: '0.95rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '4px' }}>
                                <Icon name="edit" category="actions" fallback="📝" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
                                {t('pharmacist_notes') || 'Notes du pharmacien'}
                            </h4>
                            <div style={{ backgroundColor: '#FFFBEB', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-3)', border: '1px solid #FDE68A' }}>
                                <p style={{ margin: 0, fontStyle: selectedRecord.pharmacistNotes ? 'normal' : 'italic', color: selectedRecord.pharmacistNotes ? 'var(--gray-700)' : 'var(--gray-400)' }}>{selectedRecord.pharmacistNotes || 'Aucune note'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--gray-200)' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                const content = document.getElementById('patient-detail-content').innerHTML;
                                const style = `<style>body{font-family:'Inter',Arial,sans-serif;font-size:11px;margin:12mm;color:#1F2937;}h4{color:#065F46;font-size:13px;margin:16px 0 8px 0;border-bottom:1px solid #D1D5DB;padding-bottom:4px;}table{width:100%;border-collapse:collapse;margin:8px 0 16px 0;font-size:10px;}th{background:#065F46;color:white;padding:6px 8px;text-align:left;font-weight:600;}td{padding:6px 8px;border-bottom:1px solid #E5E7EB;}</style>`;
                                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DPP-${selectedRecord.recordNumber}</title>${style}</head><body>${content}</body></html>`;
                                const opt = { margin: [5, 5, 5, 5], filename: `DPP_${selectedRecord.recordNumber}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
                                const container = document.createElement('div');
                                container.innerHTML = html;
                                html2pdf().set(opt).from(container).save();
                            }}>
                                <Icon name="pdf" category="actions" fallback="📄" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                {t('download_pdf') || 'Télécharger PDF'}
                            </button>
                            <button className="btn btn-success btn-sm" onClick={() => {
                                const rows = [];
                                rows.push(['STOCKMEDI - DOSSIER PHARMACEUTIQUE PATIENT']);rows.push(['']);rows.push(['N° Dossier', selectedRecord.recordNumber]);rows.push(['Nom', selectedRecord.lastName]);rows.push(['Prénom', selectedRecord.firstName]);rows.push(['Date de naissance', selectedRecord.dateOfBirth ? new Date(selectedRecord.dateOfBirth).toLocaleDateString('fr-FR') : '']);rows.push(['Téléphone', selectedRecord.phone || '']);rows.push(['Email', selectedRecord.email || '']);rows.push(['Adresse', selectedRecord.address || '']);rows.push(['']);rows.push(['ANTÉCÉDENTS MÉDICAUX']);rows.push(['Maladies chroniques', selectedRecord.medicalHistory?.chronicDiseases || '']);rows.push(['Allergies', selectedRecord.medicalHistory?.allergies || '']);rows.push(['Traitement en cours', selectedRecord.medicalHistory?.currentTreatments || '']);rows.push(['Antécédents chirurgicaux', selectedRecord.medicalHistory?.surgicalHistory || '']);rows.push(['Intolérances médicamenteuses', selectedRecord.medicalHistory?.drugIntolerances || '']);rows.push(['']);rows.push(['SUIVI DES TRAITEMENTS']);rows.push(['Date', 'Médicament', 'Posologie', 'Durée', 'Observation']);(selectedRecord.treatmentFollowUps || []).forEach(tr => rows.push([new Date(tr.date).toLocaleDateString('fr-FR'), tr.medication, tr.dosage, tr.duration, tr.observation || '']));rows.push(['']);rows.push(['SUIVI DES CONSTANTES']);rows.push(['Date', 'Tension (mmHg)', 'Glycémie (g/L)', 'Pouls (bpm)', 'Poids (kg)', 'Température (°C)']);(selectedRecord.vitalSigns || []).forEach(vs => rows.push([new Date(vs.date).toLocaleDateString('fr-FR'), `${vs.systolicPressure || '-'}/${vs.diastolicPressure || '-'}`, vs.glycemia || '', vs.heartRate || '', vs.weight || '', vs.temperature || '']));rows.push(['']);rows.push(['NOTES DU PHARMACIEN']);rows.push([selectedRecord.pharmacistNotes || 'Aucune note']);rows.push(['']);rows.push([`Document généré le ${new Date().toLocaleDateString('fr-FR')} par StockMedi`]);
                                const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `DPP_${selectedRecord.recordNumber}.csv`; a.click();
                            }}>
                                <Icon name="excel" category="actions" fallback="📊" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                {t('download_excel') || 'Télécharger Excel'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setDetailModalOpen(false)}>
                                <Icon name="close" category="actions" fallback="✕" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                {t('close')}
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            {/* Modale formulaire création/édition */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? (t('new_record') || 'Nouveau dossier') : (t('edit') || 'Modifier')} size="lg">
                <form onSubmit={handleSubmit}>
                    <h4 style={{ marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-500)' }}>
                        <Icon name="user" category="nav" fallback="👤" style={{ width: '18px', height: '18px' }} />
                        {t('personal_info') || 'Informations personnelles'}
                    </h4>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label required">{t('last_name')}</label><input type="text" className="form-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required /></div>
                        <div className="form-group"><label className="form-label required">{t('first_name')}</label><input type="text" className="form-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">{t('date_of_birth')}</label><input type="date" className="form-input" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} /></div>
                        <div className="form-group"><label className="form-label">{t('phone')}</label><input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">{t('email')}</label><input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="form-group"><label className="form-label">{t('address')}</label><input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
                    </div>

                    <h4 style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-500)' }}>
                        <Icon name="medical" category="actions" fallback="🏥" style={{ width: '18px', height: '18px' }} />
                        {t('medical_history') || 'Antécédents médicaux'}
                    </h4>
                    <div className="form-group"><label className="form-label">{t('chronic_diseases')}</label><input type="text" className="form-input" value={formData.medicalHistory.chronicDiseases} onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, chronicDiseases: e.target.value}})} placeholder="Ex: Diabète, HTA" /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">{t('allergies')}</label><input type="text" className="form-input" value={formData.medicalHistory.allergies} onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, allergies: e.target.value}})} placeholder="Ex: Pénicilline" /></div>
                        <div className="form-group"><label className="form-label">{t('drug_intolerances')}</label><input type="text" className="form-input" value={formData.medicalHistory.drugIntolerances} onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, drugIntolerances: e.target.value}})} placeholder="Ex: Aspirine" /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">{t('current_treatments')}</label><input type="text" className="form-input" value={formData.medicalHistory.currentTreatments} onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, currentTreatments: e.target.value}})} placeholder="Ex: Metformine 500mg" /></div>
                        <div className="form-group"><label className="form-label">{t('surgical_history')}</label><input type="text" className="form-input" value={formData.medicalHistory.surgicalHistory} onChange={(e) => setFormData({...formData, medicalHistory: {...formData.medicalHistory, surgicalHistory: e.target.value}})} placeholder="Ex: Appendicectomie" /></div>
                    </div>

                    <h4 style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-500)' }}>
                        <Icon name="treatment" category="actions" fallback="💊" style={{ width: '18px', height: '18px' }} />
                        {t('treatment_followup') || 'Suivi des traitements'}
                    </h4>
                    {formData.treatmentFollowUps.map((item, i) => (
                        <div key={i} style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '8px', marginBottom: '8px', position: 'relative', border: '1px solid #D1FAE5' }}>
                            <button type="button" onClick={() => removeTreatment(i)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Icon name="delete" category="actions" fallback="✕" style={{ width: '14px', height: '14px' }} /></button>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">{t('date') || 'Date'}</label><input type="date" className="form-input" value={item.date ? item.date.split('T')[0] : ''} onChange={(e) => updateTreatment(i, 'date', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">{t('medication') || 'Médicament'}</label><input type="text" className="form-input" value={item.medication || ''} onChange={(e) => updateTreatment(i, 'medication', e.target.value)} placeholder="Ex: Paracétamol 500mg" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">{t('dosage') || 'Posologie'}</label><input type="text" className="form-input" value={item.dosage || ''} onChange={(e) => updateTreatment(i, 'dosage', e.target.value)} placeholder="Ex: 1 cp 3x/jour" /></div>
                                <div className="form-group"><label className="form-label">{t('duration') || 'Durée'}</label><input type="text" className="form-input" value={item.duration || ''} onChange={(e) => updateTreatment(i, 'duration', e.target.value)} placeholder="Ex: 7 jours" /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{t('observation') || 'Observation'}</label><input type="text" className="form-input" value={item.observation || ''} onChange={(e) => updateTreatment(i, 'observation', e.target.value)} placeholder="Ex: Prendre après les repas" /></div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline" onClick={addTreatment} style={{ marginBottom: 'var(--spacing-4)', borderColor: '#065F46', color: '#065F46' }}>
                        <Icon name="add" category="actions" fallback="+" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                        {t('add_treatment') || 'Ajouter un traitement'}
                    </button>

                    <h4 style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-500)' }}>
                        <Icon name="vitals" category="actions" fallback="🩺" style={{ width: '18px', height: '18px' }} />
                        {t('vital_signs') || 'Suivi des constantes'}
                    </h4>
                    {formData.vitalSigns.map((v, i) => (
                        <div key={i} style={{ backgroundColor: '#EFF6FF', padding: '12px', borderRadius: '8px', marginBottom: '8px', position: 'relative', border: '1px solid #DBEAFE' }}>
                            <button type="button" onClick={() => removeVitalSign(i)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Icon name="delete" category="actions" fallback="✕" style={{ width: '14px', height: '14px' }} /></button>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">{t('date') || 'Date'}</label><input type="date" className="form-input" value={v.date ? v.date.split('T')[0] : ''} onChange={(e) => updateVitalSign(i, 'date', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">{t('systolic') || 'Systolique'}</label><input type="number" className="form-input" value={v.systolicPressure || ''} onChange={(e) => updateVitalSign(i, 'systolicPressure', e.target.value)} placeholder="120" /></div>
                                <div className="form-group"><label className="form-label">{t('diastolic') || 'Diastolique'}</label><input type="number" className="form-input" value={v.diastolicPressure || ''} onChange={(e) => updateVitalSign(i, 'diastolicPressure', e.target.value)} placeholder="80" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">{t('glycemia') || 'Glycémie (g/L)'}</label><input type="number" step="0.01" className="form-input" value={v.glycemia || ''} onChange={(e) => updateVitalSign(i, 'glycemia', e.target.value)} placeholder="1.05" /></div>
                                <div className="form-group"><label className="form-label">{t('heart_rate') || 'Pouls (bpm)'}</label><input type="number" className="form-input" value={v.heartRate || ''} onChange={(e) => updateVitalSign(i, 'heartRate', e.target.value)} placeholder="72" /></div>
                                <div className="form-group"><label className="form-label">{t('weight') || 'Poids (kg)'}</label><input type="number" step="0.1" className="form-input" value={v.weight || ''} onChange={(e) => updateVitalSign(i, 'weight', e.target.value)} placeholder="68.5" /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{t('temperature') || 'Température (°C)'}</label><input type="number" step="0.1" className="form-input" value={v.temperature || ''} onChange={(e) => updateVitalSign(i, 'temperature', e.target.value)} placeholder="37.2" /></div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-outline" onClick={addVitalSign} style={{ marginBottom: 'var(--spacing-4)', borderColor: '#1E40AF', color: '#1E40AF' }}>
                        <Icon name="add" category="actions" fallback="+" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                        {t('add_vitals') || 'Ajouter une mesure'}
                    </button>

                    <div className="form-group"><label className="form-label">{t('pharmacist_notes') || 'Notes du pharmacien'}</label><textarea className="form-textarea" rows="3" value={formData.pharmacistNotes} onChange={(e) => setFormData({...formData, pharmacistNotes: e.target.value})} placeholder="Observations, conseils, précautions..."></textarea></div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        <button type="submit" className="btn btn-primary">{modalMode === 'create' ? (t('create') || 'Créer') : (t('save'))}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PatientRecords;