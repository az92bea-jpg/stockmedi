/**
 * CONTRÔLEUR DEVIS - Gestion des devis / proformas
 * Indépendant du module Vente
 */

const Quote = require('../models/Quote');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Establishment = require('../models/Establishment');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');
const { auditLog } = require('../services/auditService');


// ==================== FONCTIONS UTILITAIRES ====================

// Fonction pour générer le numéro de devis (ATOMIQUE avec Counter)
async function generateQuoteNumber(companyId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `DEV-${year}${month}${day}`;
    
    const counterId = `quote-${prefix}-${companyId}`;
    
    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    
    const sequence = String(counter.seq).padStart(4, '0');
    return `${prefix}-${sequence}`;
}

// Créer un devis avec retry automatique
async function createQuoteWithRetry(quoteData, userId, companyId, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const quoteNumber = await generateQuoteNumber(companyId);
            
            const quote = await Quote.create({
                ...quoteData,
                companyId,
                quoteNumber,
                userId
            });
            
            return { success: true, quote };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern?.quoteNumber) {
                console.log(`⚠️ Doublon devis détecté, nouvelle tentative (${attempt + 1}/${maxRetries})...`);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Impossible de générer un numéro de devis unique après plusieurs tentatives');
}

// ==================== CRUD DEVIS ====================

/**
 * @desc    Créer un nouveau devis
 * @route   POST /api/quotes
 * @access  Private
 */
exports.createQuote = async (req, res) => {
    try {
        const {
            items,
            discount,
            discountType,
            customerName,
            customerPhone,
            prescriptionNumber,
            notes,
            establishmentId
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins un produit est requis'
            });
        }

        const userEstablishments = await Establishment.find({ companyId: req.user.companyId });
        const hasEstablishments = userEstablishments.length > 0;

        if (hasEstablishments && (!establishmentId || establishmentId === '')) {
            return res.status(400).json({
                success: false,
                message: 'Établissement requis pour le devis'
            });
        }

        let establishment = null;
        if (establishmentId && establishmentId !== '') {
            establishment = await Establishment.findOne({
                _id: establishmentId,
                companyId: req.user.companyId
            });
            if (!establishment) {
                return res.status(400).json({
                    success: false,
                    message: 'Établissement non trouvé'
                });
            }
        }

        let subtotal = 0;
        const quoteItems = [];

        for (const item of items) {
            const product = await Product.findOne({
                _id: item.productId,
                companyId: req.user.companyId,
                isActive: true
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Produit ${item.productId} non trouvé`
                });
            }

            const unitPrice = item.unitPrice || product.sellingPrice;
            const subtotalItem = unitPrice * item.quantity;

            quoteItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                unitPrice: unitPrice,
                subtotal: subtotalItem
            });

            subtotal += subtotalItem;
        }

        let discountAmount = discount || 0;
        if (discountType === 'percentage') {
            discountAmount = (subtotal * discount) / 100;
        }

        const total = Math.max(0, subtotal - discountAmount);

        const quoteData = {
            establishmentId: establishmentId && establishmentId !== '' ? establishmentId : null,
            items: quoteItems,
            subtotal,
            discount: discountAmount,
            discountType: discountType || 'fixed',
            total,
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            prescriptionNumber: prescriptionNumber || '',
            notes: notes || '',
            status: 'sent'
        };

        const result = await createQuoteWithRetry(quoteData, req.user.id, req.user.companyId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du devis'
            });
        }

        const quote = result.quote;

        await quote.populate('userId', 'firstName lastName');
        await quote.populate('establishmentId', 'name');


        // Audit Trail CREATE QUOTE
        await auditLog({
            companyId: req.user.companyId,
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action: 'create',
            documentType: 'quote',
            documentId: quote._id,
            documentName: quote.quoteNumber,
            description: `Devis créé : ${quote.quoteNumber}`
        });

        res.status(201).json({
            success: true,
            quote
        });
    } catch (error) {
        console.error('❌ Erreur création devis:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du devis',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer tous les devis
 * @route   GET /api/quotes
 * @access  Private
 */
exports.getQuotes = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = { companyId: req.user.companyId, isActive: true };
        if (status) query.status = status;

        const quotes = await Quote.find(query)
            .populate('userId', 'firstName lastName')
            .populate('establishmentId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean({ virtuals: true });

        const quotesWithVirtuals = quotes.map(quote => {
            const isExpired = new Date(quote.validUntil) < new Date();
            const isValidStatus = quote.status === 'sent' || quote.status === 'draft';
            const canBeConverted = isValidStatus && !quote.convertedToSaleId && !isExpired;
            
            return {
                ...quote,
                isExpired,
                canBeConverted
            };
        });

        const total = await Quote.countDocuments(query);

        res.json({
            success: true,
            quotes: quotesWithVirtuals,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
        });
    } catch (error) {
        console.error('❌ Erreur récupération devis:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des devis',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer un devis par ID
 * @route   GET /api/quotes/:id
 * @access  Private
 */
exports.getQuote = async (req, res) => {
    try {
        const quote = await Quote.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        })
        .populate('userId', 'firstName lastName email')
        .populate('items.productId', 'name barcode sellingPrice')
        .populate('establishmentId', 'name address phone email')
        .populate('companyId', 'name logo address phone email')
        .lean({ virtuals: true });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé'
            });
        }

        const isExpired = new Date(quote.validUntil) < new Date();
        const isValidStatus = quote.status === 'sent' || quote.status === 'draft';
        const canBeConverted = isValidStatus && !quote.convertedToSaleId && !isExpired;

        res.json({
            success: true,
            quote: {
                ...quote,
                isExpired,
                canBeConverted
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération devis:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du devis',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour un devis
 * @route   PUT /api/quotes/:id
 * @access  Private
 */
exports.updateQuote = async (req, res) => {
    try {
        const { customerName, customerPhone, prescriptionNumber, notes, status } = req.body;

        const quote = await Quote.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé'
            });
        }

        if (quote.status === 'converted') {
            return res.status(400).json({
                success: false,
                message: 'Un devis converti en vente ne peut plus être modifié'
            });
        }

        if (customerName !== undefined) quote.customerName = customerName;
        if (customerPhone !== undefined) quote.customerPhone = customerPhone;
        if (prescriptionNumber !== undefined) quote.prescriptionNumber = prescriptionNumber;
        if (notes !== undefined) quote.notes = notes;
        if (status) quote.status = status;

        await quote.save();

        res.json({
            success: true,
            quote
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour devis:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du devis',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un devis (soft delete)
 * @route   DELETE /api/quotes/:id
 * @access  Private
 */
exports.deleteQuote = async (req, res) => {
    try {
        const quote = await Quote.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé'
            });
        }

        quote.isActive = false;
        await quote.save();

        res.json({
            success: true,
            message: 'Devis supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression devis:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du devis',
            error: error.message
        });
    }
};

/**
 * @desc    Convertir un devis en vente
 * @route   POST /api/quotes/:id/convert
 * @access  Private
 */
exports.convertQuoteToSale = async (req, res) => {
    try {
        const quote = await Quote.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'Devis non trouvé'
            });
        }

        const isExpired = new Date(quote.validUntil) < new Date();
        const isValidStatus = quote.status === 'sent' || quote.status === 'draft';
        const canBeConverted = isValidStatus && !quote.convertedToSaleId && !isExpired;

        if (!canBeConverted) {
            return res.status(400).json({
                success: false,
                message: 'Ce devis ne peut pas être converti en vente (déjà converti ou expiré)'
            });
        }

        const sale = await quote.convertToSale(req.user.id);

        await sale.populate('userId', 'firstName lastName');
        await sale.populate('establishmentId', 'name');

        // Audit
        await auditLog({
            companyId: req.user.companyId,
            userId: req.user.id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            action: 'update',
            documentType: 'quote',
            documentId: quote._id,
            documentName: quote.quoteNumber,
            description: `Devis converti en vente : ${quote.quoteNumber}`
        });


        res.json({
            success: true,
            message: 'Devis converti en vente avec succès',
            sale,
            quote
        });
    } catch (error) {
        console.error('❌ Erreur conversion devis:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la conversion du devis',
            error: error.message
        });
    }
};