/**
 * SERVICE D'AUDIT - Enregistrer une action dans l'historique
 */

const AuditTrail = require('../models/AuditTrail');

/**
 * ENREGISTRER UNE ACTION D'AUDIT
 * 
 * @param {Object} params
 * @param {string} params.companyId - ID entreprise
 * @param {string} params.userId - ID utilisateur
 * @param {string} params.userName - Nom utilisateur
 * @param {string} params.action - 'create', 'update', 'delete', 'archive'
 * @param {string} params.documentType - Type de document
 * @param {string} params.documentId - ID du document
 * @param {string} params.documentName - Nom du document
 * @param {string} params.description - Description lisible
 * @param {Object} params.changes - Détail des modifications (optionnel)
 */
const auditLog = async (params) => {
    try {
        await AuditTrail.create({
            companyId: params.companyId,
            userId: params.userId,
            userName: params.userName || '',
            action: params.action,
            documentType: params.documentType,
            documentId: params.documentId,
            documentName: params.documentName || '',
            description: params.description,
            changes: params.changes || null
        });
    } catch (error) {
        // Ne pas bloquer l'application si l'audit échoue
        console.error('Erreur audit:', error.message);
    }
};

module.exports = { auditLog };