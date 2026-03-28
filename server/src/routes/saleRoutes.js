/**
 * ROUTES VENTES
 * Définit les endpoints pour la gestion des ventes
 */

const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSale,
    cancelSale,
    getSalesStats
} = require('../controllers/saleController');
const { protect, hasPermission } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes consultables par tous
router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSale);

// Routes nécessitant la permission de vente
router.post('/', hasPermission('make_sales'), createSale);

// Annulation (owner uniquement via middleware spécifique)
router.put('/:id/cancel', hasPermission('manage_users'), cancelSale);

module.exports = router;