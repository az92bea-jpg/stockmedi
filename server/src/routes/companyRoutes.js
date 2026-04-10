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

// ⭐ GET /me : accessible à TOUS les utilisateurs authentifiés (owner, employee, super-admin)
router.get('/me', getMyCompany);

// ⭐ Les routes suivantes sont réservées au propriétaire
router.put('/settings', authorize('owner'), updateSettings);
router.get('/employees', authorize('owner'), getEmployees);
router.put('/employees/:id/toggle', authorize('owner'), toggleEmployee);

module.exports = router;