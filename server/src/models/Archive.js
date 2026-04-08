/**
 * MODÈLE ARCHIVE - Stockage des historiques réinitialisés
 * 
 * Ce modèle permet de conserver les données "réinitialisées" du tableau de bord
 * (ventes, produits, employés, statistiques) avant chaque nouvelle période.
 * 
 * Les archives sont automatiquement supprimées après 1 an.
 */

const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        archiveType: {
            type: String,
            enum: [
                'monthly_reset',
                'yearly_reset',
                'manual_reset',
                'auto_cleanup'
            ],
            default: 'manual_reset'
        },
        period: {
            year: { type: Number, required: true },
            month: { type: Number },
            quarter: { type: Number },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true }
        },
        
        // ========== DONNÉES ARCHIVÉES ==========
        snapshot: {
            stats: {
                daily: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
                monthly: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
                yearly: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
                topProducts: [{
                    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                    name: String,
                    totalQuantity: Number,
                    totalRevenue: Number
                }]
            },
            alerts: {
                lowStock: { type: Number, default: 0 },
                outOfStock: { type: Number, default: 0 },
                expiringSoon: { type: Number, default: 0 },
                expired: { type: Number, default: 0 }
            },
            counters: {
                totalProducts: { type: Number, default: 0 },
                totalEmployees: { type: Number, default: 0 },
                totalSales: { type: Number, default: 0 },
                totalRevenue: { type: Number, default: 0 }
            }
        },
        
        // ========== MÉTADONNÉES ==========
        archivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        archivedAt: {
            type: Date,
            default: Date.now
        },
        
        // ========== GESTION CYCLE DE VIE ==========
        willBeDeletedAt: {
            type: Date,
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletionNotified: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ==================== INDEX ====================
ArchiveSchema.index({ companyId: 1 });
ArchiveSchema.index({ willBeDeletedAt: 1 });
ArchiveSchema.index({ archivedAt: -1 });
ArchiveSchema.index({ companyId: 1, 'period.year': 1, 'period.month': 1 });

// ==================== VIRTUELS ====================
ArchiveSchema.virtual('periodLabel').get(function() {
    if (this.period.month) {
        return `${this.period.month}/${this.period.year}`;
    }
    if (this.period.quarter) {
        return `T${this.period.quarter} ${this.period.year}`;
    }
    return `Année ${this.period.year}`;
});

// ==================== MÉTHODES ====================
ArchiveSchema.methods.markAsDeleted = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
};

ArchiveSchema.methods.shouldBeDeleted = function() {
    return new Date() >= this.willBeDeletedAt && !this.isDeleted;
};

module.exports = mongoose.model('Archive', ArchiveSchema);