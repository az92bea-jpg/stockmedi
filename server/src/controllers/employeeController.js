/**
 * CONTRÔLEUR EMPLOYÉS - Gestion des employés
 * Support affectation aux établissements (plan Enterprise)
 * Chiffrement des données sensibles
 */

const User = require('../models/User');
const Company = require('../models/Company');
const Subscription = require('../models/Subscription');
const Establishment = require('../models/Establishment');
const crypto = require('crypto');
const { auditLog } = require('../services/auditService');

// Fonction pour hasher le mot de passe
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Plans et limites d'employés
const PLAN_LIMITS = {
    trial: 3,
    basic: 10,
    premium: 30,
    enterprise: 999
};

/**
 * @desc    Récupérer tous les employés
 * @route   GET /api/employees
 * @access  Private (owner)
 */
exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        })
        .select('-password')
        .populate('establishments', 'name type')
        .sort({ createdAt: -1 });

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
 * @route   POST /api/employees
 * @access  Private (owner)
 */
exports.addEmployee = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, discipline, permissions, establishments } = req.body;

        // VÉRIFIER LA LIMITE D'EMPLOYÉS SELON LE PLAN
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

        // Vérifier que les établissements appartiennent bien à l'entreprise (si fournis)
        let validEstablishments = [];
        if (establishments && establishments.length > 0) {
            const companyEstablishments = await Establishment.find({
                companyId: req.user.companyId,
                _id: { $in: establishments }
            });
            validEstablishments = companyEstablishments.map(e => e._id);
        }

        // HASHER LE MOT DE PASSE AVANT STOCKAGE
        const hashedPassword = hashPassword(password);

        // Créer l'employé
        const employee = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || '',
            role: 'employee',
            discipline: discipline || 'autre',
            permissions: permissions || ['make_sales'],
            establishments: validEstablishments,
            companyId: req.user.companyId,
            isActive: true
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

        // Peupler les établissements pour la réponse
        await employee.populate('establishments', 'name type');

        // Audit Trail ADD EMPLOYEE
        await auditLog({
            companyId: req.user.companyId,
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action: 'create',
            documentType: 'employee',
            documentId: employee._id,
            documentName: `${employee.firstName} ${employee.lastName}`,
            description: `Employé ajouté : ${employee.firstName} ${employee.lastName} (${employee.email})`
        });

        res.status(201).json({
            success: true,
            employee: {
                _id: employee._id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                phone: employee.phone,
                discipline: employee.discipline,
                permissions: employee.permissions,
                establishments: employee.establishments,
                isActive: employee.isActive,
                createdAt: employee.createdAt
            }
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
 * @route   PUT /api/employees/:id
 * @access  Private (owner)
 */
exports.updateEmployee = async (req, res) => {
    try {
        const { firstName, lastName, phone, discipline, permissions, establishments } = req.body;

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
        
        // Gérer les établissements
        if (establishments !== undefined) {
            if (establishments.length > 0) {
                const companyEstablishments = await Establishment.find({
                    companyId: req.user.companyId,
                    _id: { $in: establishments }
                });
                employee.establishments = companyEstablishments.map(e => e._id);
            } else {
                employee.establishments = [];
            }
        }

        await employee.save();
        await employee.populate('establishments', 'name type');


        await auditLog({
            companyId: req.user.companyId,
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action: 'update',
            documentType: 'employee',
            documentId: employee._id,
            documentName: `${employee.firstName} ${employee.lastName}`,
            description: `Employé modifié : ${employee.firstName} ${employee.lastName}`
        });
        res.json({
            success: true,
            employee: {
                _id: employee._id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                phone: employee.phone,
                discipline: employee.discipline,
                permissions: employee.permissions,
                establishments: employee.establishments,
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
 * @route   PUT /api/employees/:id/toggle
 * @access  Private (owner)
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
 * @route   DELETE /api/employees/:id
 * @access  Private (owner)
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


        await auditLog({
            companyId: req.user.companyId,
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action: 'delete',
            documentType: 'employee',
            documentId: req.params.id,
            documentName: `${employee.firstName} ${employee.lastName}`,
            description: `Employé supprimé : ${employee.firstName} ${employee.lastName}`
        });

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