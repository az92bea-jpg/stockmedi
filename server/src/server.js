/**
 * STOCKMEDI - SERVEUR PRINCIPAL
 * Point d'entrée de l'application backend
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');


// Chargement des variables d'environnement
dotenv.config();

// Initialisation
const app = express();

// ========== MIDDLEWARES DE BASE ==========
app.use(helmet());           
app.use(cors());             
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




// ⭐ CRON JOBS (notifications email + nettoyage archives)
/* require('./utils/cronJobs');  // charger resend */

// Import du contrôleur pour le nettoyage automatique
const { cleanupExpiredArchives } = require('./controllers/archiveController');

// ========== ROUTE WEBHOOK (raw body, AVANT express.json()) ==========
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    require('./controllers/paymentController').stripeWebhook(req, res);
});

// ========== PARSER JSON POUR TOUTES LES AUTRES ROUTES ==========
app.use(express.json());

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
app.use('/api/cron', cronRoutes);


// ========== NETTOYAGE AUTOMATIQUE DES ARCHIVES (CRON) ==========
// S'exécute tous les jours à 2h du matin (heure du serveur)
cron.schedule('0 2 * * *', async () => {
    console.log('🕒 Nettoyage automatique des archives...');
    const deletedCount = await cleanupExpiredArchives();
    console.log(`✅ Nettoyage terminé : ${deletedCount} archive(s) supprimée(s)`);
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