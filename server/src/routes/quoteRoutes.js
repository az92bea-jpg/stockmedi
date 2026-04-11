/**
 * ROUTES DEVIS - Gestion des devis / proformas
 */

const express = require('express');
const router = express.Router();
const {
    createQuote,
    getQuotes,
    getQuote,
    updateQuote,
    deleteQuote,
    convertQuoteToSale
} = require('../controllers/quoteController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent d'être authentifié
router.use(protect);

// Routes CRUD
router.post('/', createQuote);
router.get('/', getQuotes);
router.get('/:id', getQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

// Conversion en vente
router.post('/:id/convert', convertQuoteToSale);

module.exports = router;