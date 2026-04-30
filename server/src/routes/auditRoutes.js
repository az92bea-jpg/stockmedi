const express = require('express');
const router = express.Router();
const AuditTrail = require('../models/AuditTrail');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const query = { companyId: req.user.companyId };
        
        const total = await AuditTrail.countDocuments(query);
        const logs = await AuditTrail.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        res.json({ success: true, logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;