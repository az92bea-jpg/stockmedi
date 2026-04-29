/**
 * CONTRÔLEUR NOTIFICATIONS - Envoi d'emails automatiques
 * Utilise nodemailer (gratuit) au lieu de Resend (payant)
 */

const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configuration email (même que passwordController.js)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Récupérer l'email du propriétaire d'une entreprise
 */
async function getOwnerEmail(companyId) {
    const owner = await User.findOne({ companyId, role: 'owner', isActive: true });
    return owner?.email || null;
}

/**
 * Envoyer un email de notification
 */
async function sendNotification(to, subject, html) {
    try {
        await transporter.sendMail({
            from: `"StockMedi" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`✅ Notification envoyée à ${to}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Erreur notification à ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Notifier le propriétaire d'un changement d'abonnement
 */
async function notifySubscriptionChanged({ companyId, newPlan, reason }) {
    const ownerEmail = await getOwnerEmail(companyId);
    if (!ownerEmail) return;

    const subject = 'Votre abonnement StockMedi a été modifié';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #0F6B3A;">StockMedi</h2>
            <p>Bonjour,</p>
            <p>Votre abonnement est désormais : <strong>${newPlan.toUpperCase()}</strong>.</p>
            <p>Merci pour votre confiance.</p>
            <p><a href="${process.env.FRONTEND_URL}/subscription" style="color: #0F6B3A;">Accéder à mon espace</a></p>
            <hr />
            <p style="color: #6B7280; font-size: 0.8rem;">StockMedi – Gestion pharmaceutique</p>
        </div>
    `;

    await sendNotification(ownerEmail, subject, html);
}

/**
 * Vérifier les abonnements expirant bientôt (à appeler chaque jour)
 */
async function notifySubscriptionExpiringSoon() {
    const Subscription = require('../models/Subscription');
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    const subscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lte: sevenDaysLater, $gte: today },
    });

    for (const sub of subscriptions) {
        const ownerEmail = await getOwnerEmail(sub.companyId);
        if (!ownerEmail) continue;

        const daysLeft = Math.ceil((sub.endDate - today) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft <= 3;

        const subject = isUrgent
            ? `⚠️ Votre abonnement expire dans ${daysLeft} jours`
            : `Votre abonnement StockMedi expire bientôt`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">StockMedi</h2>
                <p>Bonjour,</p>
                <p>Votre abonnement <strong>${sub.plan}</strong> expire le <strong>${sub.endDate.toLocaleDateString('fr-FR')}</strong> (dans ${daysLeft} jours).</p>
                <p>Pour continuer à utiliser StockMedi sans interruption :</p>
                <p><a href="${process.env.FRONTEND_URL}/subscription" style="display: inline-block; padding: 10px 20px; background-color: #0F6B3A; color: white; text-decoration: none; border-radius: 6px;">Renouveler mon abonnement</a></p>
                <hr />
                <p style="color: #6B7280; font-size: 0.8rem;">StockMedi – Gestion pharmaceutique</p>
            </div>
        `;

        await sendNotification(ownerEmail, subject, html);
    }
    
    console.log('✅ Vérification des expirations terminée');
}

module.exports = {
    notifySubscriptionChanged,
    notifySubscriptionExpiringSoon,
};