/**
 * ROUTES STOCK
 * Définit les endpoints pour la gestion du stock
 */

const express = require('express');
const router = express.Router();
const {
    stockIn,
    stockOut,
    getStockHistory,
    getInventory
} = require('../controllers/stockController');
const { protect, hasPermission } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes consultables par tous les employés
router.get('/history', getStockHistory);
router.get('/inventory', getInventory);

// Routes nécessitant la permission de gestion de stock
router.post('/in', hasPermission('manage_stock'), stockIn);
router.post('/out', hasPermission('manage_stock'), stockOut);

module.exports = router;