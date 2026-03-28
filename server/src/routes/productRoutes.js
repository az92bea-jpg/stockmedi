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
const { protect, hasPermission } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes publiques pour l'entreprise
router.get('/', getProducts);
router.get('/alerts', getAlerts);
router.get('/:id', getProduct);

// Routes nécessitant la permission de gestion de stock
router.post('/', hasPermission('manage_stock'), createProduct);
router.put('/:id', hasPermission('manage_stock'), updateProduct);
router.delete('/:id', hasPermission('manage_stock'), deleteProduct);

module.exports = router;