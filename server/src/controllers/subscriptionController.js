/**
 * CONTRÔLEUR ABONNEMENT
 * ⭐ Prix convertis en EUR pour Stripe
 */

const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const User = require('../models/User');
const { notifySubscriptionChanged } = require('./rnnotificationController');

// ⭐ Taux de conversion GNF → EUR (approximatif)
const GNF_TO_EUR_RATE = 10000;

// ⭐ Plans d'abonnement - Prix en GNF convertis en EUR (centimes)
const PLANS = {
    trial: {
        name: 'Essai gratuit',
        price: 0,
        duration: 30,
        maxProducts: 50,
        maxEmployees: 3,
        features: ['stock_basic', 'sales_basic', 'reports_basic']
    },
    basic: {
        name: 'Basic',
        priceGNF: 50000,
        price: 500, // ⭐ 5,00 EUR en centimes (50000 GNF / 10000 * 100)
        duration: 30,
        maxProducts: 500,
        maxEmployees: 10,
        features: ['stock_basic', 'sales_basic', 'reports_basic', 'pdf_exports', 'employees']
    },
    premium: {
        name: 'Premium',
        priceGNF: 100000,
        price: 1000, // ⭐ 10,00 EUR en centimes
        duration: 30,
        maxProducts: 2000,
        maxEmployees: 30,
        features: ['stock_advanced', 'sales_advanced', 'reports_advanced', 'pdf_exports', 'employees', 'advanced_stats', 'multiple_locations']
    },
    enterprise: {
        name: 'Enterprise',
        priceGNF: 250000,
        price: 2500, // ⭐ 25,00 EUR en centimes
        duration: 30,
        maxProducts: 10000,
        maxEmployees: 100,
        features: ['stock_advanced', 'sales_advanced', 'reports_advanced', 'pdf_exports', 'employees', 'advanced_stats', 'multiple_locations', 'api_access', 'priority_support']
    }
};

/**
 * @desc    Récupérer l'abonnement de l'entreprise
 */
exports.getSubscription = async (req, res) => {
    try {
        let subscription = await Subscription.findOne({ companyId: req.user.companyId });
        
        if (!subscription) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            
            subscription = await Subscription.create({
                companyId: req.user.companyId,
                plan: 'trial',
                status: 'trial',
                endDate: endDate,
                trialUsed: true
            });
        }

        const planDetails = subscription.getPlanDetails();

        // ⭐ Envoyer les prix en centimes d'euros pour le frontend
        res.json({
            success: true,
            subscription: {
                id: subscription._id,
                plan: subscription.plan,
                planName: planDetails.name,
                planColor: planDetails.color,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                isActive: subscription.isActive(),
                daysRemaining: subscription.daysRemaining(),
                autoRenew: subscription.autoRenew,
                features: PLANS[subscription.plan]?.features || []
            },
            plans: Object.keys(PLANS).map(key => ({
                id: key,
                name: PLANS[key].name,
                price: PLANS[key].price, // ⭐ Déjà en centimes d'euros
                duration: PLANS[key].duration,
                maxProducts: PLANS[key].maxProducts,
                maxEmployees: PLANS[key].maxEmployees,
                features: PLANS[key].features
            }))
        });
    } catch (error) {
        console.error('❌ Erreur abonnement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'abonnement'
        });
    }
};

// ... reste du fichier inchangé ...

/**
 * @desc    Changer de plan
 */
exports.changePlan = async (req, res) => {
    try {
        const { plan, autoRenew, paymentMethod, paymentReference } = req.body;
        
        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'Plan invalide'
            });
        }

        const subscription = await Subscription.findOne({ companyId: req.user.companyId });
        
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé'
            });
        }

        const oldPlan = subscription.plan;

        if (plan !== 'trial' && subscription.trialUsed && subscription.plan === 'trial') {
            subscription.trialUsed = true;
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLANS[plan].duration);

        subscription.plan = plan;
        subscription.autoRenew = autoRenew !== undefined ? autoRenew : subscription.autoRenew;
        subscription.startDate = new Date();
        subscription.endDate = endDate;
        subscription.status = 'active';
        subscription.paymentMethod = paymentMethod || subscription.paymentMethod;
        subscription.paymentReference = paymentReference;
        subscription.lastPaymentDate = new Date();
        subscription.nextPaymentDate = new Date(Date.now() + PLANS[plan].duration * 24 * 60 * 60 * 1000);

        await subscription.save();

        const company = await Company.findById(req.user.companyId);
        company.subscription.plan = plan;
        company.subscription.status = 'active';
        company.subscription.endDate = subscription.endDate;
        await company.save();

        /* // ⭐ NOTIFICATION EMAIL: Changement d'abonnement (système)
        //await notifySubscriptionChanged({
        //    companyId: company._id,
        //    newPlan: plan,
        //    reason: 'payment'
        //}); */

        res.json({
            success: true,
            message: `Passé au plan ${PLANS[plan].name}`,
            subscription: {
                plan: subscription.plan,
                planName: PLANS[plan].name,
                endDate: subscription.endDate,
                isActive: subscription.isActive(),
                daysRemaining: subscription.daysRemaining()
            }
        });
    } catch (error) {
        console.error('❌ Erreur changement plan:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de plan'
        });
    }
};

/**
 * @desc    Annuler l'abonnement
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ companyId: req.user.companyId });
        
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé'
            });
        }

        subscription.autoRenew = false;
        subscription.status = 'cancelled';
        await subscription.save();

        res.json({
            success: true,
            message: `Abonnement annulé. Il expirera le ${new Date(subscription.endDate).toLocaleDateString('fr-FR')}`,
            endDate: subscription.endDate
        });
    } catch (error) {
        console.error('❌ Erreur annulation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation'
        });
    }
};

/**
 * @desc    Vérifier les limites (middleware)
 */
exports.checkLimits = (type) => {
    return async (req, res, next) => {
        try {
            const subscription = await Subscription.findOne({ companyId: req.user.companyId });
            
            if (!subscription || !subscription.isActive()) {
                return res.status(403).json({
                    success: false,
                    message: 'Abonnement inactif ou expiré. Veuillez renouveler votre abonnement.'
                });
            }

            const plan = PLANS[subscription.plan];
            
            if (type === 'product') {
                const Product = require('../models/Product');
                const productCount = await Product.countDocuments({ 
                    companyId: req.user.companyId,
                    isActive: true 
                });
                
                if (productCount >= plan.maxProducts) {
                    return res.status(403).json({
                        success: false,
                        message: `Limite de produits atteinte (${plan.maxProducts}). Passez à un plan supérieur.`
                    });
                }
            }
            
            if (type === 'employee') {
                const employeeCount = await User.countDocuments({ 
                    companyId: req.user.companyId,
                    role: 'employee',
                    isActive: true 
                });
                
                if (employeeCount >= plan.maxEmployees) {
                    return res.status(403).json({
                        success: false,
                        message: `Limite d'employés atteinte (${plan.maxEmployees}). Passez à un plan supérieur.`
                    });
                }
            }
            
            next();
        } catch (error) {
            console.error('❌ Erreur vérification limites:', error);
            next();
        }
    };
};

/**
 * @desc    Vérifier l'expiration des abonnements (cron job)
 */
exports.checkExpiredSubscriptions = async () => {
    try {
        const expired = await Subscription.find({
            endDate: { $lt: new Date() },
            status: { $in: ['active', 'trial'] }
        });

        for (const sub of expired) {
            sub.status = 'expired';
            await sub.save();
            
            await Company.findByIdAndUpdate(sub.companyId, { isActive: false });
        }
        
        if (expired.length > 0) {
            console.log(`📅 ${expired.length} abonnement(s) expiré(s) désactivé(s)`);
        }
    } catch (error) {
        console.error('❌ Erreur vérification expiration:', error);
    }
};