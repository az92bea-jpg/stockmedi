/**
 * ROUTES PAIEMENT
 * ⭐ Support Stripe + Paiement local
 */

const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    stripeWebhook,
    getStripeConfig,
    submitLocalPaymentRequest
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// ==================== ROUTES PUBLIQUES ====================
// Webhook Stripe (pas de middleware raw ici - déjà dans server.js)
router.post('/webhook', stripeWebhook);

// ==================== ROUTES PROTÉGÉES ====================
// Configuration Stripe
router.get('/config', protect, getStripeConfig);

// Créer une session de paiement Stripe
router.post('/create-checkout-session', protect, createCheckoutSession);

// ⭐ Soumettre une demande de paiement local / Mobile Money
router.post('/local-request', protect, submitLocalPaymentRequest);

module.exports = router;