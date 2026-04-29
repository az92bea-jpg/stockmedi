const express = require('express');
const router = express.Router();
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

router.use(protect);

// Vérifier le plan (Premium ou Enterprise)
router.use(async (req, res, next) => {
    if (req.user.role === 'super-admin') return next();
    const sub = await Subscription.findOne({ companyId: req.user.companyId });
    if (sub?.plan !== 'premium' && sub?.plan !== 'enterprise') {
        return res.status(403).json({ success: false, message: 'Fonctionnalité réservée aux plans Premium et Enterprise' });
    }
    next();
});

router.post('/', createSupplier);
router.get('/', getSuppliers);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;