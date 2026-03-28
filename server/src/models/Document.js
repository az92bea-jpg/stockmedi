/**
 * MODÈLE DOCUMENT - Gestion des documents scannés
 */

const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        
        // Type de document
        type: {
            type: String,
            enum: ['prescription', 'invoice', 'delivery_note', 'certificate', 'other'],
            required: true
        },
        
        // Référence associée
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            description: 'ID du document associé (sale, invoice, etc.)'
        },
        
        referenceModel: {
            type: String,
            enum: ['Sale', 'Invoice', 'Supplier', 'Other']
        },
        
        // Fichier
        filename: {
            type: String,
            required: true
        },
        
        originalName: String,
        mimeType: String,
        fileSize: Number,
        filePath: String,
        
        // Métadonnées du scan
        scannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        scannedAt: {
            type: Date,
            default: Date.now
        },
        
        // Statut
        isVerified: {
            type: Boolean,
            default: false
        },
        
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        
        verifiedAt: Date,
        
        notes: String
    },
    {
        timestamps: true
    }
);

// Index pour la recherche
DocumentSchema.index({ companyId: 1, type: 1 });
DocumentSchema.index({ companyId: 1, createdAt: -1 });
DocumentSchema.index({ referenceId: 1 });

module.exports = mongoose.model('Document', DocumentSchema);