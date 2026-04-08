/**
 * PAGE ARCHIVES - Consultation des historiques
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getArchives, deleteArchive } from '../../services/archiveService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';

const Archives = () => {
    const [loading, setLoading] = useState(true);
    const [archives, setArchives] = useState([]);
    const [years, setYears] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({ year: '', month: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, archiveId: null, archivePeriod: '' });

    // Correction 2: useCallback pour stabiliser fetchArchives
    const fetchArchives = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.year) params.year = filters.year;
            if (filters.month) params.month = filters.month;
            params.page = pagination.page;
            params.limit = 20;

            const response = await getArchives(params);
            setArchives(response.archives);
            setYears(response.years || []);
            setPagination(response.pagination);
        } catch (err) {
            setError('Erreur lors du chargement des archives');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters.year, filters.month, pagination.page]);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    const handleDelete = async () => {
        if (!deleteModal.archiveId) return;

        try {
            await deleteArchive(deleteModal.archiveId);
            setSuccess('Archive supprimée définitivement');
            fetchArchives();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteModal({ isOpen: false, archiveId: null, archivePeriod: '' });
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    if (loading) return <Loader />;

    return (
        <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
            }}>
                <div>
                    <h2>📋 Archives du tableau de bord</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        Consultez l'historique des réinitialisations
                    </p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Filtres */}
            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ minWidth: '150px' }}>
                            <label className="form-label">Année</label>
                            <select
                                className="form-select"
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                            >
                                <option value="">Toutes les années</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ minWidth: '150px' }}>
                            <label className="form-label">Mois</label>
                            <select
                                className="form-select"
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                                disabled={!filters.year}
                            >
                                <option value="">Tous les mois</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                    <option key={month} value={month}>
                                        {new Date(2000, month - 1, 1).toLocaleString('fr-FR', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setFilters({ year: '', month: '' })}>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des archives */}
            <div className="card">
                {archives.length === 0 ? (
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p style={{ color: 'var(--gray-500)' }}>Aucune archive trouvée</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Période</th>
                                        <th>Date d'archivage</th>
                                        <th>Type</th>
                                        <th>Ventes (période)</th>
                                        <th>Chiffre d'affaires</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archives.map(archive => (
                                        <tr key={archive._id}>
                                            <td>
                                                <strong>{archive.periodLabel}</strong>
                                            </td>
                                            <td>{formatDate(archive.archivedAt)}</td>
                                            <td>
                                                <span className="badge-info">
                                                    {archive.archiveType === 'manual_reset' ? 'Manuel' : 'Auto'}
                                                </span>
                                            </td>
                                            <td>{formatNumber(archive.snapshot.stats.monthly.count)}</td>
                                            <td>
                                                <strong>{formatNumber(archive.snapshot.stats.monthly.total)} GNF</strong>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setDeleteModal({
                                                        isOpen: true,
                                                        archiveId: archive._id,
                                                        archivePeriod: archive.periodLabel
                                                    })}
                                                    style={{ color: 'var(--danger)' }}
                                                    title="Supprimer définitivement"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)' }}>
                                <button
                                    className="btn btn-sm btn-outline"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                >
                                    ◀ Précédent
                                </button>
                                <span>Page {pagination.page} / {pagination.pages}</span>
                                <button
                                    className="btn btn-sm btn-outline"
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                >
                                    Suivant ▶
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modale de confirmation suppression */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, archiveId: null, archivePeriod: '' })}
                onConfirm={handleDelete}
                title="Supprimer définitivement"
                message={`Êtes-vous sûr de vouloir supprimer définitivement l'archive "${deleteModal.archivePeriod}" ? Cette action est irréversible.`}
                confirmText="Oui, supprimer"
                isDanger={true}
            />
        </div>
    );
};

export default Archives;