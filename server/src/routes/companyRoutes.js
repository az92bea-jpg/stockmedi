/**
 * ROUTES ENTREPRISE
 * Définit les endpoints pour la gestion de l'entreprise
 */

const express = require('express');
const router = express.Router();
const {
    getMyCompany,
    updateSettings,
    getEmployees,
    toggleEmployee
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

// Toutes ces routes nécessitent d'être authentifié
router.use(protect);
router.use(authorize('owner'));

router.get('/me', getMyCompany);
router.put('/settings', updateSettings);
router.get('/employees', getEmployees);
router.put('/employees/:id/toggle', toggleEmployee);

module.exports = router;