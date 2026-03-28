/**
 * MODÈLE BACKUP - Sauvegardes automatiques
 */

const mongoose = require('mongoose');

const BackupSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            index: true
        },
        
        // Type de backup
        type: {
            type: String,
            enum: ['full', 'partial'],
            required: true
        },
        
        // Fichier
        filename: {
            type: String,
            required: true
        },
        
        fileSize: Number,
        filePath: String,
        
        // Contenu (pour restoration)
        data: {
            type: mongoose.Schema.Types.Mixed,
            select: false
        },
        
        // Statut
        status: {
            type: String,
            enum: ['success', 'failed', 'in_progress'],
            default: 'in_progress'
        },
        
        // Métadonnées
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        
        errorMessage: String,
        
        notes: String
    },
    {
        timestamps: true
    }
);

// Index
BackupSchema.index({ companyId: 1, createdAt: -1 });
BackupSchema.index({ status: 1 });

module.exports = mongoose.model('Backup', BackupSchema);