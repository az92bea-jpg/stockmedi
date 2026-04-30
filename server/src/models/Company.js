/**
 * MODÈLE COMPANY - Entreprises
 * Enums bilingues FR + EN
 */

const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        // Bloque les noms de compagnies identiques 
        // unique: true 
    },
    type: { 
        type: String, 
        enum: [
            'pharmacy', 'pharmacie',
            'clinique', 'clinic',
            'hopital', 'hospital',
            'laboratoire', 'lab',
            'autre', 'other'
        ], 
        default: 'pharmacy' 
    },
    logo: { 
        type: String, 
        default: '' 
    },
    address: { 
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'Guinée' }
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
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    subscription: {
        plan: { 
            type: String, 
            enum: ['trial', 'basic', 'premium', 'enterprise'], 
            default: 'trial' 
        },
        startDate: { 
            type: Date, 
            default: Date.now 
        },
        endDate: { 
            type: Date, 
            required: true 
        },
        status: { 
            type: String, 
            enum: ['active', 'expired', 'suspended', 'trial', 'cancelled'], 
            default: 'trial' 
        },
        autoRenew: { 
            type: Boolean, 
            default: false 
        }
    },
    settings: {
        currency: { 
            type: String, 
            enum: ['GNF', 'XOF', 'USD', 'EUR'], 
            default: 'GNF' 
        },
        language: { 
            type: String, 
            enum: ['fr', 'en'], 
            default: 'fr' 
        },
        taxRate: { 
            type: Number, 
            default: 18, 
            min: 0, 
            max: 100 
        },
        invoicePrefix: { 
            type: String, 
            default: 'INV' 
        },
        expirationAlertDays: { 
            type: Number, 
            default: 30 
        },
        batchTracking: { 
            type: Boolean, 
            default: true 
        },
        prescriptionRequired: { 
            type: Boolean, 
            default: true 
        }
    },
    stats: {
        totalProducts: { 
            type: Number, 
            default: 0 
        },
        totalEmployees: { 
            type: Number, 
            default: 0 
        },
        totalSalesThisMonth: { 
            type: Number, 
            default: 0 
        },
        totalRevenueThisMonth: { 
            type: Number, 
            default: 0 
        }
    },
        isActive: { 
        type: Boolean, 
        default: true 
    },
    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorDuration: { type: Number, default: 60 }
}, { 
    timestamps: true 
});

// ==================== MÉTHODES ====================

/**
 * Vérifier si l'abonnement est actif
 */
CompanySchema.methods.isSubscriptionActive = function() {
    if (this.subscription.status !== 'active' && this.subscription.status !== 'trial') return false;
    if (this.subscription.endDate < new Date()) return false;
    return true;
};

/**
 * Vérifier si on peut ajouter un employé selon la formule
 */
CompanySchema.methods.canAddEmployee = function() {
    const limits = {
        trial: 3,
        basic: 10,
        premium: 30,
        enterprise: 999
    };
    
    const limit = limits[this.subscription.plan] || 3;
    return this.stats.totalEmployees < limit;
};

/**
 * Mettre à jour les statistiques de l'entreprise
 */
CompanySchema.methods.updateStats = async function() {
    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    const Sale = mongoose.model('Sale');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalEmployees = await User.countDocuments({
        companyId: this._id,
        role: 'employee',
        isActive: true
    });
    
    const totalProducts = await Product.countDocuments({
        companyId: this._id,
        isActive: true
    });
    
    const sales = await Sale.aggregate([
        { $match: { companyId: this._id, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    
    this.stats = {
        totalEmployees,
        totalProducts,
        totalSalesThisMonth: sales[0]?.count || 0,
        totalRevenueThisMonth: sales[0]?.total || 0
    };
    
    await this.save();
};

module.exports = mongoose.model('Company', CompanySchema);