/**
 * CONTRÔLEUR EMPLOYÉS - Gestion des employés
 */

const User = require('../models/User');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription'); // ⭐ AJOUT
const crypto = require('crypto');

// Fonction pour hasher le mot de passe
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ⭐ Plans et limites d'employés
const PLAN_LIMITS = {
    trial: 3,
    basic: 10,
    premium: 30,
    enterprise: 999
};

/**
 * @desc    Récupérer tous les employés
 */
exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('-password').sort({ createdAt: -1 });

        console.log('📋 Employés chargés:', employees.map(e => ({ 
            name: `${e.firstName} ${e.lastName}`, 
            discipline: e.discipline,
            email: e.email
        })));

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
 * @desc    Ajouter un employé
 */
exports.addEmployee = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, discipline, permissions } = req.body;

        console.log('📝 Ajout employé:', { email, firstName, lastName, discipline });

        // ⭐ VÉRIFIER LA LIMITE D'EMPLOYÉS SELON LE PLAN
        const subscription = await Subscription.findOne({ companyId: req.user.companyId });
        const currentEmployeeCount = await User.countDocuments({ 
            companyId: req.user.companyId, 
            role: 'employee' 
        });
        
        const plan = subscription?.plan || 'trial';
        const maxEmployees = PLAN_LIMITS[plan];
        
        if (currentEmployeeCount >= maxEmployees) {
            return res.status(403).json({
                success: false,
                message: `Limite d'employés atteinte (${maxEmployees}). Passez à un plan supérieur pour ajouter plus d'employés.`
            });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // HASHER LE MOT DE PASSE AVANT STOCKAGE
        const hashedPassword = hashPassword(password);

        // Créer l'employé avec mot de passe hashé
        const employee = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || '',
            role: 'employee',
            discipline: discipline || 'autre',
            permissions: permissions || ['make_sales'],
            companyId: req.user.companyId,
            isActive: true
        });

        console.log('✅ Employé créé:', { 
            id: employee._id, 
            discipline: employee.discipline 
        });

        // Mettre à jour les statistiques
        try {
            const company = await Company.findById(req.user.companyId);
            if (company && typeof company.updateStats === 'function') {
                await company.updateStats();
            }
        } catch (statsError) {
            console.log('Stats update skipped:', statsError.message);
        }

        // Ne pas retourner le mot de passe
        const employeeResponse = {
            id: employee._id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            discipline: employee.discipline,
            permissions: employee.permissions,
            isActive: employee.isActive,
            createdAt: employee.createdAt
        };

        res.status(201).json({
            success: true,
            employee: employeeResponse
        });
    } catch (error) {
        console.error('❌ Erreur ajout employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de l\'employé',
            error: error.message
        });
    }
};

/**
 * @desc    Modifier un employé
 */
exports.updateEmployee = async (req, res) => {
    try {
        const { firstName, lastName, phone, discipline, permissions } = req.body;

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

        if (firstName) employee.firstName = firstName;
        if (lastName) employee.lastName = lastName;
        if (phone !== undefined) employee.phone = phone;
        if (discipline) employee.discipline = discipline;
        if (permissions) employee.permissions = permissions;

        await employee.save();

        res.json({
            success: true,
            employee: {
                id: employee._id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                phone: employee.phone,
                discipline: employee.discipline,
                permissions: employee.permissions,
                isActive: employee.isActive
            }
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
};

/**
 * @desc    Activer/Désactiver un employé
 */
exports.toggleEmployee = async (req, res) => {
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

        res.json({
            success: true,
            isActive: employee.isActive,
            message: employee.isActive ? 'Employé activé' : 'Employé désactivé'
        });
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un employé
 */
exports.deleteEmployee = async (req, res) => {
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

        res.json({
            success: true,
            message: 'Employé supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression employé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        });
    }
};