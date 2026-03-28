/**
 * VALIDATEURS DE DONNÉES
 */

const { body, validationResult } = require('express-validator');

// Validation inscription
const validateRegister = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail()
        .notEmpty().withMessage('Email requis'),
    body('password')
        .isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6 caractères)')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une lettre et un chiffre'),
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
                errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }
        next();
    }
];

// Validation produit
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
            if (value < req.body.purchasePrice) {
                throw new Error('Le prix de vente ne peut pas être inférieur au prix d\'achat');
            }
            return true;
        }),
    body('expirationDate')
        .isISO8601().withMessage('Date invalide')
        .custom(value => {
            if (new Date(value) < new Date()) {
                throw new Error('La date d\'expiration ne peut pas être dans le passé');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }
        next();
    }
];

module.exports = {
    validateRegister,
    validateProduct
};