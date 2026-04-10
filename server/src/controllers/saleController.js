/**
 * CONTRÔLEUR VENTES
 */

const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Establishment = require('../models/Establishment');
const mongoose = require('mongoose');

// Fonction pour générer le numéro de vente
async function generateSaleNumber(companyId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `${year}${month}${day}`;
    
    const count = await Sale.countDocuments({
        companyId: companyId,
        saleNumber: new RegExp(`^SALE-${prefix}`)
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `SALE-${prefix}-${sequence}`;
}

/**
 * @desc    Créer une nouvelle vente
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
        const saleNumber = await generateSaleNumber(req.user.companyId);

        const sale = await Sale.create({
            companyId: req.user.companyId,
            establishmentId: establishmentId && establishmentId !== '' ? establishmentId : null,
            saleNumber: saleNumber,
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
            userId: req.user.id,
            notes,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        // ⭐ Populate pour le reçu
        await sale.populate('userId', 'firstName lastName email');
        await sale.populate('establishmentId', 'name address phone');

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
 */
exports.getSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, paymentStatus } = req.query;

        const query = { companyId: req.user.companyId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const sales = await Sale.find(query)
            .populate('userId', 'firstName lastName')
            .populate('establishmentId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Sale.countDocuments(query);

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
            pages: Math.ceil(total / limit)
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
 */
exports.getSale = async (req, res) => {
    try {
        const sale = await Sale.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        }).populate('userId', 'firstName lastName email')
          .populate('items.productId', 'name barcode')
          .populate('establishmentId', 'name address phone email');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Vente non trouvée'
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
 */
exports.getSalesStats = async (req, res) => {
    try {
        const { establishmentId } = req.query;
        
        const matchQuery = { 
            companyId: req.user.companyId, 
            archived: false 
        };
        
        if (establishmentId) {
            matchQuery.establishmentId = new mongoose.Types.ObjectId(establishmentId);
        }
        
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

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