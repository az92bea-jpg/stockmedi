/**
 * ROUTES ÉTABLISSEMENTS - Gestion multi-sites
 */

const express = require('express');
const router = express.Router();
const {
    getEstablishments,
    createEstablishment,
    updateEstablishment,
    deleteEstablishment,
    transferStock,
    migrateProductsToEstablishment
} = require('../controllers/establishmentController');
const { protect, authorize, hasPermission } = require('../middleware/auth');

// Toutes ces routes nécessitent d'être authentifié
router.use(protect);

// ==================== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ====================
// GET / : Tout utilisateur peut voir la liste des établissements
router.get('/', getEstablishments);

// ==================== ROUTES RÉSERVÉES AU PROPRIÉTAIRE ====================
// Création, modification, suppression d'établissements : owner uniquement
router.post('/', authorize('owner'), createEstablishment);
router.put('/:id', authorize('owner'), updateEstablishment);
router.delete('/:id', authorize('owner'), deleteEstablishment);

// Migration des produits sans établissement
router.post('/:id/migrate-products', authorize('owner'), migrateProductsToEstablishment);

// ==================== ROUTES AVEC PERMISSION SPÉCIFIQUE ====================
// Transfert de stock : nécessite la permission 'manage_stock'
// La vérification d'accès aux établissements se fait dans le contrôleur
router.post('/transfer', hasPermission('manage_stock'), transferStock);

module.exports = router;