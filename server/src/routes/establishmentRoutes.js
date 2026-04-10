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
    transferStock
} = require('../controllers/establishmentController');
const { protect, authorize, hasPermission } = require('../middleware/auth');

// Toutes ces routes nécessitent d'être authentifié
router.use(protect);

// ==================== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ====================
// GET / : Tout utilisateur peut voir la liste des établissements (pour le sélecteur, les ventes, etc.)
router.get('/', getEstablishments);

// ==================== ROUTES RÉSERVÉES AU PROPRIÉTAIRE ====================
// Création, modification, suppression d'établissements : owner uniquement
router.post('/', authorize('owner'), createEstablishment);
router.put('/:id', authorize('owner'), updateEstablishment);
router.delete('/:id', authorize('owner'), deleteEstablishment);

// ==================== ROUTES AVEC PERMISSION SPÉCIFIQUE ====================
// Transfert de stock : nécessite la permission 'manage_stock' (ou owner)
router.post('/transfer', hasPermission('manage_stock'), transferStock);

module.exports = router;