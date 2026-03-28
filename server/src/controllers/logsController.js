/**
 * CONTRÔLEUR LOGS - Gestion des logs système
 */

const User = require('../models/User');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Company = require('../models/Company');

/**
 * @desc    Récupérer tous les logs d'activité
 * @route   GET /api/admin/logs
 * @access  Super-Admin
 */
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, type, startDate, endDate, userId } = req.query;
        
        const logs = [];
        
        // 1. Logs des connexions (dernières connexions des utilisateurs)
        const loginLogs = await User.find(
            userId ? { _id: userId } : {},
            { firstName: 1, lastName: 1, email: 1, lastLogin: 1, role: 1 }
        ).sort({ lastLogin: -1 }).limit(limit);
        
        loginLogs.forEach(user => {
            if (user.lastLogin) {
                logs.push({
                    type: 'login',
                    date: user.lastLogin,
                    user: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: user.role,
                    action: 'Connexion',
                    details: `Utilisateur connecté`
                });
            }
        });
        
        // 2. Logs des ventes
        const salesQuery = {};
        if (startDate) salesQuery.createdAt = { $gte: new Date(startDate) };
        if (endDate) salesQuery.createdAt = { ...salesQuery.createdAt, $lte: new Date(endDate) };
        
        const saleLogs = await Sale.find(salesQuery)
            .populate('userId', 'firstName lastName email')
            .populate('companyId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        saleLogs.forEach(sale => {
            logs.push({
                type: 'sale',
                date: sale.createdAt,
                user: sale.userId ? `${sale.userId.firstName} ${sale.userId.lastName}` : 'Inconnu',
                email: sale.userId?.email,
                company: sale.companyId?.name,
                action: 'Vente',
                details: `Vente #${sale.saleNumber} - ${sale.total.toLocaleString()} GNF`
            });
        });
        
        // 3. Logs des produits créés/modifiés
        const productLogs = await Product.find()
            .populate('companyId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        productLogs.forEach(product => {
            logs.push({
                type: 'product',
                date: product.createdAt,
                company: product.companyId?.name,
                action: 'Création produit',
                details: `Produit "${product.name}" créé`,
                productName: product.name
            });
        });
        
        // 4. Logs des entreprises créées
        const companyLogs = await Company.find()
            .populate('ownerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        companyLogs.forEach(company => {
            logs.push({
                type: 'company',
                date: company.createdAt,
                company: company.name,
                user: company.ownerId ? `${company.ownerId.firstName} ${company.ownerId.lastName}` : 'Inconnu',
                email: company.ownerId?.email,
                action: 'Création entreprise',
                details: `Entreprise "${company.name}" créée`
            });
        });
        
        // Trier par date (plus récent en premier)
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Filtrer par type si demandé
        const filteredLogs = type ? logs.filter(l => l.type === type) : logs;
        
        // Pagination
        const start = (page - 1) * limit;
        const paginatedLogs = filteredLogs.slice(start, start + limit);
        
        res.json({
            success: true,
            logs: paginatedLogs,
            total: filteredLogs.length,
            page: parseInt(page),
            pages: Math.ceil(filteredLogs.length / limit)
        });
    } catch (error) {
        console.error('❌ Erreur récupération logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des logs',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les statistiques des logs
 * @route   GET /api/admin/logs/stats
 * @access  Super-Admin
 */
exports.getLogsStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Connexions aujourd'hui
        const todayLogins = await User.countDocuments({
            lastLogin: { $gte: startOfDay }
        });
        
        // Ventes aujourd'hui
        const todaySales = await Sale.countDocuments({
            createdAt: { $gte: startOfDay }
        });
        
        // Ventes cette semaine
        const weekSales = await Sale.countDocuments({
            createdAt: { $gte: startOfWeek }
        });
        
        // Ventes ce mois
        const monthSales = await Sale.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        
        // Nouvelles entreprises ce mois
        const newCompanies = await Company.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        
        // Nouveaux produits ce mois
        const newProducts = await Product.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        
        res.json({
            success: true,
            stats: {
                todayLogins,
                todaySales,
                weekSales,
                monthSales,
                newCompanies,
                newProducts
            }
        });
    } catch (error) {
        console.error('❌ Erreur stats logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};