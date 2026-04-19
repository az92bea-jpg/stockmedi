const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requestAccountDeletion, cancelDeletionRequest } = require('../controllers/userController');

// Demander la suppression du compte (délai 7 jours)
router.post('/request-deletion', protect, authorize('owner'), requestAccountDeletion);

// Annuler une demande de suppression
router.post('/cancel-deletion', protect, authorize('owner'), cancelDeletionRequest);

module.exports = router;