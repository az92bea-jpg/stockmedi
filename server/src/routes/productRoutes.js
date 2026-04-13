/**
 * ROUTES PRODUITS
 * ⭐ Support filtrage par établissements accessibles
 */

const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getAlerts
} = require('../controllers/productController');
const { protect, hasPermission, hasEstablishmentAccess } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// ==================== ROUTES ACCESSIBLES À TOUS LES UTILISATEURS AUTHENTIFIÉS ====================
// Lecture des produits (filtrage par établissements dans le contrôleur)
router.get('/', getProducts);
router.get('/alerts', getAlerts);
router.get('/:id', getProduct);

// ==================== ROUTES PAR ÉTABLISSEMENT ====================
// Voir les produits d'un établissement spécifique
router.get('/establishment/:establishmentId', hasEstablishmentAccess, getProducts);

// ==================== ROUTES NÉCESSITANT UNE PERMISSION ====================
// Création de produit : permission 'manage_stock'
// ⭐ La vérification d'accès à l'établissement se fait dans le contrôleur
router.post('/', hasPermission('manage_stock'), createProduct);

// Modification de produit : permission 'manage_stock'
// ⭐ La vérification d'accès à l'établissement se fait dans le contrôleur
router.put('/:id', hasPermission('manage_stock'), updateProduct);

// Suppression de produit : permission 'manage_stock'
router.delete('/:id', hasPermission('manage_stock'), deleteProduct);

module.exports = router;