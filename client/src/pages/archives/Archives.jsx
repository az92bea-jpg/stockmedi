/**
 * PAGE ARCHIVES - Consultation des historiques
 * ⭐ Support multi-devises dynamique
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getArchives, deleteArchive } from '../../services/archiveService';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const Archives = () => {
    const { t } = useLanguage();
    const [currency, setCurrency] = useState('GNF');
    const [loading, setLoading] = useState(true);
    const [archives, setArchives] = useState([]);
    const [years, setYears] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({ year: '', month: '' });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, archiveId: null, archivePeriod: '' });

    // Charger la devise configurée
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
            setError(t('error_loading_archives'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters.year, filters.month, pagination.page, t]);

    useEffect(() => {
        loadCompanySettings();
        fetchArchives();
    }, [loadCompanySettings, fetchArchives]);

    const handleDelete = async () => {
        if (!deleteModal.archiveId) return;

        try {
            await deleteArchive(deleteModal.archiveId);
            setSuccess(t('archive_deleted_success'));
            fetchArchives();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('error_deleting_archive'));
        } finally {
            setDeleteModal({ isOpen: false, archiveId: null, archivePeriod: '' });
        }
    };

    const formatDate = (date) => {
        const locale = t('locale') === 'fr' ? 'fr-FR' : 'en-GB';
        return new Date(date).toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const getMonthName = (month) => {
        const locale = t('locale') === 'fr' ? 'fr-FR' : 'en-GB';
        return new Date(2000, month - 1, 1).toLocaleString(locale, { month: 'long' });
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
                    <h2>📋 {t('dashboard_archives')}</h2>
                    <p style={{ color: 'var(--gray-500)' }}>
                        {t('archives_subtitle')}
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
                            <label className="form-label">{t('year')}</label>
                            <select
                                className="form-select"
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                            >
                                <option value="">{t('all_years')}</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ minWidth: '150px' }}>
                            <label className="form-label">{t('month')}</label>
                            <select
                                className="form-select"
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                                disabled={!filters.year}
                            >
                                <option value="">{t('all_months')}</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                    <option key={month} value={month}>{getMonthName(month)}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setFilters({ year: '', month: '' })}>
                            {t('reset')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des archives */}
            <div className="card">
                {archives.length === 0 ? (
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                        <p style={{ color: 'var(--gray-500)' }}>{t('no_archives_found')}</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('period')}</th>
                                        <th>{t('archive_date')}</th>
                                        <th>{t('type')}</th>
                                        <th>{t('sales_period')}</th>
                                        <th>{t('revenue')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archives.map(archive => (
                                        <tr key={archive._id}>
                                            <td><strong>{archive.periodLabel}</strong></td>
                                            <td>{formatDate(archive.archivedAt)}</td>
                                            <td>
                                                <span className="badge-info">
                                                    {archive.archiveType === 'manual_reset' ? t('manual') : t('auto')}
                                                </span>
                                            </td>
                                            <td>{formatNumber(archive.snapshot.stats.monthly.count)}</td>
                                            <td>
                                                <strong>{formatNumber(archive.snapshot.stats.monthly.total)} {currency}</strong>
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
                                                    title={t('delete_permanently')}
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
                                    ◀ {t('previous')}
                                </button>
                                <span>{t('page')} {pagination.page} / {pagination.pages}</span>
                                <button
                                    className="btn btn-sm btn-outline"
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                >
                                    {t('next')} ▶
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
                title={t('delete_permanently')}
                message={`${t('confirm_delete_archive')} "${deleteModal.archivePeriod}" ? ${t('action_irreversible')}`}
                confirmText={t('yes_delete')}
                isDanger={true}
            />
        </div>
    );
};

export default Archives;