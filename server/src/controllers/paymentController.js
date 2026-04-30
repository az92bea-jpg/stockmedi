/**
 * CONTRÔLEUR PAIEMENT - Stripe (paiements en EUR)
 * Conforme à Stripe : devise EUR, prix en centimes
 * Support paiement local / Mobile Money
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Company = require('../models/Company');

// Plans d'abonnement - Prix en EUR (centimes)
const PLANS = {
    basic: {
        name: 'Basic',
        price: 899, // 8,99 EUR
        currency: 'eur',
        duration: 30,
        description: '500 produits, 10 employés, rapports PDF',
        features: ['stock_basic', 'sales_basic', 'reports_basic', 'pdf_exports', 'employees', 'quotes', 'receipt']
    },
    premium: {
        name: 'Premium',
        price: 1899, // 18,99 EUR
        currency: 'eur',
        duration: 30,
        description: '2000 produits, 30 employés, statistiques avancées',
        features: ['stock_advanced', 'sales_advanced', 'reports_advanced', 'pdf_exports', 'employees', 'advanced_stats', 'quotes', 'receipt']
    },
    enterprise: {
        name: 'Enterprise',
        price: 4799, // 47,99 EUR
        currency: 'eur',
        duration: 30,
        description: 'Illimité, API, support prioritaire',
        features: ['stock_advanced', 'sales_advanced', 'reports_advanced', 'pdf_exports', 'employees', 'advanced_stats', 'multiple_locations', 'api_access', 'quotes', 'receipt','priority_support']
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
                        currency: planData.currency,
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
    
    if (!endpointSecret) {
        console.log('⚠️ Webhook secret non configuré, paiement simulé');
        
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

/**
 * @desc    Soumettre une demande de paiement local
 * @route   POST /api/payment/local-request
 * @access  Private
 */
exports.submitLocalPaymentRequest = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            companyName,
            plan,
            country,
            contactMethod,
            message
        } = req.body;

        // Validation
        if (!fullName || !email || !phone || !companyName || !plan || !country) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        const planData = PLANS[plan];
        if (!planData) {
            return res.status(400).json({
                success: false,
                message: 'Plan invalide'
            });
        }

        const planPrice = planData.price / 100; // Conversion centimes → euros

        // Construire le contenu de l'email pour l'admin
        const adminEmailContent = `
            <h2>📱 Nouvelle demande de paiement local</h2>
            <hr />
            <h3>Informations client</h3>
            <ul>
                <li><strong>Nom complet :</strong> ${fullName}</li>
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Téléphone :</strong> ${phone}</li>
                <li><strong>Entreprise :</strong> ${companyName}</li>
                <li><strong>Pays :</strong> ${country}</li>
            </ul>
            <h3>Détails de l'abonnement</h3>
            <ul>
                <li><strong>Plan choisi :</strong> ${planData.name}</li>
                <li><strong>Prix :</strong> ${planPrice} € / mois</li>
                <li><strong>Mode de contact préféré :</strong> ${contactMethod === 'email' ? 'Email' : 'WhatsApp'}</li>
            </ul>
            ${message ? `<h3>Message du client</h3><p>${message}</p>` : ''}
            <hr />
            <p><em>Cette demande a été envoyée depuis le formulaire de paiement local StockMedi.</em></p>
        `;

        // Construire le contenu de l'email pour le client
        const clientEmailContent = `
            <h2>✅ Votre demande a bien été reçue !</h2>
            <p>Bonjour ${fullName.split(' ')[0]},</p>
            <p>Nous avons bien reçu votre demande d'abonnement au plan <strong>${planData.name}</strong> (${planPrice} €/mois).</p>
            <p>Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez une notification par ${contactMethod === 'email' ? 'email' : 'WhatsApp'} avec les instructions pour finaliser votre paiement par Mobile Money.</p>
            <p><strong>Numéros Mobile Money :</strong> +224 623679567 / +224 660947398</p>
            <p><em>Veuillez attendre notre confirmation avant d'effectuer le paiement.</em></p>
            <hr />
            <p>Merci de votre confiance,</p>
            <p><strong>L'équipe StockMedi</strong></p>
            <p><small>Cet email est automatique, merci de ne pas y répondre.</small></p>
        `;

    // ========== Envoyer l'email à l'admin(utilise resend) ==========

        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const adminEmail = process.env.ADMIN_EMAIL || 'stockmedi.contact@gmail.com';
        await resend.emails.send({
            from: 'StockMedi <onboarding@resend.dev>',
            to: adminEmail,
            replyTo: email,
            subject: `📱 [StockMedi] Demande de paiement local - ${fullName} - ${planData.name}`,
            html: adminEmailContent
        });
        // Envoyer l'email de confirmation au client
        await resend.emails.send({
            from: 'StockMedi <onboarding@resend.dev>',
            to: email,
            subject: `✅ [StockMedi] Confirmation de votre demande d'abonnement`,
            html: clientEmailContent
        });
      

        console.log(`📧 Email envoyé à l'admin (${adminEmail}) et au client (${email})`);

        // Notification WhatsApp à l'admin (si configuré)
        if (contactMethod === 'whatsapp' && process.env.ADMIN_WHATSAPP) {
            // Optionnel : intégrer l'API WhatsApp Business
            console.log(`📱 Notification WhatsApp à envoyer à ${process.env.ADMIN_WHATSAPP}`);
        }

        res.status(200).json({
            success: true,
            message: 'Demande envoyée avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur soumission paiement local:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la demande'
        });
    }
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