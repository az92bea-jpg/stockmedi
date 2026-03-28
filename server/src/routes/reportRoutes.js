/**
 * ROUTES RAPPORTS
 */

const express = require('express');
const router = express.Router();
const {
    generateInventoryPDF,
    generateInventoryExcel,
    generateSalesExcel
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/inventory/pdf', generateInventoryPDF);
router.get('/inventory/excel', generateInventoryExcel);
router.get('/sales/excel', generateSalesExcel);

module.exports = router;