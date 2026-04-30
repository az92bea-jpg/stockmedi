const cron = require('node-cron');
const { notifySubscriptionExpiringSoon } = require('../controllers/notificationController');
const SecurityLog = require('../models/SecurityLog');

// Vérification quotidienne à 8h du matin
cron.schedule('0 8 * * *', async () => {
    console.log('📧 Vérification des abonnements expirant bientôt...');
    await notifySubscriptionExpiringSoon();
});

// Nettoyer les logs de sécurité > 90 jours (tous les jours à 3h du matin)
cron.schedule('0 3 * * *', async () => {
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const deleted = await SecurityLog.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
        if (deleted.deletedCount > 0) {
            console.log(`🗑️ ${deleted.deletedCount} logs de sécurité supprimés (> 90 jours)`);
        }
    } catch (error) {
        console.error('❌ Erreur nettoyage logs:', error.message);
    }
});

// Nettoyer les audits > 1 an (tous les jours à 4h du matin)
cron.schedule('0 4 * * *', async () => {
    try {
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const AuditTrail = require('../models/AuditTrail');
        const deleted = await AuditTrail.deleteMany({ createdAt: { $lt: oneYearAgo } });
        if (deleted.deletedCount > 0) {
            console.log(`🗑️ ${deleted.deletedCount} audits supprimés (> 1 an)`);
        }
    } catch (error) {
        console.error('❌ Erreur nettoyage audits:', error.message);
    }
});
console.log('✅ Cron job activé : notifications d\'expiration d\'abonnement (8h chaque jour)');