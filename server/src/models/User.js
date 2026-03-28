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
    // ========== NOUVEAU CHAMP DISCIPLINE ==========
    discipline: {
        type: String,
        enum: ['pharmacien', 'médecin', 'infirmier', 'assistant', 'comptable', 'autre'],
        default: 'autre'
    },
    permissions: { 
        type: [String], 
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