/**
 * ROUTES D'AUTHENTIFICATION
 * ⭐ Sécurité renforcée : Rate Limiting + Validation
 */

const express = require('express');
const router = express.Router();

// Contrôleurs
const { 
    registerOwner, 
    login, 
    getMe, 
    addEmployee 
} = require('../controllers/authController');

const { 
    forgotPassword,
    verifyResetToken,
    resetPassword
} = require('../controllers/passwordController');

// Middlewares
const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');
const { validateRegister } = require('../middleware/validators');

// ==================== ROUTES PUBLIQUES ====================

// Inscription avec validation du mot de passe fort
router.post('/register', validateRegister, registerOwner);

// Connexion avec rate limiting (anti force brute)
router.post('/login', loginLimiter, login);

// Mot de passe oublié
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

// ==================== ROUTES PRIVÉES ====================

// Profil utilisateur connecté
router.get('/me', protect, getMe);

// Ajout d'employé (owner uniquement)
router.post('/employee', protect, authorize('owner'), addEmployee);

module.exports = router;