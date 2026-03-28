/**
 * SERVICE NOTIFICATIONS - Gestion des alertes
 */

import api from './api';

export const notificationService = {
    // Récupérer toutes les alertes
    async getAlerts() {
        return await api.get('/products/alerts');
    }
};