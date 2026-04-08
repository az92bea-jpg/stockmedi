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

// Routes accessibles uniquement aux propriétaires (plan enterprise)
router.use(authorize('owner'));

router.get('/', getEstablishments);
router.post('/', createEstablishment);
router.put('/:id', updateEstablishment);
router.delete('/:id', deleteEstablishment);
router.post('/transfer', transferStock);


module.exports = router;