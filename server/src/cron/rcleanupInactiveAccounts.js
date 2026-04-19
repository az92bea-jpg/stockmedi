/** Si je souhaite que render execute le cron-job(C'était un script autonome qui s'exécutait directement vianode cleanupInactiveAccounts.js sans export)
 * TÂCHE CRON - Nettoyage des comptes inactifs et demandes de suppression
 * 
 * À exécuter quotidiennement (ex: 3h du matin)
 * Commande: node server/src/cron/cleanupInactiveAccounts.js
 */

/*
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { cleanupInactiveAccounts, processDeletionRequests } = require('../services/accountDeletionService');

async function runCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté pour nettoyage RGPD');
        
        const inactiveDeleted = await cleanupInactiveAccounts();
        console.log(`📊 Comptes inactifs supprimés: ${inactiveDeleted}`);
        
        const requestsProcessed = await processDeletionRequests();
        console.log(`📊 Demandes de suppression traitées: ${requestsProcessed}`);
        
        console.log('✅ Nettoyage RGPD terminé');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
        process.exit(1);
    }
}

runCleanup();
*/