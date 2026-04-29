/**
 * MODÈLE AUDIT TRAIL - Traçabilité de toutes les actions métier
 * 
 * ENREGISTRE CHAQUE MODIFICATION :
 * - Qui a fait l'action
 * - Quelle action (création, modification, suppression)
 * - Sur quel document (produit, vente, employé, etc.)
 * - L'ancienne valeur et la nouvelle valeur
 * - La date exacte
 * 
 * UTILITÉ :
 * - Savoir qui a modifié le prix d'un produit
 * - Savoir qui a supprimé une vente
 * - En cas d'erreur, pouvoir retrouver l'historique
 */

const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema({
    // Entreprise concernée
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    
    // Utilisateur qui a fait l'action
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Nom de l'utilisateur (pratique pour l'affichage)
    userName: {
        type: String,
        default: ''
    },
    
    // Type d'action
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'archive', 'restore']
    },
    
    // Type de document concerné
    documentType: {
        type: String,
        required: true,
        enum: [
            'product',      // Produit
            'sale',         // Vente
            'quote',        // Devis
            'employee',     // Employé
            'patient',      // Dossier patient
            'establishment',// Établissement
            'settings',     // Paramètres
            'subscription'  // Abonnement
        ]
    },
    
    // ID du document concerné
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    
    // Nom ou référence du document (pour affichage)
    documentName: {
        type: String,
        default: ''
    },
    
    // Description lisible de l'action
    description: {
        type: String,
        required: true
    },
    
    // Détails des modifications (avant/après)
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Date de l'action
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour les recherches rapides
AuditTrailSchema.index({ companyId: 1, createdAt: -1 });
AuditTrailSchema.index({ userId: 1, createdAt: -1 });
AuditTrailSchema.index({ documentType: 1, documentId: 1 });

module.exports = mongoose.model('AuditTrail', AuditTrailSchema);