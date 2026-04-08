const express = require('express');
const router = express.Router();
const {
    isSuperAdmin,
    getGlobalStats,
    getAllCompanies,
    getCompanyDetails,
    updateCompany,
    deleteCompany,
    getAllUsers,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getSystemLogs,
    // ⭐ NOUVELLES FONCTIONS
    updateCompanySubscription,
    getAdvancedStats,
    deleteLog,
    clearAllLogs
} = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent authentification + rôle super-admin
router.use(protect);
router.use(isSuperAdmin);

// ========== STATISTIQUES ==========
router.get('/stats', getGlobalStats);
router.get('/advanced-stats', getAdvancedStats);

// ========== GESTION ENTREPRISES ==========
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyDetails);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.put('/companies/:id/subscription', updateCompanySubscription);

// ========== GESTION UTILISATEURS ==========
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// ========== LOGS ==========
router.get('/logs', getSystemLogs);
router.delete('/logs/:id', deleteLog);           // ⭐ Supprimer un log spécifique
router.delete('/logs/clear-all', clearAllLogs);  // ⭐ Supprimer tous les logs

module.exports = router;