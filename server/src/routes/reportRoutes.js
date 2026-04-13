/**
 * ROUTES RAPPORTS
 * ⭐ Support filtrage par établissements accessibles
 */

const express = require('express');
const router = express.Router();
const {
    generateInventoryPDF,
    generateInventoryExcel,
    generateSalesExcel,
    getInventoryByEstablishment
} = require('../controllers/reportController');
const { protect, hasEstablishmentAccess } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// ==================== RAPPORTS GÉNÉRAUX ====================
router.get('/inventory/pdf', generateInventoryPDF);
router.get('/inventory/excel', generateInventoryExcel);
router.get('/sales/excel', generateSalesExcel);

// ==================== RAPPORTS PAR ÉTABLISSEMENT ====================
// GET /inventory/establishment/:establishmentId - Rapport d'inventaire par établissement
router.get('/inventory/establishment/:establishmentId', hasEstablishmentAccess, getInventoryByEstablishment);

module.exports = router;