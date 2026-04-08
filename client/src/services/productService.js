/**
 * SERVICE PRODUITS - Gestion des produits
 */

import api from './api';

export const productService = {
    // Récupérer tous les produits
    async getProducts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return await api.get(`/products${queryParams ? `?${queryParams}` : ''}`);
    },

    // Récupérer un produit par ID
    async getProduct(id) {
        return await api.get(`/products/${id}`);
    },

    // Créer un produit
    async createProduct(data) {
        console.log('📡 API createProduct appelée avec:', data);
        const response = await api.post('/products', data);
        console.log('✅ Réponse API:', response);
        return response;
    },

    // Mettre à jour un produit
    async updateProduct(id, data) {
        return await api.put(`/products/${id}`, data);
    },

    // Supprimer un produit (archivage)
    async deleteProduct(id) {
        return await api.delete(`/products/${id}`);
    },

    // Récupérer les alertes
    async getAlerts() {
        return await api.get('/products/alerts');
    }
};