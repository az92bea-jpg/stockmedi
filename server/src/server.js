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

// Chargement des variables d'environnement
dotenv.config();

// Initialisation
const app = express();

// ========== MIDDLEWARES (sauf JSON) ==========
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

// ⚠️ IMPORTANT : Route webhook avec raw body (AVANT express.json())
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Route paiement (sans raw body, utilise le router)
app.use('/api/payment', paymentRoutes);

// ========== PARSER JSON POUR LES AUTRES ROUTES ==========
app.use(express.json());

// Routes API normales
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', logsRoutes);

// ========== ROUTE DE TEST ==========
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