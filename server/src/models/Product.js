/**
 * MODÈLE PRODUCT - Produits médicaux (un document = un produit + un établissement)
 */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true,
        index: true 
    },
    name: { 
        type: String, 
        required: [true, 'La DCI est obligatoire'], 
        trim: true 
    },
    // NOUVEAU CHAMP : Type (Princeps ou Générique)
    type: {
        type: String,
        enum: ['Princeps', 'Générique', 'Generic'],
        default: 'Générique'
    },
category: { 
    type: String, 
        enum: [
            'Médicament', 'Medication',
            'Dispositif médical', 'Medical Device',
            'Parapharmaceutique', 'Parapharmacy',
            'Complément alimentaire', 'Food Supplement',
            'Vitamine', 'Vitamin',
            'Prestation médicale', 'Medical Service'
        ], 
        default: 'Médicament' 
},
    //  Sous-catégorie pour Prestation médicale
    subCategory: {
        type: String,
        enum: [
            'Prise de tension', 'Blood pressure',
            'Prise de poids', 'Weight',
            'Prise de taille', 'Height',
            'Prise de rythme', 'Heart rate',
            'Test de glycémie rapide', 'Blood glucose test',
            'Vaccination', 'Vaccination'
        ],
        required: false
    },
    manufacturer: { 
        type: String, 
        trim: true, 
        default: '' 
    },
    batchNumber: { 
        type: String, 
        trim: true, 
        default: '' 
    },
    barcode: { 
        type: String, 
        trim: true, 
        sparse: true, 
        default: '' 
    },
    establishmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Establishment', 
        required: false,
        index: true 
    },
    quantity: { 
        type: Number, 
        default: 0, 
        min: 0 
    },
    unit: { 
    type: String, 
        enum: [
            'Comprimés', 'Tablets',
            'Capsules', 'Capsules',
            'Plaquettes', 'Blisters',
            'Ampoules', 'Ampoules',
            'Boîtes', 'Boxes',
            'Boîte(s)', 'Box(es)',
            'Bouteille', 'Bottle'
        ], 
        default: 'Boîtes' 
    },
    reorderPoint: { 
        type: Number, 
        default: 10, 
        min: 0 
    },
    location: { 
        type: String, 
        trim: true, 
        default: '' 
    },
    purchasePrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    sellingPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    manufacturingDate: { 
        type: Date 
    },
    expirationDate: { 
        type: Date, 
        required: [true, 'La date d\'expiration est obligatoire'], 
        index: true 
    },
    prescriptionRequired: { 
        type: Boolean, 
        default: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    description: { 
        type: String, 
        trim: true, 
        default: '' 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEX ====================
ProductSchema.index({ companyId: 1, name: 'text' });
ProductSchema.index({ companyId: 1, expirationDate: 1 });
ProductSchema.index({ companyId: 1, establishmentId: 1 });
ProductSchema.index({ companyId: 1, establishmentId: 1, name: 1 });

// ==================== VIRTUELS ====================
ProductSchema.virtual('totalQuantity').get(function() {
    return this.quantity;
});

ProductSchema.virtual('stockStatus').get(function() {
    if (this.quantity === 0) return 'out_of_stock';
    if (this.quantity <= this.reorderPoint) return 'low_stock';
    return 'in_stock';
});

ProductSchema.virtual('expirationStatus').get(function() {
    if (!this.expirationDate) return 'unknown';
    const today = new Date();
    const daysLeft = Math.ceil((this.expirationDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring_soon';
    if (daysLeft <= 90) return 'warning';
    return 'good';
});

// ==================== MÉTHODES ====================
ProductSchema.methods.canBeSold = function(quantity = 1) {
    if (!this.isActive) return { can: false, reason: 'Produit désactivé' };
    if (this.quantity < quantity) return { can: false, reason: 'Stock insuffisant' };
    if (this.expirationDate && this.expirationDate < new Date()) {
        return { can: false, reason: 'Produit expiré' };
    }
    return { can: true };
};

/**
 * Vendre un produit (diminuer le stock)
 */
ProductSchema.methods.sell = async function(quantity, userId, saleId) {
    if (this.quantity < quantity) {
        throw new Error('Stock insuffisant');
    }
    
    const previousQuantity = this.quantity;
    this.quantity -= quantity;
    
    const StockMovement = mongoose.model('StockMovement');
    
    const stockMovementData = {
        companyId: this.companyId,
        productId: this._id,
        type: 'out',
        quantity: quantity,
        previousQuantity: previousQuantity,
        newQuantity: this.quantity,
        reference: saleId,
        userId: userId
    };
    
    if (this.establishmentId) {
        stockMovementData.establishmentId = this.establishmentId;
    }
    
    await StockMovement.create(stockMovementData);
    
    await this.save();
    return this;
};

/**
 * Augmenter le stock
 */
ProductSchema.methods.increaseStock = async function(quantity, userId, reference) {
    const previousQuantity = this.quantity;
    this.quantity += quantity;
    
    const StockMovement = mongoose.model('StockMovement');
    
    const stockMovementData = {
        companyId: this.companyId,
        productId: this._id,
        type: 'in',
        quantity: quantity,
        previousQuantity: previousQuantity,
        newQuantity: this.quantity,
        reference: reference,
        userId: userId
    };
    
    if (this.establishmentId) {
        stockMovementData.establishmentId = this.establishmentId;
    }
    
    await StockMovement.create(stockMovementData);
    
    await this.save();
    return this;
};

module.exports = mongoose.model('Product', ProductSchema);