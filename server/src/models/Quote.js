/**
 * MODÈLE QUOTE - Devis / Proforma
 * Indépendant du module Vente
 */

const mongoose = require('mongoose');

const THIRTY_DAYS = 30 * 24 * 60 * 60; // 30 jours en secondes

const QuoteSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        establishmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Establishment',
            required: false,
            default: null,
            index: true
        },
        quoteNumber: {
            type: String,
            unique: true,
            required: true
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: 0
                },
                subtotal: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'fixed'
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
        customerName: {
            type: String,
            trim: true,
            default: ''
        },
        customerPhone: {
            type: String,
            trim: true,
            default: ''
        },
        prescriptionNumber: {
            type: String,
            trim: true,
            default: ''
        },
        notes: {
            type: String,
            trim: true,
            default: ''
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['draft', 'sent', 'converted', 'expired', 'cancelled'],
            default: 'draft'
        },
        validUntil: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        },
        convertedToSaleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale',
            default: null
        },
        convertedAt: {
            type: Date,
            default: null
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

// ==================== INDEX ====================
QuoteSchema.index({ companyId: 1, quoteNumber: 1 });
QuoteSchema.index({ companyId: 1, createdAt: -1 });
QuoteSchema.index({ companyId: 1, status: 1 });
QuoteSchema.index({ companyId: 1, customerPhone: 1 });
QuoteSchema.index({ companyId: 1, establishmentId: 1 });

// ⭐ Suppression automatique après 30 jours (SAUF devis convertis)
QuoteSchema.index(
    { createdAt: 1 },
    { 
        expireAfterSeconds: THIRTY_DAYS,
        partialFilterExpression: { status: { $ne: 'converted' } }
    }
);

// ==================== VIRTUELS ====================
QuoteSchema.virtual('isExpired').get(function() {
    return this.validUntil < new Date();
});

QuoteSchema.virtual('canBeConverted').get(function() {
    // Convertible si : brouillon OU envoyé, ET pas déjà converti, ET pas expiré
    const isValidStatus = this.status === 'sent' || this.status === 'draft';
    const isNotExpired = this.validUntil >= new Date();
    return isValidStatus && !this.convertedToSaleId && isNotExpired;
});

// ==================== MÉTHODES ====================

/**
 * Générer un numéro de devis unique
 */
QuoteSchema.statics.generateQuoteNumber = async function(companyId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `DEV-${year}${month}${day}`;
    
    const count = await this.countDocuments({
        companyId: companyId,
        quoteNumber: new RegExp(`^${prefix}`)
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}-${sequence}`;
};

/**
 * Convertir un devis en vente
 */
QuoteSchema.methods.convertToSale = async function(userId) {
    if (!this.canBeConverted) {
        throw new Error('Ce devis ne peut pas être converti en vente (expiré ou déjà converti)');
    }
    
    const Sale = mongoose.model('Sale');
    const Product = mongoose.model('Product');
    
    // Vérifier les stocks
    for (const item of this.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error(`Produit "${item.name}" non trouvé`);
        }
        
        const canSell = product.canBeSold(item.quantity);
        if (!canSell.can) {
            throw new Error(`Impossible de vendre "${item.name}": ${canSell.reason}`);
        }
    }
    
    // Mettre à jour les stocks
    for (const item of this.items) {
        const product = await Product.findById(item.productId);
        await product.sell(item.quantity, userId, null);
    }
    
    // Créer la vente
    const saleNumber = await Sale.generateSaleNumber(this.companyId);
    const sale = await Sale.create({
        companyId: this.companyId,
        establishmentId: this.establishmentId,
        items: this.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
        })),
        saleNumber,
        subtotal: this.subtotal,
        discount: this.discount,
        discountType: this.discountType,
        tax: 0,
        total: this.total,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        customerName: this.customerName,
        customerPhone: this.customerPhone,
        prescriptionNumber: this.prescriptionNumber,
        notes: this.notes,
        userId: userId
    });
    
    // Mettre à jour le devis
    this.status = 'converted';
    this.convertedToSaleId = sale._id;
    this.convertedAt = new Date();
    await this.save();
    
    return sale;
};

module.exports = mongoose.model('Quote', QuoteSchema);