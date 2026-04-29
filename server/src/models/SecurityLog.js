/**
 * MODÈLE LOGS DE SÉCURITÉ
 * 
 * QU'EST-CE QUI EST ENREGISTRÉ ?
 * - Chaque connexion (réussie ou échouée)
 * - Chaque changement de mot de passe
 * - Chaque activation/désactivation de 2FA
 * - Chaque suppression de compte
 * - Chaque action sensible
 * 
 * POURQUOI ?
 * - En cas de piratage, on sait exactement ce qui s'est passé
 * - On peut détecter des comportements suspects
 * - Obligation légale dans certains pays (RGPD)
 */

const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
    // Entreprise concernée
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    
    // Utilisateur qui a effectué l'action
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Email de l'utilisateur (pratique pour les recherches)
    userEmail: {
        type: String,
        default: ''
    },
    
    // Type d'action
    action: {
        type: String,
        required: true,
        enum: [
            'login_success',      // Connexion réussie
            'login_failed',       // Connexion échouée
            'password_changed',   // Mot de passe modifié
            '2fa_enabled',        // 2FA activé
            '2fa_disabled',       // 2FA désactivé
            '2fa_code_sent',      // Code 2FA envoyé
            '2fa_code_verified',  // Code 2FA vérifié
            'account_deleted',    // Compte supprimé
            'account_created',    // Compte créé
            'employee_added',     // Employé ajouté
            'employee_removed',   // Employé supprimé
            'subscription_changed' // Abonnement modifié
        ]
    },
    
    // Description lisible de l'action
    description: {
        type: String,
        default: ''
    },
    
    // Adresse IP de l'utilisateur
    ipAddress: {
        type: String,
        default: ''
    },
    
    // Navigateur utilisé
    userAgent: {
        type: String,
        default: ''
    },
    
    // Succès ou échec de l'action
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    
    // Date de l'action
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour les recherches rapides
SecurityLogSchema.index({ companyId: 1, createdAt: -1 });
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1 });

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);