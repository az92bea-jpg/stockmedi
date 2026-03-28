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
    getSystemLogs
} = require('../controllers/superAdminController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.use(isSuperAdmin);

router.get('/stats', getGlobalStats);
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyDetails);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/logs', getSystemLogs);  // ← Si cette ligne existe, supprime-la

module.exports = router;