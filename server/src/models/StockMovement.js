/**
 * MODÈLE STOCKMOVEMENT - Traçabilité des mouvements de stock
 */

const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['in', 'out', 'return', 'adjustment', 'expiration_loss'],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
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
            type: String,
            trim: true
        },
        reason: {
            type: String,
            trim: true
        },
        unitPrice: {
            type: Number,
            min: 0
        },
        totalValue: {
            type: Number,
            min: 0
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// PAS DE MIDDLEWARE pre('save') - calcul simple dans le contrôleur

StockMovementSchema.index({ companyId: 1, productId: 1 });
StockMovementSchema.index({ companyId: 1, createdAt: -1 });
StockMovementSchema.index({ reference: 1 });

module.exports = mongoose.model('StockMovement', StockMovementSchema);