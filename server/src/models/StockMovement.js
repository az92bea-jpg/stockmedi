/**
 * MODÈLE STOCK MOVEMENT - Historique des mouvements de stock
 */

const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    establishmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Establishment',
        required: false  // ⭐ CHANGÉ : optionnel pour les comptes sans établissement
    },
    fromEstablishmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Establishment'
    },
    toEstablishmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Establishment'
    },
    type: {
        type: String,
        enum: ['in', 'out', 'transfer', 'adjustment'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    previousQuantity: {
        type: Number,
        required: true
    },
    newQuantity: {
        type: Number,
        required: true
    },
    reference: {
        type: String
    },
    reason: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

StockMovementSchema.index({ companyId: 1, createdAt: -1 });
StockMovementSchema.index({ productId: 1, establishmentId: 1 });

module.exports = mongoose.model('StockMovement', StockMovementSchema);