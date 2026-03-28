/**
 * ROUTES PAIEMENT
 */

const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    stripeWebhook,
    getStripeConfig
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Webhook (pas besoin d'authentification)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Routes protégées
router.get('/config', protect, getStripeConfig);
router.post('/create-checkout-session', protect, createCheckoutSession);

module.exports = router;