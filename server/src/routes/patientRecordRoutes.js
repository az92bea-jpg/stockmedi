/**
 * ROUTES DOSSIER PHARMACEUTIQUE PATIENT (DPP)
 * Réservé au plan Enterprise
 */

const express = require('express');
const router = express.Router();
const {
    createPatientRecord,
    getPatientRecords,
    getPatientRecord,
    updatePatientRecord,
    deletePatientRecord,
    archivePatientRecord,
    getArchivedRecords,
    exportPatientRecord
} = require('../controllers/patientRecordController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);
router.use(authorize('owner', 'super-admin'));

// Vérifier le plan Enterprise
router.use(async (req, res, next) => {
    if (req.user.role === 'super-admin') return next();
    const Subscription = require('../models/Subscription');
    const sub = await Subscription.findOne({ companyId: req.user.companyId });
    if (sub?.plan !== 'enterprise') {
        return res.status(403).json({ success: false, message: 'Fonctionnalité réservée au plan Enterprise' });
    }
    next();
});

// CRUD
router.post('/', createPatientRecord);
router.get('/', getPatientRecords);
router.get('/archives', getArchivedRecords);
router.get('/:id', getPatientRecord);
router.get('/:id/export', exportPatientRecord);
router.put('/:id', updatePatientRecord);
router.put('/:id/archive', archivePatientRecord);
router.delete('/:id', deletePatientRecord);

module.exports = router;