/**
 * ROUTES D'AUTHENTIFICATION
 * ⭐ Sécurité renforcée : Rate Limiting + Validation + 2FA
 */

const express = require('express');
const router = express.Router();

// Contrôleurs
const { 
    registerOwner, 
    login, 
    getMe, 
    addEmployee,
    send2FACode,
    verify2FACode
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

router.post('/register', validateRegister, registerOwner);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

// ==================== ROUTES PRIVÉES ====================

router.get('/me', protect, getMe);
router.post('/employee', protect, authorize('owner'), addEmployee);

// 2FA
router.post('/2fa/send', send2FACode);
router.post('/2fa/verify', verify2FACode);

module.exports = router;