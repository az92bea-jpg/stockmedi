/**
 * MODÈLE SUPPLIER - Gestion des fournisseurs
 * 
 * Enregistre tous les fournisseurs de produits médicaux
 */

const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        
        // Informations générales
        name: {
            type: String,
            required: [true, 'Le nom du fournisseur est obligatoire'],
            trim: true
        },
        
        registrationNumber: {
            type: String,
            trim: true
        },
        
        // Contact
        contactPerson: {
            name: String,
            phone: String,
            email: String,
            position: String
        },
        
        phone: {
            type: String,
            required: true,
            trim: true
        },
        
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        
        address: {
            street: String,
            city: String,
            country: String,
            postalCode: String
        },
        
        // Informations bancaires
        bankDetails: {
            bankName: String,
            accountName: String,
            accountNumber: String,
            iban: String,
            swift: String
        },
        
        // Statistiques
        stats: {
            totalPurchases: { type: Number, default: 0 },
            totalSpent: { type: Number, default: 0 },
            lastOrderDate: Date
        },
        
        // Évaluation
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        
        notes: {
            type: String,
            trim: true
        },
        
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Index
SupplierSchema.index({ companyId: 1, name: 1 });
SupplierSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);