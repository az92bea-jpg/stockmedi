/**
 * VALIDATEURS DE DONNÉES
 * Validation renforcée des entrées utilisateur
 */

const { body, validationResult } = require('express-validator');

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Validation du mot de passe fort
 * @param {string} password - Mot de passe à valider
 * @returns {object} - { isValid, errors }
 */
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    if (password.length < minLength) errors.push('8 caractères minimum');
    if (!hasUpperCase) errors.push('une majuscule');
    if (!hasLowerCase) errors.push('une minuscule');
    if (!hasNumbers) errors.push('un chiffre');
    if (!hasSpecialChar) errors.push('un caractère spécial');
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ==================== MIDDLEWARES DE VALIDATION ====================

/**
 * Middleware de validation pour l'inscription (express-validator)
 */
const validateRegister = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .notEmpty().withMessage('Email requis'),
    
    body('password')
        .isLength({ min: 8 }).withMessage('Mot de passe trop court (min 8 caractères)')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
        .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    
    body('firstName')
        .notEmpty().withMessage('Prénom requis')
        .isLength({ max: 50 }).withMessage('Prénom trop long')
        .trim(),
    
    body('lastName')
        .notEmpty().withMessage('Nom requis')
        .isLength({ max: 50 }).withMessage('Nom trop long')
        .trim(),
    
    body('companyName')
        .notEmpty().withMessage('Nom entreprise requis')
        .trim(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: errors.array()[0].msg,
                errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }
        next();
    }
];

/**
 * Middleware de validation pour changement de mot de passe
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty().withMessage('Mot de passe actuel requis'),
    
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Mot de passe trop court (min 8 caractères)')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
        .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Les mots de passe ne correspondent pas'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: errors.array()[0].msg
            });
        }
        next();
    }
];

/**
 * Middleware de validation pour les produits
 */
const validateProduct = [
    body('name')
        .notEmpty().withMessage('Nom du produit requis')
        .trim()
        .isLength({ max: 200 }).withMessage('Nom trop long'),
    
    body('purchasePrice')
        .isFloat({ min: 0 }).withMessage('Prix d\'achat invalide'),
    
    body('sellingPrice')
        .isFloat({ min: 0 }).withMessage('Prix de vente invalide')
        .custom((value, { req }) => {
            if (parseFloat(value) < parseFloat(req.body.purchasePrice)) {
                throw new Error('Le prix de vente ne peut pas être inférieur au prix d\'achat');
            }
            return true;
        }),
    
    body('expirationDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Date d\'expiration invalide')
        .custom(value => {
            if (value && new Date(value) < new Date()) {
                throw new Error('La date d\'expiration ne peut pas être dans le passé');
            }
            return true;
        }),
    
    body('quantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Quantité invalide'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: errors.array()[0].msg,
                errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }
        next();
    }
];

/**
 * Middleware de validation pour les ventes
 */
const validateSale = [
    body('items')
        .isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
    
    body('items.*.productId')
        .notEmpty().withMessage('ID produit requis'),
    
    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Quantité doit être supérieure à 0'),
    
    body('paymentMethod')
        .isIn(['cash', 'card', 'mobile_money', 'mixed']).withMessage('Mode de paiement invalide'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: errors.array()[0].msg
            });
        }
        next();
    }
];

// ==================== EXPORTS ====================

module.exports = {
    validatePasswordStrength,
    validateRegister,
    validatePasswordChange,
    validateProduct,
    validateSale
};