/**
 * ROUTES PARAMÈTRES
 */

const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    getProfile,
    updateProfile
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes paramètres entreprise (owner uniquement)
router.get('/', authorize('owner'), getSettings);
router.put('/', authorize('owner'), updateSettings);

// Routes profil utilisateur (tous)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;