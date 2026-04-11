/**
 * SERVICE DEVIS - Appels API
 */

import api from './api';

export const quoteService = {
    // Créer un devis
    async createQuote(data) {
        return await api.post('/quotes', data);
    },

    // Récupérer tous les devis
    async getQuotes(params = {}) {
        return await api.get('/quotes', { params });
    },

    // Récupérer un devis par ID
    async getQuote(id) {
        return await api.get(`/quotes/${id}`);
    },

    // Mettre à jour un devis
    async updateQuote(id, data) {
        return await api.put(`/quotes/${id}`, data);
    },

    // Supprimer un devis
    async deleteQuote(id) {
        return await api.delete(`/quotes/${id}`);
    },

    // Convertir un devis en vente
    async convertToSale(id) {
        return await api.post(`/quotes/${id}/convert`);
    }
};