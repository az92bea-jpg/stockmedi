/**
 * ROUTES VENTES
 * Définit les endpoints pour la gestion des ventes
 * ⭐ Support filtrage par établissements accessibles
 */

const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSale,
    cancelSale,
    getSalesStats,
    getSalesByEstablishment
} = require('../controllers/saleController');
const { protect, hasPermission, hasEstablishmentAccess } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// ==================== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ====================
// Lecture des ventes et statistiques (filtrage par établissements dans le contrôleur)
router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSale);

// ==================== ROUTES PAR ÉTABLISSEMENT ====================
// Voir les ventes d'un établissement spécifique
router.get('/establishment/:establishmentId', hasEstablishmentAccess, getSalesByEstablishment);

// ==================== ROUTES NÉCESSITANT UNE PERMISSION ====================
// Création de vente : permission 'make_sales' + vérification d'accès
router.post('/', hasPermission('make_sales'), createSale);

// Annulation de vente : permission 'cancel_sales'
router.put('/:id/cancel', hasPermission('cancel_sales'), cancelSale);

module.exports = router;