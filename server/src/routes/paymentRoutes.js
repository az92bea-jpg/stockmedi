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

// Webhook (pas de middleware raw ici - déjà dans server.js)
router.post('/webhook', stripeWebhook);

// Routes protégées
router.get('/config', protect, getStripeConfig);
router.post('/create-checkout-session', protect, createCheckoutSession);

module.exports = router;