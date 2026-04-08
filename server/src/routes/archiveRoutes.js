/**
 * ROUTES ARCHIVE - Gestion des historiques
 */

const express = require('express');
const router = express.Router();
const {
    resetAndArchiveDashboard,
    getArchives,
    getArchive,
    deleteArchive
} = require('../controllers/archiveController');
const { protect, hasPermission } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes pour les propriétaires et super-admin (utilise hasPermission)
router.post('/reset-dashboard', hasPermission('manage_settings'), resetAndArchiveDashboard);
router.get('/list', hasPermission('manage_settings'), getArchives);
router.get('/:id', hasPermission('manage_settings'), getArchive);
router.delete('/:id', hasPermission('manage_settings'), deleteArchive);

module.exports = router;