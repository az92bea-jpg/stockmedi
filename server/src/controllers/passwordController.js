/**
 * CONTRÔLEUR RÉCUPÉRATION MOT DE PASSE
 * Sécurisé : questions + code WhatsApp + lien
 */

const User = require('../models/User');
const Company = require('../models/Company');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * ÉTAPE 1 : Vérifier l'email
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

        const user = await User.findOne({ email });
        // Toujours répondre la même chose (sécurité)
        return res.json({ success: true, step: 'questions', email });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * ÉTAPE 2 : Vérifier les réponses + envoyer le code WhatsApp
 * @route   POST /api/auth/verify-identity
 */
exports.verifyIdentity = async (req, res) => {
    try {
        const { email, companyName, discipline } = req.body;
        if (!email || !companyName || !discipline) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: 'Informations incorrectes' });

        // Vérifier le nom de l'entreprise
        const company = await Company.findById(user.companyId);
        if (!company || company.name.toLowerCase() !== companyName.toLowerCase()) {
            return res.json({ success: false, message: 'Informations incorrectes' });
        }

        // Vérifier la discipline/rôle
        const userDiscipline = user.role === 'owner' ? 'proprietaire' : user.discipline || '';
        if (userDiscipline.toLowerCase() !== discipline.toLowerCase()) {
            return res.json({ success: false, message: 'Informations incorrectes' });
        }

        // Générer un code à 6 chiffres
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorCode = code;
        user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await user.save();

        // Envoyer le code via WhatsApp
        try {
            const message = `🔐 *StockMedi* - Votre code de vérification : *${code}*\n\nCe code expire dans 5 minutes.`;
            await sendWhatsAppMessage(user.phone, message);
        } catch (err) {
            console.error('Erreur WhatsApp:', err);
            // Continuer même si WhatsApp échoue (le code est stocké)
        }

        res.json({ success: true, step: 'code', message: 'Code envoyé sur votre WhatsApp' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * ÉTAPE 3 : Vérifier le code + générer le lien
 * @route   POST /api/auth/verify-reset-code
 */
exports.verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ success: false, message: 'Code requis' });

        const user = await User.findOne({ email });
        if (!user || user.twoFactorCode !== code || user.twoFactorCodeExpires < new Date()) {
            return res.json({ success: false, message: 'Code invalide ou expiré' });
        }

        // Nettoyer le code
        user.twoFactorCode = null;
        user.twoFactorCodeExpires = null;
        await user.save();

        // Générer le token de réinitialisation
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        await PasswordReset.deleteMany({ email });
        await PasswordReset.create({
            email,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        res.json({ success: true, step: 'reset', resetUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * Envoyer un message WhatsApp (API Cloud gratuite)
 */
/* VERSION TEST DEV
async function sendWhatsAppMessage(phone, message) {
    // Version simplifiée — nécessite config WhatsApp Cloud API
    console.log(`📱 WhatsApp → ${phone}: ${message}`);
}
*/


// config WhatsApp Cloud API pour reception de vrais codes
async function sendWhatsAppMessage(phone, message) {
    try {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: { body: message }
            })
        });
        const data = await response.json();
        console.log('✅ WhatsApp OK:', JSON.stringify(data));
    } catch (error) {
        console.error('❌ WhatsApp échec:', error.message);
    }
}

// verifyResetToken et resetPassword restent INCHANGÉS
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetEntry = await PasswordReset.findOne({ token: hashedToken, expiresAt: { $gt: new Date() }, used: false });
        if (!resetEntry) return res.status(400).json({ success: false, message: 'Lien invalide ou expiré' });
        res.json({ success: true, email: resetEntry.email });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token || !password || !confirmPassword) return res.status(400).json({ success: false, message: 'Champs requis' });
        if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Mots de passe différents' });
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!regex.test(password)) return res.status(400).json({ success: false, message: 'Mot de passe trop faible' });

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const resetEntry = await PasswordReset.findOne({ token: hashedToken, expiresAt: { $gt: new Date() }, used: false });
        if (!resetEntry) return res.status(400).json({ success: false, message: 'Lien invalide' });

        const user = await User.findOne({ email: resetEntry.email });
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

        user.password = hashPassword(password);
        await user.save();
        resetEntry.used = true;
        await resetEntry.save();

        res.json({ success: true, message: 'Mot de passe réinitialisé' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};