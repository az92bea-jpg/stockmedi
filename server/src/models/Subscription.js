const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['trial', 'basic', 'premium', 'enterprise'],
        default: 'trial'
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'suspended', 'cancelled', 'trial'],
        default: 'trial'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    paymentMethod: {
        type: String,
        enum: ['card', 'mobile_money', 'bank_transfer'],
        default: 'card'
    },
    paymentReference: String,
    trialUsed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Vérifier si l'abonnement est actif
SubscriptionSchema.methods.isActive = function() {
    return (this.status === 'active' || this.status === 'trial') && this.endDate > new Date();
};

// Calculer les jours restants
SubscriptionSchema.methods.daysRemaining = function() {
    if (this.endDate < new Date()) return 0;
    return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
};

// Plan details
SubscriptionSchema.methods.getPlanDetails = function() {
    const plans = {
        trial: { name: 'Essai gratuit', price: 0, duration: 30, color: '#10B981' },
        basic: { name: 'Basic', price: 50000, duration: 30, color: '#3B82F6' },
        premium: { name: 'Premium', price: 100000, duration: 30, color: '#8B5CF6' },
        enterprise: { name: 'Enterprise', price: 250000, duration: 30, color: '#F59E0B' }
    };
    return plans[this.plan] || plans.trial;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);