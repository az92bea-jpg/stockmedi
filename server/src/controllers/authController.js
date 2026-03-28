const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerOwner = async (req, res) => {
    try {
        const { email, password, firstName, lastName, companyName } = req.body;
        
        console.log('📝 Inscription:', { email, firstName, lastName, companyName });

        if (!email || !password || !firstName || !lastName || !companyName) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        }

        // Créer l'entreprise
        const company = await Company.create({
            name: companyName,
            email: email,
            subscription: {
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        const hashedPassword = hashPassword(password);

        const user = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'owner',
            companyId: company._id
        });

        company.ownerId = user._id;
        await company.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

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
        
        console.log('✅ Utilisateur trouvé:', { 
            id: user._id, 
            role: user.role,
            hasPassword: !!user.password 
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
            company = await Company.findById(user.companyId);
        }
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId
            },
            company: company ? {
                id: company._id,
                name: company.name
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

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addEmployee = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, discipline, permissions } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        }

        const hashedPassword = hashPassword(password);

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

        res.status(201).json({
            success: true,
            employee: {
                id: employee._id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: employee.role,
                discipline: employee.discipline,
                permissions: employee.permissions
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

module.exports = { 
    registerOwner, 
    login, 
    getMe, 
    addEmployee 
};