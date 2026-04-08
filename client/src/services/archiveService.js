/**
 * SERVICE ARCHIVE - Gestion des appels API pour les archives
 */

import api from './api';

/**
 * Archiver et réinitialiser le tableau de bord
 */
export const resetAndArchiveDashboard = async () => {
    const response = await api.post('/archive/reset-dashboard');
    return response;
};

/**
 * Récupérer la liste des archives (avec filtres)
 * @param {Object} params - { year, month, page, limit }
 */
export const getArchives = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/archive/list${queryParams ? `?${queryParams}` : ''}`);
    return response;
};

/**
 * Récupérer une archive spécifique
 * @param {string} id - ID de l'archive
 */
export const getArchive = async (id) => {
    const response = await api.get(`/archive/${id}`);
    return response;
};

/**
 * Supprimer définitivement une archive
 * @param {string} id - ID de l'archive
 */
export const deleteArchive = async (id) => {
    const response = await api.delete(`/archive/${id}`);
    return response;
};