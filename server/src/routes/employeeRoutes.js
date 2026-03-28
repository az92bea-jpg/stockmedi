/**
 * ROUTES EMPLOYÉS
 */

const express = require('express');
const router = express.Router();
const {
    getEmployees,
    addEmployee,
    updateEmployee,
    toggleEmployee,
    deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent d'être propriétaire
router.use(protect);
router.use(authorize('owner'));

router.get('/', getEmployees);
router.post('/', addEmployee);
router.put('/:id', updateEmployee);
router.put('/:id/toggle', toggleEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;