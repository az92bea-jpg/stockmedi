/**
 * ROUTES LOGS
 */

const express = require('express');
const router = express.Router();
const {
    getActivityLogs,
    getLogsStats
} = require('../controllers/logsController');
const { protect, authorize } = require('../middleware/auth');

// Vérifier d'abord l'authentification, puis le rôle super-admin
router.use(protect);
router.use(authorize('super-admin'));

router.get('/', getActivityLogs);
router.get('/stats', getLogsStats);

module.exports = router;