/**
 * CONTRÔLEUR DEVIS - Gestion des devis / proformas
 * Indépendant du module Vente
 */

const Quote = require('../models/Quote');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Establishment = require('../models/Establishment');
const mongoose = require('mongoose');

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

        // Vérifier l'établissement si nécessaire
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
        const quoteNumber = await Quote.generateQuoteNumber(req.user.companyId);

        const quote = await Quote.create({
            companyId: req.user.companyId,
            establishmentId: establishmentId && establishmentId !== '' ? establishmentId : null,
            quoteNumber,
            items: quoteItems,
            subtotal,
            discount: discountAmount,
            discountType: discountType || 'fixed',
            total,
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            prescriptionNumber: prescriptionNumber || '',
            notes: notes || '',
            userId: req.user.id,
            status: 'sent' // ⭐ Créé directement en statut 'sent'
        });

        await quote.populate('userId', 'firstName lastName');
        await quote.populate('establishmentId', 'name');

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

        // Ajouter manuellement canBeConverted et isExpired
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

        // Ajouter manuellement les virtuels
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

        // Vérifier si convertible
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