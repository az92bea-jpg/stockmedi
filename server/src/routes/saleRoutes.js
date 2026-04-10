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

// ==================== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ====================
// Lecture des ventes et statistiques
router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSale);

// ==================== ROUTES NÉCESSITANT UNE PERMISSION ====================
// Création de vente : permission 'make_sales'
router.post('/', hasPermission('make_sales'), createSale);

// Annulation de vente : permission 'cancel_sales'
router.put('/:id/cancel', hasPermission('cancel_sales'), cancelSale);

module.exports = router;