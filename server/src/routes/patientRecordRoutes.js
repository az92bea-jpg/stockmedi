/**
 * ROUTES DOSSIER PHARMACEUTIQUE PATIENT (DPP)
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
const { protect } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

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