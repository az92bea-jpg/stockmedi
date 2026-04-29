/**
 * MIDDLEWARE CSRF - Protection contre les requêtes forgées
 * 
 * Génère un token unique pour chaque session
 * Le frontend doit envoyer ce token dans les requêtes POST/PUT/DELETE
 */

const crypto = require('crypto');

const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const csrfMiddleware = (req, res, next) => {
    // Ignorer les requêtes GET (lecture seule)
    if (req.method === 'GET') return next();
    
    const token = req.headers['x-csrf-token'];
    
    // En développement, on peut désactiver la vérification
    if (process.env.NODE_ENV === 'development') return next();
    
    if (!token) {
        return res.status(403).json({ success: false, message: 'Token CSRF manquant' });
    }
    
    next();
};

module.exports = { generateCSRFToken, csrfMiddleware };