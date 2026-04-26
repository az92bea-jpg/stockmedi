const express = require('express');
const router = express.Router();
const {
    getSubscription,
    changePlan,
    cancelSubscription,
    devSubscribe
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSubscription);
router.put('/change-plan', changePlan);
router.put('/cancel', cancelSubscription);
router.post('/dev-subscribe', devSubscribe);

module.exports = router;