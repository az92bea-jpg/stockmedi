/**
 * CONTRÔLEUR SUPER-ADMIN - Contrôle total de la plateforme
 */

const User = require('../models/User');
const Company = require('../models/Company');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Subscription = require('../models/Subscription');

/**
 * @desc    Vérifier si l'utilisateur est super-admin (middleware)
 */
exports.isSuperAdmin = async (req, res, next) => {
    if (req.user.role !== 'super-admin') {
        return res.status(403).json({
            success: false,
            message: 'Accès réservé aux administrateurs'
        });
    }
    next();
};

/**
 * @desc    Tableau de bord Super-Admin - Statistiques globales
 * @route   GET /api/admin/stats
 */
exports.getGlobalStats = async (req, res) => {
    try {
        const [
            totalCompanies,
            totalUsers,
            totalProducts,
            totalSales,
            activeSubscriptions,
            trialSubscriptions,
            expiredSubscriptions
        ] = await Promise.all([
            Company.countDocuments(),
            User.countDocuments(),
            Product.countDocuments(),
            Sale.countDocuments(),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ plan: 'trial', status: 'active' }),
            Subscription.countDocuments({ status: 'expired' })
        ]);

        // Chiffre d'affaires total
        const totalRevenue = await Sale.aggregate([
            { $match: { isCancelled: { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        // Ventes par mois (derniers 12 mois)
        const last12Months = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            
            const monthlySales = await Sale.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        isCancelled: { $ne: true }
                    }
                },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            
            last12Months.push({
                month: start.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                total: monthlySales[0]?.total || 0
            });
        }

        // Top 10 entreprises par chiffre d'affaires
        const topCompanies = await Sale.aggregate([
            { $match: { isCancelled: { $ne: true } } },
            {
                $group: {
                    _id: '$companyId',
                    totalRevenue: { $sum: '$total' },
                    totalSales: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'companies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'company'
                }
            },
            { $unwind: '$company' },
            {
                $project: {
                    _id: 1,
                    companyName: '$company.name',
                    companyEmail: '$company.email',
                    totalRevenue: 1,
                    totalSales: 1
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalCompanies,
                totalUsers,
                totalProducts,
                totalSales,
                activeSubscriptions,
                trialSubscriptions,
                expiredSubscriptions,
                totalRevenue: totalRevenue[0]?.total || 0,
                monthlyRevenue: last12Months,
                topCompanies
            }
        });
    } catch (error) {
        console.error('❌ Erreur stats globales:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};

/**
 * @desc    Liste de toutes les entreprises
 * @route   GET /api/admin/companies
 */
exports.getAllCompanies = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        
        const companies = await Company.find(query)
            .populate('ownerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Company.countDocuments(query);
        
        // Ajouter les infos d'abonnement
        const companiesWithSubscription = await Promise.all(companies.map(async (company) => {
            const subscription = await Subscription.findOne({ companyId: company._id });
            return {
                ...company.toObject(),
                subscription: subscription ? {
                    plan: subscription.plan,
                    status: subscription.status,
                    endDate: subscription.endDate,
                    isActive: subscription.isActive ? subscription.isActive() : false
                } : null
            };
        }));
        
        res.json({
            success: true,
            companies: companiesWithSubscription,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('❌ Erreur récupération entreprises:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des entreprises'
        });
    }
};

/**
 * @desc    Détails d'une entreprise
 * @route   GET /api/admin/companies/:id
 */
exports.getCompanyDetails = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('ownerId', 'firstName lastName email phone');
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }
        
        const employees = await User.find({
            companyId: company._id,
            role: 'employee'
        }).select('-password');
        
        const productsCount = await Product.countDocuments({ companyId: company._id });
        const salesCount = await Sale.countDocuments({ companyId: company._id });
        
        const subscription = await Subscription.findOne({ companyId: company._id });
        
        res.json({
            success: true,
            company: {
                ...company.toObject(),
                stats: {
                    employees: employees.length,
                    products: productsCount,
                    sales: salesCount
                },
                subscription
            },
            employees
        });
    } catch (error) {
        console.error('❌ Erreur détails entreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des détails'
        });
    }
};

/**
 * @desc    Modifier une entreprise
 * @route   PUT /api/admin/companies/:id
 */
exports.updateCompany = async (req, res) => {
    try {
        const { name, type, email, phone, address, isActive, subscription } = req.body;
        
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }
        
        if (name) company.name = name;
        if (type) company.type = type;
        if (email) company.email = email;
        if (phone) company.phone = phone;
        if (address) company.address = { ...company.address, ...address };
        if (isActive !== undefined) company.isActive = isActive;
        
        await company.save();
        
        // Mettre à jour l'abonnement si nécessaire
        if (subscription) {
            const sub = await Subscription.findOne({ companyId: company._id });
            if (sub) {
                if (subscription.plan) sub.plan = subscription.plan;
                if (subscription.status) sub.status = subscription.status;
                if (subscription.endDate) sub.endDate = new Date(subscription.endDate);
                await sub.save();
            }
        }
        
        res.json({
            success: true,
            message: 'Entreprise mise à jour avec succès',
            company
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour entreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour'
        });
    }
};

/**
 * @desc    Supprimer une entreprise (et toutes ses données)
 * @route   DELETE /api/admin/companies/:id
 */
exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }
        
        // Supprimer tous les utilisateurs de l'entreprise
        await User.deleteMany({ companyId: company._id });
        
        // Supprimer tous les produits
        await Product.deleteMany({ companyId: company._id });
        
        // Supprimer toutes les ventes
        await Sale.deleteMany({ companyId: company._id });
        
        // Supprimer l'abonnement
        await Subscription.deleteMany({ companyId: company._id });
        
        // Supprimer l'entreprise
        await company.deleteOne();
        
        res.json({
            success: true,
            message: 'Entreprise et toutes ses données supprimées avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression entreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
};

/**
 * @desc    Liste de tous les utilisateurs
 * @route   GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        
        const users = await User.find(query)
            .select('-password')
            .populate('companyId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await User.countDocuments(query);
        
        res.json({
            success: true,
            users,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('❌ Erreur récupération utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des utilisateurs'
        });
    }
};

/**
 * @desc    Modifier un utilisateur
 * @route   PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
    try {
        const { firstName, lastName, phone, role, isActive, discipline, permissions } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (discipline) user.discipline = discipline;
        if (permissions) user.permissions = permissions;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour'
        });
    }
};

/**
 * @desc    Suspendre/Activer un utilisateur
 * @route   PUT /api/admin/users/:id/toggle
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        res.json({
            success: true,
            message: user.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
            isActive: user.isActive
        });
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification'
        });
    }
};

/**
 * @desc    Supprimer un utilisateur
 * @route   DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        // Ne pas supprimer le super-admin
        if (user.role === 'super-admin') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer le compte super-admin'
            });
        }
        
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
};

/**
 * @desc    Récupérer les logs système
 * @route   GET /api/admin/logs
 */
exports.getSystemLogs = async (req, res) => {
    try {
        // Ici on pourrait lire des fichiers de logs
        // Pour l'instant, on retourne des logs récents de la base
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('email role createdAt');
        
        const recentSales = await Sale.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('companyId', 'name')
            .select('saleNumber total createdAt');
        
        res.json({
            success: true,
            logs: {
                recentUsers,
                recentSales
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des logs'
        });
    }
};

// ==================== NOUVELLES FONCTIONS ====================

/**
 * @desc    Mettre à jour l'abonnement d'une entreprise (manuellement)
 * @route   PUT /api/admin/companies/:id/subscription
 * @access  Private (super-admin)
 */
exports.updateCompanySubscription = async (req, res) => {
    try {
        const { plan, status, endDate } = req.body;
        const companyId = req.params.id;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });
        }

        const oldPlan = company.subscription?.plan || 'trial';

        // Mettre à jour l'abonnement dans Company
        company.subscription.plan = plan;
        company.subscription.status = status;
        if (endDate) company.subscription.endDate = new Date(endDate);
        await company.save();

        // Mettre à jour ou créer l'abonnement dans Subscription
        let subscription = await Subscription.findOne({ companyId });
        if (subscription) {
            subscription.plan = plan;
            subscription.status = status;
            subscription.endDate = endDate ? new Date(endDate) : subscription.endDate;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                companyId,
                plan,
                status,
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                startDate: new Date()
            });
        }

        // Mettre à jour les limites de l'entreprise (stats)
        await company.updateStats();

        /* // ⭐ NOTIFICATION : Changement manuel par super-admin
        //const { notifySubscriptionChanged } = require('./notificationController');
        //await notifySubscriptionChanged({
        //    companyId: company._id,
        //    newPlan: plan,
        //    reason: 'admin'
        //}); */

        res.json({
            success: true,
            message: `Abonnement de ${company.name} mis à jour vers ${plan}`,
            company: {
                id: company._id,
                name: company.name,
                subscription: company.subscription
            }
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour abonnement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Obtenir des statistiques avancées pour le super-admin
 * @route   GET /api/admin/advanced-stats
 * @access  Private (super-admin)
 */
exports.getAdvancedStats = async (req, res) => {
    try {
        const totalCompanies = await Company.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalSales = await Sale.countDocuments();

        const companiesByPlan = await Company.aggregate([
            { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
        ]);

        const recentCompanies = await Company.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('ownerId', 'firstName lastName email');

        res.json({
            success: true,
            stats: {
                totalCompanies,
                totalUsers,
                totalProducts,
                totalSales,
                companiesByPlan,
                recentCompanies
            }
        });
    } catch (error) {
        console.error('❌ Erreur stats avancées:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Supprimer un log spécifique (par ID)
 * @route   DELETE /api/admin/logs/:id
 * @access  Private (super-admin)
 */
exports.deleteLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'user', 'sale', ou 'subscription'

        let result;
        if (type === 'user') {
            result = await User.findByIdAndDelete(id);
        } else if (type === 'sale') {
            result = await Sale.findByIdAndDelete(id);
        } else if (type === 'subscription') {
            result = await Subscription.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ success: false, message: 'Type de log invalide' });
        }

        if (!result) {
            return res.status(404).json({ success: false, message: 'Log non trouvé' });
        }

        res.json({
            success: true,
            message: 'Log supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Supprimer tous les logs d'un type
 * @route   DELETE /api/admin/logs/clear-all
 * @access  Private (super-admin)
 */
exports.clearAllLogs = async (req, res) => {
    try {
        const { type } = req.query; // 'user', 'sale', 'subscription', ou 'all'

        if (type === 'user' || type === 'all') {
            await User.deleteMany({ role: { $ne: 'super-admin' } });
        }
        if (type === 'sale' || type === 'all') {
            await Sale.deleteMany({});
        }
        if (type === 'subscription' || type === 'all') {
            await Subscription.deleteMany({});
        }

        res.json({
            success: true,
            message: `Logs ${type === 'all' ? 'tous' : type} supprimés avec succès`
        });
    } catch (error) {
        console.error('❌ Erreur suppression logs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};