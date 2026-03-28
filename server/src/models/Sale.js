/**
 * MODÈLE SALE - Gestion des ventes
 */

const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        saleNumber: {
            type: String,
            unique: true,
            sparse: true
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
                batchNumber: String,
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
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'mobile_money', 'insurance', 'mixed'],
            default: 'cash'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'refunded', 'cancelled'],
            default: 'paid'
        },
        customerName: {
            type: String,
            trim: true
        },
        customerPhone: {
            type: String,
            trim: true
        },
        prescriptionNumber: {
            type: String,
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        },
        receiptGenerated: {
            type: Boolean,
            default: false
        },
        isCancelled: {
            type: Boolean,
            default: false
        },
        cancelledAt: Date,
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cancellationReason: String
    },
    {
        timestamps: true
    }
);

// PAS DE MIDDLEWARE pre('save') !

// ==================== INDEX ====================
SaleSchema.index({ companyId: 1, saleNumber: 1 });
SaleSchema.index({ companyId: 1, createdAt: -1 });
SaleSchema.index({ companyId: 1, paymentStatus: 1 });
SaleSchema.index({ companyId: 1, customerPhone: 1 });

// ==================== MÉTHODES ====================
SaleSchema.methods.cancel = async function(userId, reason) {
    if (this.isCancelled) {
        throw new Error('Cette vente est déjà annulée');
    }
    
    this.isCancelled = true;
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
    this.cancellationReason = reason;
    this.paymentStatus = 'cancelled';
    
    const Product = mongoose.model('Product');
    
    for (const item of this.items) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.quantity += item.quantity;
            await product.save();
        }
    }
    
    await this.save();
    return this;
};

module.exports = mongoose.model('Sale', SaleSchema);