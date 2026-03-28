/**
 * ROUTES D'AUTHENTIFICATION
 */

const express = require('express');
const router = express.Router();

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

const { protect, authorize } = require('../middleware/auth');

// ==================== ROUTES PUBLIQUES ====================
router.post('/register', registerOwner);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

// ==================== ROUTES PRIVÉES ====================
router.get('/me', protect, getMe);
router.post('/employee', protect, authorize('owner'), addEmployee);

module.exports = router;