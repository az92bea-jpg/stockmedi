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

// ========== MIDDLEWARES ==========
app.use(helmet());           // Sécurité
app.use(cors());             // Autoriser le frontend
app.use(express.json());     // Parser JSON
app.use(morgan('dev'));      // Logs

// ========== CONNEXION MONGODB ==========
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => console.error('❌ Erreur MongoDB:', err));

/// ========== ROUTES ==========
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

// Routes API
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

// Route Stripe (la ligne suivante est la BONNE, ne pas en ajouter d'autre)
app.use('/api/payment', paymentRoutes);

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