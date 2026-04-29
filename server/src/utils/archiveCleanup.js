/**
 * UTILITAIRE NETTOYAGE ARCHIVES
 * 
 * À exécuter via un cron job (ex: tous les jours à 2h du matin)
 * 
 * Commande à ajouter dans Render cron-job.org ou via node-cron :
 * node server/src/utils/archiveCleanup.js
 *  fait déjà le même travail directement dans l'application.il fait doublon avec ce qui est déjà dans server.js
 * /

/*
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function runCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connecté pour nettoyage archives');

        const { cleanupExpiredArchives } = require('../controllers/archiveController');
        const deletedCount = await cleanupExpiredArchives();

        console.log(`✅ Nettoyage terminé : ${deletedCount} archive(s) supprimée(s)`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
        process.exit(1);
    }
}

runCleanup();*/