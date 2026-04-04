/**
 * CONTRÔLEUR PAIEMENT - Stripe etat test
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Company = require('../models/Company');

// Plans d'abonnement
const PLANS = {
    basic: {
        name: 'Basic',
        price: 50000,
        currency: 'GNF',
        duration: 30,
        description: '500 produits, 10 employés, rapports PDF'
    },
    premium: {
        name: 'Premium',
        price: 100000,
        currency: 'GNF',
        duration: 30,
        description: '2000 produits, 30 employés, statistiques avancées'
    },
    enterprise: {
        name: 'Enterprise',
        price: 250000,
        currency: 'GNF',
        duration: 30,
        description: 'Illimité, API, support prioritaire'
    }
};

/**
 * @desc    Créer une session de paiement Stripe
 * @route   POST /api/payment/create-checkout-session
 * @access  Private
 */
exports.createCheckoutSession = async (req, res) => {
    try {
        const { plan } = req.body;
        
        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'Plan invalide'
            });
        }

        const planData = PLANS[plan];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: planData.currency.toLowerCase(),
                        product_data: {
                            name: `StockMedi - ${planData.name}`,
                            description: planData.description
                        },
                        unit_amount: planData.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?success=true&plan=${plan}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?canceled=true`,
            metadata: {
                companyId: req.user.companyId.toString(),
                plan: plan,
                userId: req.user.id.toString()
            }
        });

        // ✅ CORRECTION : Ajout de l'URL dans la réponse
        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('❌ Erreur création session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la session de paiement',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer la clé publique Stripe
 * @route   GET /api/payment/config
 * @access  Private
 */
exports.getStripeConfig = async (req, res) => {
    res.json({
        success: true,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
};

/**
 * @desc    Webhook Stripe (pour confirmer le paiement)
 * @route   POST /api/payment/webhook
 * @access  Public
 */
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Si pas de webhook secret, on simule
    if (!endpointSecret) {
        console.log('⚠️ Webhook secret non configuré, paiement simulé');
        
        // Pour le webhook simulé, le body est déjà parsé
        const session = req.body;
        if (session.type === 'checkout.session.completed') {
            const { companyId, plan } = session.data.object.metadata;
            await activateSubscription(companyId, plan);
        }
        
        return res.json({ received: true });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('❌ Erreur webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { companyId, plan } = session.metadata;
        await activateSubscription(companyId, plan);
    }

    res.json({ received: true });
};

// Fonction pour activer l'abonnement après paiement
async function activateSubscription(companyId, plan) {
    try {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        let subscription = await Subscription.findOne({ companyId });
        
        if (subscription) {
            subscription.plan = plan;
            subscription.status = 'active';
            subscription.endDate = endDate;
            subscription.autoRenew = false;
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                companyId,
                plan,
                status: 'active',
                endDate,
                trialUsed: true
            });
        }

        // Mettre à jour l'entreprise
        const company = await Company.findById(companyId);
        if (company) {
            company.subscription.plan = plan;
            company.subscription.status = 'active';
            company.subscription.endDate = endDate;
            await company.save();
        }

        console.log('✅ Abonnement activé pour', companyId, ':', plan);
    } catch (error) {
        console.error('❌ Erreur activation abonnement:', error);
    }
}