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
            'manage_settings'
        ],
        default: [] 
    },
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
    }
}, { 
    timestamps: true 
});

// Méthode pour comparer les mots de passe
UserSchema.methods.matchPassword = function(enteredPassword) {
    return hashPassword(enteredPassword) === this.password;
};

module.exports = mongoose.model('User', UserSchema);