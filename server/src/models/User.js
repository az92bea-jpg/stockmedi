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
    deletionRequestedAt: {
        type: Date,
        default: null
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    // DOUBLE AUTHENTIFICATION (2FA)
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorCode: {
        type: String,
        default: null
    },
    twoFactorCodeExpires: {
        type: Date,
        default: null
    },
    twoFactorVerifiedDevices: [{
        deviceId: String,
        verifiedAt: Date,
        expiresAt: Date
    }]
}, { 
    timestamps: true 
});

// ==================== MÉTHODES ====================

UserSchema.methods.matchPassword = function(enteredPassword) {
    return hashPassword(enteredPassword) === this.password;
};

UserSchema.methods.hasPermission = function(permission) {
    if (this.role === 'owner' || this.role === 'super-admin') {
        return true;
    }
    return this.permissions && this.permissions.includes(permission);
};

UserSchema.methods.hasAccessToEstablishment = function(establishmentId) {
    if (this.role === 'owner' || this.role === 'super-admin') {
        return true;
    }
    if (!this.establishments || this.establishments.length === 0) {
        return true;
    }
    return this.establishments.some(id => id.toString() === establishmentId.toString());
};

UserSchema.methods.getAccessibleEstablishmentIds = function() {
    if (this.role === 'owner' || this.role === 'super-admin') {
        return null;
    }
    if (this.establishments && this.establishments.length > 0) {
        return this.establishments;
    }
    return null;
};

UserSchema.methods.isAdmin = function() {
    return this.role === 'owner' || this.role === 'super-admin';
};


module.exports = mongoose.model('User', UserSchema);