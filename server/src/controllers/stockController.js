/**
 * CONTRÔLEUR STOCK
 * Gère les mouvements de stock (entrées, sorties, ajustements)
 */

const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Company = require('../models/Company');

/**
 * @desc    Enregistrer une entrée de stock (réapprovisionnement)
 * @route   POST /api/stock/in
 * @access  Private (manage_stock)
 */
exports.stockIn = async (req, res) => {
    try {
        const { productId, quantity, purchasePrice, reference, reason, notes } = req.body;

        // Vérifier le produit
        const product = await Product.findOne({
            _id: productId,
            companyId: req.user.companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        // Mettre à jour le prix d'achat si fourni
        if (purchasePrice) {
            product.purchasePrice = purchasePrice;
        }

        // Augmenter le stock
        await product.increaseStock(
            quantity,
            req.user.id,
            reference,
            reason || 'réapprovisionnement'
        );

        // Récupérer le mouvement créé
        const movement = await StockMovement.findOne({
            productId: product._id,
            reference: reference,
            type: 'in'
        }).sort({ createdAt: -1 });

        // Mettre à jour les statistiques de l'entreprise
        const company = await Company.findById(req.user.companyId);
        await company.updateStats();

        res.json({
            success: true,
            message: 'Stock ajouté avec succès',
            product: {
                id: product._id,
                name: product.name,
                quantity: product.quantity
            },
            movement
        });
    } catch (error) {
        console.error('Erreur entrée stock:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout au stock',
            error: error.message
        });
    }
};

/**
 * @desc    Enregistrer une sortie de stock (vente, perte, etc.)
 * @route   POST /api/stock/out
 * @access  Private (manage_stock)
 */
exports.stockOut = async (req, res) => {
    try {
        const { productId, quantity, reason, reference, notes } = req.body;

        // Vérifier le produit
        const product = await Product.findOne({
            _id: productId,
            companyId: req.user.companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        // Vérifier le stock
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Stock insuffisant. Stock actuel: ${product.quantity}`
            });
        }

        // Diminuer le stock
        await product.decreaseStock(
            quantity,
            req.user.id,
            reference
        );

        // Récupérer le mouvement
        const movement = await StockMovement.findOne({
            productId: product._id,
            reference: reference,
            type: 'out'
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            message: 'Stock retiré avec succès',
            product: {
                id: product._id,
                name: product.name,
                quantity: product.quantity
            },
            movement
        });
    } catch (error) {
        console.error('Erreur sortie stock:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du retrait de stock',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer l'historique des mouvements de stock
 * @route   GET /api/stock/history
 * @access  Private
 */
exports.getStockHistory = async (req, res) => {
    try {
        const { page = 1, limit = 50, productId, type, startDate, endDate } = req.query;

        const query = { companyId: req.user.companyId };

        if (productId) query.productId = productId;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const movements = await StockMovement.find(query)
            .populate('productId', 'name unit')
            .populate('userId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await StockMovement.countDocuments(query);

        res.json({
            success: true,
            movements,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer le stock actuel (inventaire)
 * @route   GET /api/stock/inventory
 * @access  Private
 */
exports.getInventory = async (req, res) => {
    try {
        const products = await Product.find({
            companyId: req.user.companyId,
            isActive: true
        }).select('name category batchNumber quantity unit purchasePrice sellingPrice expirationDate location');

        const stats = {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0),
            totalSellingValue: products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0),
            outOfStock: products.filter(p => p.quantity === 0).length,
            lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length
        };

        res.json({
            success: true,
            stats,
            products
        });
    } catch (error) {
        console.error('Erreur récupération inventaire:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'inventaire',
            error: error.message
        });
    }
};