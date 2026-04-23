/**
 * Middleware de sécurité pour le serveur de développement React
 * Protection anti-clickjacking
 */
module.exports = function(app) {
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    });
};