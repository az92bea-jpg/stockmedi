/**
 * SERVICE ÉTABLISSEMENTS - Gestion multi-sites
 */

import api from './api';

/**
 * Récupérer tous les établissements de l'entreprise
 */
export const getEstablishments = async () => {
    const response = await api.get('/establishments');
    return response;
};

/**
 * Créer un établissement
 * @param {Object} data - { name, type, address, phone, email, managerId }
 */
export const createEstablishment = async (data) => {
    const response = await api.post('/establishments', data);
    return response;
};

/**
 * Mettre à jour un établissement
 * @param {string} id - ID de l'établissement
 * @param {Object} data - Champs à mettre à jour
 */
export const updateEstablishment = async (id, data) => {
    const response = await api.put(`/establishments/${id}`, data);
    return response;
};

/**
 * Supprimer un établissement
 * @param {string} id - ID de l'établissement
 */
export const deleteEstablishment = async (id) => {
    const response = await api.delete(`/establishments/${id}`);
    return response;
};

/**
 * Transférer du stock entre établissements
 * @param {Object} data - { productId, fromEstablishmentId, toEstablishmentId, quantity, reason }
 */
export const transferStock = async (data) => {
    const response = await api.post('/establishments/transfer', data);
    return response;
};

/**
 * Migrer les produits sans établissement vers un établissement
 * @param {string} id - ID de l'établissement
 */
export const migrateProductsToEstablishment = async (id) => {
    const response = await api.post(`/establishments/${id}/migrate-products`);
    return response;
};