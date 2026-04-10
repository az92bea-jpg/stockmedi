const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==================== UTILITAIRES ====================

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== INSCRIPTION PROPRIÉTAIRE ====================

/**
 * @desc    Inscription d'un nouveau propriétaire
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerOwner = async (req, res) => {
    try {
        const { email, password, firstName, lastName, companyName } = req.body;
        
        console.log('📝 Inscription:', { email, firstName, lastName, companyName });

        if (!email || !password || !firstName || !lastName || !companyName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tous les champs sont requis' 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email déjà utilisé' 
            });
        }

        // Créer l'entreprise
        const company = await Company.create({
            name: companyName,
            email: email,
            subscription: {
                plan: 'trial',
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'active'
            }
        });

        const hashedPassword = hashPassword(password);

        const user = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'owner',
            companyId: company._id,
            permissions: [], // Owner n'a pas besoin de permissions explicites
            isActive: true
        });

        company.ownerId = user._id;
        await company.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ==================== CONNEXION ====================

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Tentative de connexion:', { email });
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé:', email);
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Votre compte a été désactivé. Contactez votre administrateur.'
            });
        }
        
        console.log('✅ Utilisateur trouvé:', { 
            id: user._id, 
            role: user.role,
            isActive: user.isActive
        });
        
        const isMatch = await user.matchPassword(password);
        console.log('🔑 Mot de passe valide:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        const token = generateToken(user._id);
        
        let company = null;
        if (user.companyId) {
            company = await Company.findById(user.companyId).select('name logo subscription');
        }
        
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                discipline: user.discipline,
                permissions: user.permissions || [],
                isActive: user.isActive,
                companyId: user.companyId,
                lastLogin: user.lastLogin
            },
            company: company ? {
                _id: company._id,
                name: company.name,
                logo: company.logo,
                subscription: company.subscription
            } : null
        });
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
};

// ==================== PROFIL UTILISATEUR ====================

/**
 * @desc    Récupérer l'utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('companyId', 'name logo subscription settings');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                discipline: user.discipline,
                permissions: user.permissions || [],  // ⭐ IMPORTANT pour les employés
                isActive: user.isActive,
                companyId: user.companyId,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// ==================== AJOUT D'UN EMPLOYÉ ====================

/**
 * @desc    Ajouter un employé (owner uniquement)
 * @route   POST /api/auth/employee
 * @access  Private (owner)
 */
const addEmployee = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, discipline, permissions } = req.body;
        
        // Vérifier que l'utilisateur est bien owner
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut ajouter des employés'
            });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email déjà utilisé' 
            });
        }

        // Permissions par défaut si non fournies
        const defaultPermissions = ['make_sales', 'view_dashboard', 'view_products'];
        const employeePermissions = permissions && permissions.length > 0 ? permissions : defaultPermissions;

        const hashedPassword = hashPassword(password);

        const employee = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || '',
            role: 'employee',
            discipline: discipline || 'autre',
            permissions: employeePermissions,
            companyId: req.user.companyId,
            isActive: true
        });

        console.log('✅ Employé créé:', { 
            id: employee._id, 
            email: employee.email,
            permissions: employee.permissions 
        });

        res.status(201).json({
            success: true,
            message: 'Employé ajouté avec succès',
            employee: {
                _id: employee._id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                phone: employee.phone,
                role: employee.role,
                discipline: employee.discipline,
                permissions: employee.permissions,
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

// ==================== EXPORTS ====================

module.exports = { 
    registerOwner, 
    login, 
    getMe, 
    addEmployee 
};