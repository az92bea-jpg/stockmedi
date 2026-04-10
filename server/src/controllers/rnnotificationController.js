/**
 * CONTRÔLEUR NOTIFICATIONS - Envoi d'emails
 */

/* const { sendEmail } = require('../services/emailService');
const User = require('../models/User');*/

/**
 * Récupérer l'email du propriétaire d'une entreprise
 */
/* async function getOwnerEmails(companyId) {
    const owner = await User.findOne({ companyId, role: 'owner', isActive: true });
    return owner?.email ? [owner.email] : [];
}
*/

// /**
 //* Notifier le propriétaire d'un changement d'abonnement
 //* @param {Object} params - { companyId, newPlan, reason }
 //*/
/* async function notifySubscriptionChanged({ companyId, newPlan, reason }) {
    const ownerEmails = await getOwnerEmails(companyId);
    if (!ownerEmails.length) return;

    const subject = reason === 'admin'
        ? 'Votre abonnement a été modifié par l’administrateur'
        : 'Votre abonnement a été changé';

    const message = reason === 'admin'
        ? 'Un administrateur a modifié votre offre.'
        : 'Merci pour votre confiance.';

    await sendEmail({
        to: ownerEmails,
        subject,
        html: `
            <h2>StockMedi</h2>
            <p>Bonjour,</p>
            <p>Votre abonnement est désormais : <strong>${newPlan.toUpperCase()}</strong>.</p>
            <p>${message}</p>
            <p><a href="${process.env.FRONTEND_URL}/subscription">Accéder à mon espace</a></p>
            <hr />
            <p style="color:gray;">StockMedi – Gestion pharmaceutique multi‑espaces</p>
        `,
    });
}
*/

/**
 * Vérifier les abonnements expirant bientôt (à appeler quotidiennement)
 */
/* async function notifySubscriptionExpiringSoon() {
    const Subscription = require('../models/Subscription');
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const subscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lte: sevenDaysLater, $gte: today },
    }).populate('companyId');

    for (const sub of subscriptions) {
        const ownerEmails = await getOwnerEmails(sub.companyId._id);
        if (!ownerEmails.length) continue;

        const daysLeft = Math.ceil((sub.endDate - today) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft <= 3;

        await sendEmail({
            to: ownerEmails,
            subject: isUrgent
                ? `⚠️ Votre abonnement expire dans ${daysLeft} jours`
                : `Votre abonnement expire bientôt`,
            html: `
                <h2>StockMedi</h2>
                <p>Bonjour,</p>
                <p>Votre abonnement <strong>${sub.plan}</strong> expire le <strong>${sub.endDate.toLocaleDateString()}</strong> (dans ${daysLeft} jours).</p>
                <p>Pour continuer à utiliser StockMedi sans interruption, <a href="${process.env.FRONTEND_URL}/subscription">renouvelez votre abonnement dès maintenant</a>.</p>
                <hr />
                <p style="color:gray;">StockMedi – Gestion pharmaceutique multi‑espaces</p>
            `,
        });
    }
}

module.exports = {
    notifySubscriptionChanged,
    notifySubscriptionExpiringSoon,
}; */