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

// ⭐ Vérifier l'accès à un établissement spécifique
const hasEstablishmentAccess = (req, res, next) => {
    // Owner et super-admin ont accès à tout
    if (req.user.role === 'owner' || req.user.role === 'super-admin') {
        return next();
    }
    
    // Récupérer l'ID de l'établissement depuis les paramètres ou le body
    const establishmentId = req.params.establishmentId || req.body.establishmentId || req.query.establishmentId;
    
    // Si pas d'établissement spécifié, on laisse passer (sera filtré plus tard)
    if (!establishmentId) {
        return next();
    }
    
    // Vérifier si l'employé a accès à cet établissement
    if (!req.user.hasAccessToEstablishment(establishmentId)) {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé à cet établissement'
        });
    }
    
    next();
};

module.exports = { protect, authorize, hasPermission, hasEstablishmentAccess };