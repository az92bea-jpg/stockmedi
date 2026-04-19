/**
 * CONTRÔLEUR VENTES
 * ⭐ Support filtrage par établissements accessibles (employés)
 */

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Establishment = require('../models/Establishment');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');

// ==================== FONCTIONS UTILITAIRES ====================

// Fonction pour générer le numéro de vente (ATOMIQUE)
async function generateSaleNumber(companyId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `${year}${month}${day}`;
    
    const counterId = `sale-${prefix}-${companyId}`;
    
    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    
    const sequence = String(counter.seq).padStart(4, '0');
    return `SALE-${prefix}-${sequence}`;
}

// Créer une vente avec retry automatique en cas de doublon
async function createSaleWithRetry(saleData, userId, companyId, maxRetries = 5) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const saleNumber = await generateSaleNumber(companyId);
            
            const sale = await Sale.create({
                ...saleData,
                companyId,
                saleNumber,
                userId
            });
            
            return { success: true, sale };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern?.saleNumber) {
                console.log(`⚠️ Doublon détecté, nouvelle tentative (${attempt + 1}/${maxRetries})...`);
                continue;
            }
            throw error;
        }
    }
    
    throw new Error('Impossible de générer un numéro de vente unique après plusieurs tentatives');
}

// ==================== CONTRÔLEURS ====================

/**
 * @desc    Créer une nouvelle vente
 * ⭐ Vérification de l'accès à l'établissement
 */
exports.createSale = async (req, res) => {
    try {
        const { 
            items, 
            discount, 
            discountType, 
            paymentMethod, 
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
                message: 'Établissement requis pour la vente'
            });
        }

        // ⭐ Vérifier l'accès à l'établissement pour les employés
        if (establishmentId && establishmentId !== '') {
            if (!req.user.hasAccessToEstablishment(establishmentId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet établissement'
                });
            }
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

        const company = await Company.findById(req.user.companyId);
        const taxRate = (company?.settings?.taxRate || 18) / 100;

        let subtotal = 0;
        const saleItems = [];

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

            // ⭐ Vérifier l'accès au produit (via son établissement)
            if (product.establishmentId && !req.user.hasAccessToEstablishment(product.establishmentId)) {
                return res.status(403).json({
                    success: false,
                    message: `Accès refusé au produit ${product.name}`
                });
            }

            const canSell = product.canBeSold(item.quantity);
            if (!canSell.can) {
                return res.status(400).json({
                    success: false,
                    message: `Impossible de vendre ${product.name}: ${canSell.reason}`
                });
            }

            const unitPrice = item.unitPrice || product.sellingPrice;
            const subtotalItem = unitPrice * item.quantity;

            saleItems.push({
                productId: product._id,
                name: product.name,
                batchNumber: product.batchNumber,
                quantity: item.quantity,
                unitPrice: unitPrice,
                subtotal: subtotalItem
            });

            subtotal += subtotalItem;

            await product.sell(item.quantity, req.user.id, null);
        }

        let discountAmount = discount || 0;
        if (discountType === 'percentage') {
            discountAmount = (subtotal * discount) / 100;
        }

        const taxAmount = (subtotal - discountAmount) * taxRate;
        const total = subtotal - discountAmount + taxAmount;

        const saleData = {
            establishmentId: establishmentId && establishmentId !== '' ? establishmentId : null,
            items: saleItems,
            subtotal,
            discount: discountAmount,
            discountType: discountType || 'fixed',
            tax: taxAmount,
            total,
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: 'paid',
            customerName,
            customerPhone,
            prescriptionNumber,
            notes,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        const result = await createSaleWithRetry(saleData, req.user.id, req.user.companyId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la vente'
            });
        }

        const sale = result.sale;

        await sale.populate('userId', 'firstName lastName email');
        await sale.populate('establishmentId', 'name address phone email');
        await sale.populate('companyId', 'name logo address phone email');

        res.status(201).json({
            success: true,
            sale
        });
    } catch (error) {
        console.error('❌ Erreur création vente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la vente',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer toutes les ventes
 * Filtrage par établissements accessibles pour les employés
 */
exports.getSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, paymentStatus } = req.query;

        const query = { companyId: req.user.companyId };

        // ⭐ Filtrer par établissements accessibles
        const accessibleIds = req.user.getAccessibleEstablishmentIds();
        if (accessibleIds !== null) {
            if (accessibleIds.length === 0) {
                return res.json({
                    success: true,
                    sales: [],
                    totals: { totalAmount: 0, totalDiscount: 0, totalTax: 0, count: 0 },
                    page: parseInt(page),
                    pages: 0
                });
            }
            // ⭐ CORRECTION 1 : Convertir en ObjectId
            query.establishmentId = { $in: accessibleIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        // ⭐ CORRECTION 2 : Gérer le fuseau horaire pour les dates
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                // Début de journée en UTC
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (endDate) {
                // Fin de journée en UTC
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        
        if (paymentStatus) query.paymentStatus = paymentStatus;

        console.log('📊 Query getSales:', JSON.stringify(query, null, 2));

        const sales = await Sale.find(query)
            .populate('userId', 'firstName lastName')
            .populate('establishmentId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Sale.countDocuments(query);

        console.log('📊 Sales trouvées:', sales.length);

        const totals = await Sale.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$total' },
                    totalDiscount: { $sum: '$discount' },
                    totalTax: { $sum: '$tax' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            sales,
            totals: totals[0] || { totalAmount: 0, totalDiscount: 0, totalTax: 0, count: 0 },
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('❌ Erreur récupération ventes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des ventes',
            error: error.message
        });
    }
};
/**
 * @desc    Récupérer une vente par ID
 * ⭐ Vérification de l'accès à l'établissement
 */
exports.getSale = async (req, res) => {
    try {
        const sale = await Sale.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        }).populate('userId', 'firstName lastName email')
          .populate('items.productId', 'name barcode')
          .populate('establishmentId', 'name address phone email')
          .populate('companyId', 'name logo address phone email');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Vente non trouvée'
            });
        }

        // ⭐ Vérifier l'accès à l'établissement de la vente
        if (sale.establishmentId && !req.user.hasAccessToEstablishment(sale.establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cette vente'
            });
        }

        res.json({
            success: true,
            sale
        });
    } catch (error) {
        console.error('❌ Erreur récupération vente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la vente',
            error: error.message
        });
    }
};

/**
 * @desc    Annuler une vente
 * ⭐ Vérification de l'accès à l'établissement
 */
exports.cancelSale = async (req, res) => {
    try {
        const { reason } = req.body;

        const sale = await Sale.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Vente non trouvée'
            });
        }

        // ⭐ Vérifier l'accès à l'établissement
        if (sale.establishmentId && !req.user.hasAccessToEstablishment(sale.establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cette vente'
            });
        }

        if (sale.isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Cette vente est déjà annulée'
            });
        }

        await sale.cancel(req.user.id, reason);

        res.json({
            success: true,
            message: 'Vente annulée avec succès',
            sale
        });
    } catch (error) {
        console.error('❌ Erreur annulation vente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation de la vente',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les statistiques des ventes
 * Filtrage par établissements accessibles
 */
exports.getSalesStats = async (req, res) => {
    try {
        const { establishmentId } = req.query;
        
        const matchQuery = { 
            companyId: req.user.companyId
        };
        
        // ⭐ Filtrer par établissements accessibles
        if (establishmentId) {
            // Vérifier l'accès si un établissement spécifique est demandé
            if (!req.user.hasAccessToEstablishment(establishmentId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet établissement'
                });
            }
            matchQuery.establishmentId = new mongoose.Types.ObjectId(establishmentId);
        } else {
            // Sans établissement spécifié
            const accessibleIds = req.user.getAccessibleEstablishmentIds();
            
            // Owner / Super-admin : voir TOUTES les ventes
            if (req.user.role === 'owner' || req.user.role === 'super-admin') {
                // Ne pas filtrer
            } else if (accessibleIds !== null) {
                // Employé avec restrictions
                if (accessibleIds.length === 0) {
                    return res.json({
                        success: true,
                        stats: {
                            daily: { total: 0, count: 0 },
                            monthly: { total: 0, count: 0 },
                            yearly: { total: 0, count: 0 },
                            topProducts: []
                        }
                    });
                }
                //Convertir en ObjectId
                matchQuery.establishmentId = { $in: accessibleIds.map(id => new mongoose.Types.ObjectId(id)) };
            }
            // Si accessibleIds === null → employé sans restriction → pas de filtre
        }

        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
        const stats = {};

        const dailySales = await Sale.aggregate([
            { $match: { ...matchQuery, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);
        stats.daily = dailySales[0] || { total: 0, count: 0 };

        const monthlySales = await Sale.aggregate([
            { $match: { ...matchQuery, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);
        stats.monthly = monthlySales[0] || { total: 0, count: 0 };

        const yearlySales = await Sale.aggregate([
            { $match: { ...matchQuery, createdAt: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);
        stats.yearly = yearlySales[0] || { total: 0, count: 0 };

        const topProducts = await Sale.aggregate([
            { $match: matchQuery },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        stats.topProducts = topProducts;

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('❌ Erreur récupération statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les ventes d'un établissement spécifique
 * @route   GET /api/sales/establishment/:establishmentId
 * @access  Private
 */
exports.getSalesByEstablishment = async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        // L'accès est déjà vérifié par le middleware hasEstablishmentAccess
        
        const query = {
            companyId: req.user.companyId,
            establishmentId: establishmentId
        };
        
        const sales = await Sale.find(query)
            .populate('userId', 'firstName lastName')
            .populate('establishmentId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Sale.countDocuments(query);
        
        res.json({
            success: true,
            sales,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('❌ Erreur récupération ventes par établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des ventes'
        });
    }
};