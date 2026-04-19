/**
 * ROUTES CRON - Déclenchées par cron-job.org
 */

const express = require('express');
const router = express.Router();
const { cleanupInactiveAccounts, processDeletionRequests } = require('../services/accountDeletionService');

/**
 * @desc    Nettoyage RGPD (comptes inactifs + demandes de suppression)
 * @route   GET /api/cron/cleanup
 * @access  Public (sécurisé par URL secrète - optionnel)
 */
router.get('/cleanup', async (req, res) => {
    try {
        console.log('🕒 Démarrage nettoyage RGPD via cron...');
        
        const inactiveDeleted = await cleanupInactiveAccounts();
        console.log(`📊 Comptes inactifs (>1 an) supprimés: ${inactiveDeleted}`);
        
        const requestsProcessed = await processDeletionRequests();
        console.log(`📊 Demandes de suppression (>7 jours) traitées: ${requestsProcessed}`);
        
        console.log('✅ Nettoyage RGPD terminé');
        
        res.json({
            success: true,
            message: 'Nettoyage RGPD terminé',
            inactiveDeleted,
            requestsProcessed,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erreur cron cleanup:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;