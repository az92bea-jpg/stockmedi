/**
 * CONTRÔLEUR PARAMÈTRES - Configuration de l'entreprise
 */

const Company = require('../models/Company');
const User = require('../models/User');

/**
 * @desc    Récupérer les paramètres de l'entreprise
 * @route   GET /api/settings
 * @access  Private (owner)
 */
exports.getSettings = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId)
            .select('name phone email address settings subscription');
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        res.json({
            success: true,
            settings: {
                company: {
                    id: company._id,
                    name: company.name,
                    phone: company.phone,
                    email: company.email,
                    address: company.address
                },
                preferences: company.settings,
                subscription: company.subscription
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paramètres',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour les paramètres de l'entreprise
 * @route   PUT /api/settings
 * @access  Private (owner)
 */
exports.updateSettings = async (req, res) => {
    try {
        const { 
            companyName, 
            companyPhone, 
            companyEmail, 
            companyAddress,
            currency,
            language,
            taxRate,
            invoicePrefix,
            expirationAlertDays,
            batchTracking,
            prescriptionRequired
        } = req.body;

        const company = await Company.findById(req.user.companyId);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Entreprise non trouvée'
            });
        }

        // Mettre à jour les informations de l'entreprise
        if (companyName) company.name = companyName;
        if (companyPhone) company.phone = companyPhone;
        if (companyEmail) company.email = companyEmail;
        if (companyAddress) {
            if (companyAddress.street !== undefined) company.address.street = companyAddress.street;
            if (companyAddress.city !== undefined) company.address.city = companyAddress.city;
            if (companyAddress.postalCode !== undefined) company.address.postalCode = companyAddress.postalCode;
            if (companyAddress.country !== undefined) company.address.country = companyAddress.country;
        }

        // Mettre à jour les préférences
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
            message: 'Paramètres mis à jour avec succès',
            settings: {
                company: {
                    id: company._id,
                    name: company.name,
                    phone: company.phone,
                    email: company.email,
                    address: company.address
                },
                preferences: company.settings
            }
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
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @route   GET /api/settings/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        res.json({
            success: true,
            profile: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                discipline: user.discipline
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour le profil utilisateur
 * @route   PUT /api/settings/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, currentPassword, newPassword } = req.body;
        
        console.log('📝 Mise à jour profil:', { firstName, lastName, phone, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });
        
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour les informations de base
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;

        // Changer le mot de passe si demandé
        if (currentPassword && newPassword) {
            console.log('🔐 Tentative de changement de mot de passe');
            
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Mot de passe actuel incorrect'
                });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
                });
            }
            
            user.password = newPassword;
            console.log('✅ Mot de passe modifié');
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            profile: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du profil',
            error: error.message
        });
    }
};

/**
 * Activer/Désactiver la 2FA pour l'entreprise
 * @route PUT /api/settings/2fa
 */
exports.toggle2FA = async (req, res) => {
    try {
        const { enabled } = req.body;
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });

        company.twoFactorEnabled = enabled;
        await company.save();

        res.json({ success: true, message: enabled ? '2FA activé' : '2FA désactivé' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Récupérer la config 2FA
 * @route GET /api/settings/2fa
 */
exports.get2FAConfig = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId);
        res.json({ success: true, twoFAEnabled: company?.twoFactorEnabled || false, twoFADuration: company?.twoFactorDuration || 60 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggle2FADuration = async (req, res) => {
    try {
        const { duration } = req.body;
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ success: false, message: 'Entreprise non trouvée' });

        company.twoFactorDuration = duration;
        await company.save();

        res.json({ success: true, message: 'Durée 2FA mise à jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};