/**
 * MIDDLEWARE DE SÉCURITÉ
 * Protection complète : Rate Limiting, NoSQL Injection
 */

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// ==================== RATE LIMITING ====================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Trop de requêtes. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Trop de requêtes. Ralentissez.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Limite de requêtes atteinte. Réessayez dans une minute.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ==================== PROTECTION INJECTIONS ====================

const sanitize = mongoSanitize();

// ==================== EXPORTS ====================

module.exports = {
    loginLimiter,
    authLimiter,
    apiLimiter,
    strictLimiter,
    sanitize
};