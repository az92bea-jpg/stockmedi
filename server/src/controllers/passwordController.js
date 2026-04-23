/**
 * CONTRÔLEUR RÉCUPÉRATION MOT DE PASSE
 */

const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuration email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Fonction pour hasher le mot de passe
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * @desc    Demander la réinitialisation du mot de passe
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email requis'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: true,
                message: 'Si un compte existe, un email de réinitialisation a été envoyé'
            });
        }

        // Générer le token
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Supprimer les anciennes demandes pour cet email
        await PasswordReset.deleteMany({ email });

        // Créer une nouvelle entrée - expiration 15 minutes
        await PasswordReset.create({
            email,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        // Construire le lien
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        // ENVOYER L'EMAIL
        try {
            await transporter.sendMail({
                from: `"StockMedi" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #0F6B3A;">Réinitialisation de mot de passe</h2>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0F6B3A; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                            Réinitialiser mon mot de passe
                        </a>
                        <p style="font-size: 0.85rem; color: #6B7280;">Ce lien expire dans 15 minutes.</p>
                        <p style="font-size: 0.85rem; color: #6B7280;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    </div>
                `
            });
            
            console.log('✅ Email envoyé à:', email);
        } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
        }

        console.log('🔗 Lien de réinitialisation:', resetUrl);

        res.json({
            success: true,
            message: 'Un email de réinitialisation a été envoyé'
        });
    } catch (error) {
        console.error('❌ Erreur forgot password:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de réinitialisation'
        });
    }
};

/**
 * @desc    Vérifier la validité du token
 * @route   GET /api/auth/reset-password/:token
 */
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetEntry = await PasswordReset.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() },
            used: false
        });

        if (!resetEntry) {
            return res.status(400).json({
                success: false,
                message: 'Lien invalide ou expiré'
            });
        }

        res.json({
            success: true,
            message: 'Token valide',
            email: resetEntry.email
        });
    } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification'
        });
    }
};

/**
 * @desc    Réinitialiser le mot de passe
 * @route   POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les mots de passe ne correspondent pas'
            });
        }

        // Validation mot de passe fort
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetEntry = await PasswordReset.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() },
            used: false
        });

        if (!resetEntry) {
            return res.status(400).json({
                success: false,
                message: 'Lien invalide ou expiré'
            });
        }

        const user = await User.findOne({ email: resetEntry.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        user.password = hashPassword(password);
        await user.save();

        resetEntry.used = true;
        await resetEntry.save();

        res.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur reset password:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation'
        });
    }
};