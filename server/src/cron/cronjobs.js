const cron = require('node-cron');
const { notifySubscriptionExpiringSoon } = require('../controllers/notificationController');

// Vérification quotidienne à 8h du matin
cron.schedule('0 8 * * *', async () => {
    console.log('📧 Vérification des abonnements expirant bientôt...');
    await notifySubscriptionExpiringSoon();
});

console.log('✅ Cron job activé : notifications d\'expiration d\'abonnement (8h chaque jour)');