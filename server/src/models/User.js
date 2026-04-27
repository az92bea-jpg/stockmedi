const mongoose = require('mongoose');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        default: '' 
    },
    role: { 
        type: String, 
        enum: ['super-admin', 'owner', 'employee'], 
        default: 'employee' 
    },
    discipline: {
        type: String,
        enum: [
            'pharmacien', 'pharmacist',
            'médecin', 'doctor',
            'infirmier', 'nurse',
            'assistant', 'assistant',
            'comptable', 'accountant',
            'gestionnaire', 'manager',
            'caissier', 'cashier',
            'autre', 'other'
        ],
        default: 'autre'
    },
    permissions: { 
        type: [String], 
        enum: [
            'view_dashboard',
            'make_sales',
            'view_sales',
            'cancel_sales',
            'manage_products',
            'view_products',
            'manage_stock',
            'view_reports',
            'manage_employees',
            'manage_establishments',
            'manage_patients',
            'manage_settings'
        ],
        default: [] 
    },
    // Établissements auxquels l'employé a accès (plan Enterprise uniquement)
    establishments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Establishment'
    }],
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        default: null 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastLogin: { 
        type: Date, 
        default: null 
    },
    // CHAMPS RGPD (DOIVENT ÊTRE DANS LE SCHEMA)
    deletionRequestedAt: {
        type: Date,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// ==================== MÉTHODES ====================

/**
 * Comparer le mot de passe fourni avec le hash stocké
 */
UserSchema.methods.matchPassword = function(enteredPassword) {
    return hashPassword(enteredPassword) === this.password;
};

/**
 * Vérifier si l'utilisateur a une permission spécifique
 */
UserSchema.methods.hasPermission = function(permission) {
    if (this.role === 'owner' || this.role === 'super-admin') {
        return true;
    }
    return this.permissions && this.permissions.includes(permission);
};

/**
 * Vérifier si l'utilisateur a accès à un établissement
 */
UserSchema.methods.hasAccessToEstablishment = function(establishmentId) {
    // Owner et super-admin ont accès à tout
    if (this.role === 'owner' || this.role === 'super-admin') {
        return true;
    }
    
    // Si l'employé n'a pas de restriction, accès à tout
    if (!this.establishments || this.establishments.length === 0) {
        return true;
    }
    
    // Vérifier si l'établissement est dans la liste
    return this.establishments.some(id => id.toString() === establishmentId.toString());
};

/**
 * Récupérer les IDs des établissements accessibles
 * @returns {Array|null} - null = tous les établissements, [] = aucun, [id1, id2] = liste
 */
UserSchema.methods.getAccessibleEstablishmentIds = function() {
    // Owner et super-admin : tous les établissements
    if (this.role === 'owner' || this.role === 'super-admin') {
        return null; // null signifie "tous"
    }
    
    // Employé avec restrictions : retourner la liste
    if (this.establishments && this.establishments.length > 0) {
        return this.establishments;
    }
    
    // Employé sans restriction : tous les établissements
    return null;
};

/**
 * Vérifier si l'utilisateur est admin (owner ou super-admin)
 */
UserSchema.methods.isAdmin = function() {
    return this.role === 'owner' || this.role === 'super-admin';
};

/*// Middleware pour mettre à jour lastActivity
UserSchema.pre('save', function(next) {
    this.lastActivity = new Date();
    next();
});*/

module.exports = mongoose.model('User', UserSchema);