/**
 * ROUTES PARAMÈTRES
 */

const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    getProfile,
    updateProfile,
    toggle2FA,
    get2FAConfig,
    toggle2FADuration
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

// 2FA
router.get('/2fa', get2FAConfig);
router.put('/2fa', toggle2FA);
router.put('/2fa-duration', authorize('owner'), toggle2FADuration);

module.exports = router;