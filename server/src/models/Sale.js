/**
 * MODÈLE SALE - Gestion des ventes
 * ⭐ Suppression automatique après 30 jours
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
        establishmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Establishment',
            required: false,
            default: null,
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
        cancellationReason: String,
        archived: {
            type: Boolean,
            default: false,
            index: true
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            index: { expires: 0 }
        }
    },
    {
        timestamps: true
    }
);

// ==================== INDEX ====================
SaleSchema.index({ companyId: 1, saleNumber: 1 });
SaleSchema.index({ companyId: 1, createdAt: -1 });
SaleSchema.index({ companyId: 1, paymentStatus: 1 });
SaleSchema.index({ companyId: 1, customerPhone: 1 });
SaleSchema.index({ companyId: 1, archived: 1, createdAt: -1 });
SaleSchema.index({ companyId: 1, establishmentId: 1 });

// ==================== MÉTHODES ====================

/**
 * Annuler une vente et restaurer le stock
 */
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
        if (!product) continue;
        
        if (this.establishmentId) {
            if (typeof product.getQuantityByEstablishment === 'function' && 
                typeof product.updateStockByEstablishment === 'function') {
                const currentStock = product.getQuantityByEstablishment(this.establishmentId);
                const newStock = currentStock + item.quantity;
                await product.updateStockByEstablishment(
                    this.establishmentId, 
                    newStock, 
                    userId, 
                    `annulation_vente_${this._id}`
                );
            } else {
                product.quantity += item.quantity;
                await product.save();
            }
        } else {
            product.quantity += item.quantity;
            await product.save();
        }
        
        const StockMovement = mongoose.model('StockMovement');
        const movementData = {
            companyId: this.companyId,
            productId: product._id,
            type: 'in',
            quantity: item.quantity,
            previousQuantity: product.quantity - item.quantity,
            newQuantity: product.quantity,
            reason: `Annulation vente #${this.saleNumber || this._id}`,
            userId: userId
        };
        
        if (this.establishmentId) {
            movementData.establishmentId = this.establishmentId;
        }
        
        await StockMovement.create(movementData);
    }
    
    await this.save();
    return this;
};

/**
 * Générer un numéro de vente unique
 */
SaleSchema.statics.generateSaleNumber = async function(companyId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `SALE-${year}${month}${day}`;
    
    const lastSale = await this.findOne({
        companyId: companyId,
        saleNumber: new RegExp(`^${prefix}`)
    }).sort({ saleNumber: -1 });
    
    let sequence = 1;
    if (lastSale && lastSale.saleNumber) {
        const parts = lastSale.saleNumber.split('-');
        if (parts.length >= 3) {
            sequence = parseInt(parts[2]) + 1;
        }
    }
    
    return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

module.exports = mongoose.model('Sale', SaleSchema);