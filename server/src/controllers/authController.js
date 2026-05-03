const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logSecurityEvent } = require('../middleware/securityLogger');
const { sendVerificationEmail } = require('../services/emailService');



// ==================== UTILITAIRES ====================

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== INSCRIPTION PROPRIÉTAIRE ====================

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

        const company = await Company.create({
            name: companyName,
            email: email,
            phone: req.body.phone || req.body.companyPhone || '',
            type: req.body.companyType || 'pharmacy',
            address: req.body.companyAddress || {},
            subscription: { plan: 'trial', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'active' }
        });

        const hashedPassword = hashPassword(password);

        // Générer token de vérification email
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        const user = await User.create({
            email, password: hashedPassword, firstName, lastName,
            role: 'owner', companyId: company._id, permissions: [], isActive: true,
            isEmailVerified: false,
            emailVerificationToken: hashedVerificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        company.ownerId = user._id;
        await company.save();

        // Envoyer email de vérification
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        try {
            await sendVerificationEmail(email, verificationUrl, firstName);
            console.log('✅ Email vérification envoyé à:', email);
        } catch (emailError) {
            console.error('❌ Erreur envoi email vérification:', emailError.message);
        }

        // Pas de token JWT — compte non encore vérifié
        res.status(201).json({
            success: true,
            requireEmailVerification: true,
            message: 'Compte créé ! Vérifiez votre boîte email pour activer votre compte.',
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== CONNEXION ====================

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Tentative de connexion:', { email });

        // const user = await User.findOne({ email }).select('+password');

       const user = await User.findOne({ email }).select('+password');


        if (!user) {
            await logSecurityEvent({ companyId: null, userId: null, userEmail: email, action: 'login_failed', description: `Tentative échouée pour ${email}`, ipAddress: req.ip, userAgent: req.get('user-agent') || '', status: 'failed' });
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Votre compte a été désactivé.' });
        }

        // Vérification email obligatoire
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                requireEmailVerification: true,
                message: 'Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte mail.'
            });
        }


        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            await logSecurityEvent({ companyId: user.companyId, userId: user._id, userEmail: email, action: 'login_failed', description: `Mot de passe incorrect pour ${email}`, ipAddress: req.ip, userAgent: req.get('user-agent') || '', status: 'failed' });
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }

        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        const token = generateToken(user._id);

        let company = null;
        if (user.companyId) {
            company = await Company.findById(user.companyId).select('name logo subscription');
        }

        const userObj = user.toObject();

        await logSecurityEvent({ companyId: user.companyId, userId: user._id, userEmail: user.email, action: 'login_success', description: `Connexion réussie pour ${user.email}`, ipAddress: req.ip, userAgent: req.get('user-agent') || '', status: 'success' });

        res.json({
            success: true, token,
            user: { _id: userObj._id, email: userObj.email, firstName: userObj.firstName, lastName: userObj.lastName, phone: userObj.phone, role: userObj.role, discipline: userObj.discipline, permissions: userObj.permissions || [], isActive: userObj.isActive, companyId: userObj.companyId, lastLogin: userObj.lastLogin },
            company: company ? { _id: company._id, name: company.name, logo: company.logo, subscription: company.subscription } : null
        });
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la connexion', error: error.message });
    }
};

// ==================== 2FA ====================

const send2FACode = async (req, res) => {
    const { email, deviceId } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorEnabled) {
        return res.json({ success: true, require2FA: false });
    }
    const verifiedDevice = user.twoFactorVerifiedDevices.find(d => d.deviceId === deviceId && d.expiresAt > new Date());
    if (verifiedDevice) {
        return res.json({ success: true, require2FA: false });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = code;
    user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    const { send2FACode } = require('../services/emailService');
    await send2FACode(user.email, code);
    res.json({ success: true, require2FA: true, message: 'Code envoyé par email' });
};

const verify2FACode = async (req, res) => {
    const { email, code, deviceId, rememberDays } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.twoFactorCode !== code || user.twoFactorCodeExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'Code invalide ou expiré' });
    }
    const days = rememberDays || 60;
    user.twoFactorVerifiedDevices.push({ deviceId, verifiedAt: new Date(), expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000) });
    user.twoFactorVerifiedDevices = user.twoFactorVerifiedDevices.filter(d => d.expiresAt > new Date());
    user.twoFactorCode = null;
    user.twoFactorCodeExpires = null;
    await user.save();
    res.json({ success: true, message: 'Code vérifié avec succès' });
};

// ==================== PROFIL UTILISATEUR ====================

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('companyId', 'name logo subscription settings');
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        res.json({ success: true, user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role, discipline: user.discipline, permissions: user.permissions || [], isActive: user.isActive, companyId: user.companyId, createdAt: user.createdAt, lastLogin: user.lastLogin } });
    } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ==================== AJOUT D'UN EMPLOYÉ ====================

const addEmployee = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, discipline, permissions } = req.body;
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Seul le propriétaire peut ajouter des employés' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        const defaultPermissions = ['make_sales', 'view_dashboard', 'view_products'];
        const employeePermissions = permissions && permissions.length > 0 ? permissions : defaultPermissions;
        const hashedPassword = hashPassword(password);
        const employee = await User.create({ email, password: hashedPassword, firstName, lastName, phone: phone || '', role: 'employee', discipline: discipline || 'autre', permissions: employeePermissions, companyId: req.user.companyId, isActive: true });
        res.status(201).json({ success: true, message: 'Employé ajouté avec succès', employee: { _id: employee._id, email: employee.email, firstName: employee.firstName, lastName: employee.lastName, phone: employee.phone, role: employee.role, discipline: employee.discipline, permissions: employee.permissions, isActive: employee.isActive, createdAt: employee.createdAt } });
    } catch (error) {
        console.error('❌ Erreur ajout employé:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'employé', error: error.message });
    }
};

// ==================== VÉRIFICATION EMAIL ====================

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token manquant'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Lien invalide ou expiré. Recréez votre compte ou contactez le support.'
            });
        }

        // Activer le compte
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        console.log('✅ Email vérifié pour:', user.email);

        res.json({
            success: true,
            message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
        });

    } catch (error) {
        console.error('❌ Erreur vérification email:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ==================== EXPORTS ====================

module.exports = { 
    registerOwner, 
    login, 
    getMe, 
    addEmployee,
    send2FACode,
    verify2FACode,
    verifyEmail
};