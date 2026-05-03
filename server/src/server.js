/**
 * STOCKMEDI - SERVEUR PRINCIPAL
 * Point d'entrée de l'application backend
 * Sécurité renforcée : Helmet CSP, Rate Limiting, Sanitization
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');


require('./cron/cronjobs'); // Activer les notifications automatiques




// Chargement des variables d'environnement
dotenv.config();

// Initialisation
const app = express();
// Fix rate limiter sur Render (proxy)
app.set('trust proxy', 1);

// ========== MIDDLEWARES DE SÉCURITÉ ==========
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));

// CORS restrictif
app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (!origin || origin === allowed) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// ========== CONNEXION MONGODB ==========
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => console.error('❌ Erreur MongoDB:', err));

// ========== ROUTES ==========
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logsRoutes = require('./routes/logsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const userRoutes = require('./routes/userRoutes');
const cronRoutes = require('./routes/cronRoutes');
const patientRecordRoutes = require('./routes/patientRecordRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Import du contrôleur pour le nettoyage automatique
const { cleanupExpiredArchives } = require('./controllers/archiveController');

// ========== ROUTE WEBHOOK (raw body, AVANT express.json()) ==========
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    require('./controllers/paymentController').stripeWebhook(req, res);
});

// ========== PARSER JSON ==========
app.use(express.json({ limit: '10kb' }));

// ========== SANITIZATION NOSQL (COMPATIBLE EXPRESS 5) ==========
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
            // Supprimer les caractères dangereux pour MongoDB
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                sanitize(obj[key]);
            }
        });
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) {
        const sanitizedQuery = { ...req.query };
        sanitize(sanitizedQuery);
        req.query = sanitizedQuery;
    }
    if (req.params) sanitize(req.params);
    
    next();
});

// ========== TOUTES LES ROUTES API ==========
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRecordRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/audit', auditRoutes);

// ========== NETTOYAGE AUTOMATIQUE DES ARCHIVES (CRON) ==========
cron.schedule('0 2 * * *', async () => {
    console.log('🕒 Nettoyage automatique des archives...');
    try {
        const deletedCount = await cleanupExpiredArchives();
        console.log(`✅ Nettoyage terminé : ${deletedCount} archive(s) supprimée(s)`);
    } catch (error) {
        console.error('❌ Erreur nettoyage archives:', error);
    }
});

// ========== ROUTE DE TEST (health check) ==========
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'StockMedi API fonctionne',
        timestamp: new Date().toISOString()
    });
});

// ========== DÉMARRAGE ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════
    🚀 StockMedi Server démarré!
    📡 Port: ${PORT}
    🔗 http://localhost:${PORT}
    ═══════════════════════════════════════
    `);
});