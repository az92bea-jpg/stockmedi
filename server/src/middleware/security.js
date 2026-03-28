/**
 * MIDDLEWARE DE SÉCURITÉ
 */

const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Protection XSS
const xssProtection = xss();

// Protection injection MongoDB
const sanitize = mongoSanitize();

// Rate limiting avancé
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Trop de requêtes, veuillez réessayer après 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives de connexion, veuillez réessayer après 15 minutes',
    skipSuccessfulRequests: true
});

module.exports = {
    xssProtection,
    sanitize,
    apiLimiter,
    authLimiter
};