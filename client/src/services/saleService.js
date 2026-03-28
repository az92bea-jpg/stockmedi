/**
 * SERVICE VENTES - Gestion des ventes
 */

import api from './api';

export const saleService = {
    // Créer une vente
    async createSale(data) {
        return await api.post('/sales', data);
    },

    // Récupérer toutes les ventes
    async getSales(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return await api.get(`/sales${queryParams ? `?${queryParams}` : ''}`);
    },

    // Récupérer une vente par ID
    async getSale(id) {
        return await api.get(`/sales/${id}`);
    },

    // Annuler une vente
    async cancelSale(id, reason) {
        return await api.put(`/sales/${id}/cancel`, { reason });
    },

    // Récupérer les statistiques
    async getStats() {
        return await api.get('/sales/stats');
    }
};