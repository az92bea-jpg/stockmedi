/**
 * CONTRÔLEUR ARCHIVE - Gestion des historiques
 */

const Archive = require('../models/Archive');
const Company = require('../models/Company');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');

/**
 * @desc    Archiver et réinitialiser les compteurs du Dashboard
 */
exports.resetAndArchiveDashboard = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;

        // 1. Récupérer l'état actuel du Dashboard
        const currentStats = await getCurrentDashboardStats(companyId);
        const currentAlerts = await getCurrentAlerts(companyId);
        const currentCounters = await getCurrentCounters(companyId);

        // 2. Déterminer la période d'archivage
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const period = {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            startDate: startOfMonth,
            endDate: now
        };

        // 3. Créer l'archive
        const archive = await Archive.create({
            companyId,
            archiveType: 'manual_reset',
            period,
            snapshot: {
                stats: currentStats,
                alerts: currentAlerts,
                counters: currentCounters
            },
            archivedBy: userId,
            willBeDeletedAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

        // 4. ⭐ Marquer les ventes de la période comme archivées
        await archiveSales(companyId, period.startDate, period.endDate);

        // 5. Réinitialiser les compteurs
        await resetDashboardCounters(companyId);

        res.json({
            success: true,
            message: 'Tableau de bord archivé et réinitialisé avec succès',
            archive: {
                id: archive._id,
                period: archive.periodLabel,
                archivedAt: archive.archivedAt
            }
        });
    } catch (error) {
        console.error('❌ Erreur archivage:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'archivage',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer la liste des archives
 */
exports.getArchives = async (req, res) => {
    try {
        const { year, month, page = 1, limit = 20 } = req.query;
        const companyId = req.user.companyId;

        const query = { companyId, isDeleted: false };

        if (year) query['period.year'] = parseInt(year);
        if (month) query['period.month'] = parseInt(month);

        const archives = await Archive.find(query)
            .populate('archivedBy', 'firstName lastName email')
            .sort({ archivedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Archive.countDocuments(query);
        const years = await Archive.distinct('period.year', { companyId });

        res.json({
            success: true,
            archives,
            years: years.sort((a, b) => b - a),
            pagination: {
                page: parseInt(page),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération archives:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des archives',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer une archive spécifique
 */
exports.getArchive = async (req, res) => {
    try {
        const archive = await Archive.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            isDeleted: false
        }).populate('archivedBy', 'firstName lastName email');

        if (!archive) {
            return res.status(404).json({
                success: false,
                message: 'Archive non trouvée'
            });
        }

        res.json({
            success: true,
            archive
        });
    } catch (error) {
        console.error('❌ Erreur récupération archive:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'archive',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer définitivement une archive
 */
exports.deleteArchive = async (req, res) => {
    try {
        const archive = await Archive.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!archive) {
            return res.status(404).json({
                success: false,
                message: 'Archive non trouvée'
            });
        }

        await archive.markAsDeleted();

        res.json({
            success: true,
            message: 'Archive supprimée définitivement'
        });
    } catch (error) {
        console.error('❌ Erreur suppression archive:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        });
    }
};

/**
 * @desc    Nettoyage automatique des archives expirées
 */
exports.cleanupExpiredArchives = async () => {
    try {
        const expiredArchives = await Archive.find({
            willBeDeletedAt: { $lt: new Date() },
            isDeleted: false
        });

        for (const archive of expiredArchives) {
            await archive.markAsDeleted();
            console.log(`🗑️ Archive supprimée: ${archive._id}`);
        }

        return expiredArchives.length;
    } catch (error) {
        console.error('❌ Erreur nettoyage archives:', error);
        return 0;
    }
};

// ==================== FONCTIONS UTILITAIRES ====================

async function archiveSales(companyId, startDate, endDate) {
    const result = await Sale.updateMany(
        {
            companyId,
            createdAt: { $gte: startDate, $lte: endDate },
            archived: false
        },
        { $set: { archived: true } }
    );
    console.log(`📦 ${result.modifiedCount} ventes marquées comme archivées`);
}

async function getCurrentDashboardStats(companyId) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // ⭐ Filtrer les ventes non archivées
    const dailySales = await Sale.aggregate([
        { $match: { companyId, createdAt: { $gte: startOfDay }, archived: false } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const monthlySales = await Sale.aggregate([
        { $match: { companyId, createdAt: { $gte: startOfMonth }, archived: false } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const yearlySales = await Sale.aggregate([
        { $match: { companyId, createdAt: { $gte: startOfYear }, archived: false } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const topProducts = await Sale.aggregate([
        { $match: { companyId, archived: false } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                name: { $first: '$items.name' },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.subtotal' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    return {
        daily: dailySales[0] || { total: 0, count: 0 },
        monthly: monthlySales[0] || { total: 0, count: 0 },
        yearly: yearlySales[0] || { total: 0, count: 0 },
        topProducts
    };
}

async function getCurrentAlerts(companyId) {
    const today = new Date();
    const soonExpiration = new Date();
    soonExpiration.setDate(today.getDate() + 30);

    const lowStock = await Product.countDocuments({
        companyId,
        isActive: true,
        quantity: { $gt: 0 },
        $expr: { $lte: ['$quantity', '$reorderPoint'] }
    });

    const outOfStock = await Product.countDocuments({
        companyId,
        isActive: true,
        quantity: 0
    });

    const expiringSoon = await Product.countDocuments({
        companyId,
        isActive: true,
        expirationDate: { $gte: today, $lte: soonExpiration },
        quantity: { $gt: 0 }
    });

    const expired = await Product.countDocuments({
        companyId,
        isActive: true,
        expirationDate: { $lt: today },
        quantity: { $gt: 0 }
    });

    return { lowStock, outOfStock, expiringSoon, expired };
}

async function getCurrentCounters(companyId) {
    const totalProducts = await Product.countDocuments({ companyId, isActive: true });
    const totalEmployees = await User.countDocuments({ companyId, role: 'employee', isActive: true });
    const totalSales = await Sale.countDocuments({ companyId, archived: false });
    const totalRevenue = await Sale.aggregate([
        { $match: { companyId, archived: false } },
        { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    return {
        totalProducts,
        totalEmployees,
        totalSales,
        totalRevenue: totalRevenue[0]?.total || 0
    };
}

async function resetDashboardCounters(companyId) {
    const company = await Company.findById(companyId);
    if (company) {
        company.stats = {
            totalProducts: await Product.countDocuments({ companyId, isActive: true }),
            totalEmployees: await User.countDocuments({ companyId, role: 'employee', isActive: true }),
            totalSalesThisMonth: 0,
            totalRevenueThisMonth: 0
        };
        await company.save();
    }
}