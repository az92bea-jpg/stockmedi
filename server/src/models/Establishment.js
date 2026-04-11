/**
 * MODÈLE ESTABLISHMENT - Établissements (pharmacies, cliniques)
 * Plan Enterprise uniquement
 */

const mongoose = require('mongoose');

const EstablishmentSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Le nom de l\'établissement est obligatoire'],
        trim: true
    },
    type: {
        type: String,
        enum: [
            'pharmacie', 'pharmacy',
            'clinique', 'clinic',
            'hopital', 'hospital',
            'depot', 'warehouse',
            'laboratoire', 'lab'
        ],
        default: 'pharmacie'
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'GN' }
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        lowercase: true,
        default: ''
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Statistiques propres à l'établissement
    stats: {
        totalSales: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        totalProducts: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Index
EstablishmentSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Establishment', EstablishmentSchema);