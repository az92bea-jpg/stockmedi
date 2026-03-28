/**
 * CONTRÔLEUR ENTREPRISE - StockMedi
 * Gère la configuration et les paramètres de l'entreprise
 */

const Company = require('../models/Company');
const User = require('../models/User');

/**
 * @desc    Récupérer les informations de l'entreprise
 * @route   GET /api/companies/me
 * @access  Private (owner)
 */
const getMyCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId)
            .populate('ownerId', 'firstName lastName email phone');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        res.json({
            success: true,
            company
        });
    } catch (error) {
        console.error('❌ Erreur récupération entreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'entreprise',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour les paramètres de l'entreprise
 * @route   PUT /api/companies/settings
 * @access  Private (owner)
 */
const updateSettings = async (req, res) => {
    try {
        const { currency, language, taxRate, invoicePrefix, expirationAlertDays, batchTracking, prescriptionRequired } = req.body;

        const company = await Company.findById(req.user.companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Mettre à jour les paramètres
        if (currency) company.settings.currency = currency;
        if (language) company.settings.language = language;
        if (taxRate !== undefined) company.settings.taxRate = taxRate;
        if (invoicePrefix) company.settings.invoicePrefix = invoicePrefix;
        if (expirationAlertDays !== undefined) company.settings.expirationAlertDays = expirationAlertDays;
        if (batchTracking !== undefined) company.settings.batchTracking = batchTracking;
        if (prescriptionRequired !== undefined) company.settings.prescriptionRequired = prescriptionRequired;

        await company.save();

        res.json({
            success: true,
            settings: company.settings
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des paramètres',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer tous les employés de l'entreprise
 * @route   GET /api/companies/employees
 * @access  Private (owner)
 */
const getEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('-password');

        res.json({
            success: true,
            count: employees.length,
            employees
        });
    } catch (error) {
        console.error('❌ Erreur récupération employés:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des employés',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer un employé par ID
 * @route   GET /api/companies/employees/:id
 * @access  Private (owner)
 */
const getEmployee = async (req, res) => {
    try {
        const employee = await User.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            role: 'employee'
        }).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        res.json({
            success: true,
            employee
        });
    } catch (error) {
        console.error('❌ Erreur récupération employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'employé',
            error: error.message
        });
    }
};

/**
 * @desc    Désactiver/Activer un employé
 * @route   PUT /api/companies/employees/:id/toggle
 * @access  Private (owner)
 */
const toggleEmployee = async (req, res) => {
    try {
        const employee = await User.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            role: 'employee'
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        employee.isActive = !employee.isActive;
        await employee.save();

        // Mettre à jour les statistiques de l'entreprise
        const company = await Company.findById(req.user.companyId);
        await company.updateStats();

        res.json({
            success: true,
            isActive: employee.isActive,
            message: employee.isActive ? 'Employé activé' : 'Employé désactivé'
        });
    } catch (error) {
        console.error('❌ Erreur modification statut employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du statut',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un employé
 * @route   DELETE /api/companies/employees/:id
 * @access  Private (owner)
 */
const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
            role: 'employee'
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        await employee.deleteOne();

        // Mettre à jour les statistiques de l'entreprise
        const company = await Company.findById(req.user.companyId);
        await company.updateStats();

        res.json({
            success: true,
            message: 'Employé supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'employé',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour les informations de l'entreprise
 * @route   PUT /api/companies/me
 * @access  Private (owner)
 */
const updateCompany = async (req, res) => {
    try {
        const { name, phone, email, address, logo } = req.body;

        const company = await Company.findById(req.user.companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Mettre à jour les champs
        if (name) company.name = name;
        if (phone) company.phone = phone;
        if (email) company.email = email;
        if (address) {
            if (address.street) company.address.street = address.street;
            if (address.city) company.address.city = address.city;
            if (address.postalCode) company.address.postalCode = address.postalCode;
            if (address.country) company.address.country = address.country;
        }
        if (logo) company.logo = logo;

        await company.save();

        res.json({
            success: true,
            company
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour entreprise:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'entreprise',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les statistiques de l'entreprise
 * @route   GET /api/companies/stats
 * @access  Private (owner)
 */
const getCompanyStats = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Forcer la mise à jour des stats
        await company.updateStats();

        res.json({
            success: true,
            stats: company.stats
        });
    } catch (error) {
        console.error('❌ Erreur récupération statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * @desc    Vérifier le statut de l'abonnement
 * @route   GET /api/companies/subscription
 * @access  Private (owner)
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId).select('subscription');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        const isActive = company.isSubscriptionActive();
        const daysRemaining = Math.ceil((company.subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            subscription: {
                ...company.subscription.toObject(),
                isActive,
                daysRemaining: daysRemaining > 0 ? daysRemaining : 0
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération abonnement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'abonnement',
            error: error.message
        });
    }
};

// EXPORTS
module.exports = {
    getMyCompany,
    updateSettings,
    getEmployees,
    getEmployee,
    toggleEmployee,
    deleteEmployee,
    updateCompany,
    getCompanyStats,
    getSubscriptionStatus
};