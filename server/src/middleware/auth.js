const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Non autorisé' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
};

// Vérifier les rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Rôle '${req.user.role}' non autorisé pour cette action`
            });
        }
        next();
    };
};

// Vérifier les permissions
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (req.user.role === 'super-admin' || req.user.role === 'owner') {
            return next();
        }
        
        if (req.user.permissions && req.user.permissions.includes(permission)) {
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: `Permission '${permission}' requise`
        });
    };
};

module.exports = { protect, authorize, hasPermission };