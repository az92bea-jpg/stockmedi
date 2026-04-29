/**
 * MIDDLEWARE DE LOGGING DE SÉCURITÉ
 * 
 * Enregistre automatiquement les actions importantes
 * dans la collection SecurityLog
 */

const SecurityLog = require('../models/SecurityLog');

/**
 * Enregistrer une action de sécurité
 * @param {Object} params
 * @param {string} params.companyId - ID de l'entreprise
 * @param {string} params.userId - ID de l'utilisateur
 * @param {string} params.userEmail - Email de l'utilisateur
 * @param {string} params.action - Type d'action (voir enum dans SecurityLog)
 * @param {string} params.description - Description de l'action
 * @param {string} params.ipAddress - Adresse IP
 * @param {string} params.userAgent - Navigateur
 * @param {string} params.status - 'success' ou 'failed'
 */
const logSecurityEvent = async (params) => {
    try {
        await SecurityLog.create({
            companyId: params.companyId,
            userId: params.userId,
            userEmail: params.userEmail || '',
            action: params.action,
            description: params.description || '',
            ipAddress: params.ipAddress || '',
            userAgent: params.userAgent || '',
            status: params.status || 'success'
        });
    } catch (error) {
        // Ne pas bloquer l'application si le log échoue
        console.error('Erreur logging sécurité:', error.message);
    }
};

module.exports = { logSecurityEvent };