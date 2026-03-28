/**
 * SERVICE AUTHENTIFICATION - StockMedi
 */

import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authService = {
    // Connexion
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.success && response.token) {
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
        return response;
    },

    // Inscription (propriétaire)
    async register(data) {
        return await api.post('/auth/register', data);
    },

    // Déconnexion
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
    },

    // Récupérer l'utilisateur connecté
    getCurrentUser() {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    },

    // Vérifier si connecté
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    // Récupérer le token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
};