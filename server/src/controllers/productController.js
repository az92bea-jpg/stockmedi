/**
 * CONTRÔLEUR PRODUIT
 */

const Product = require('../models/Product');

/**
 * @desc    Récupérer tous les produits
 */
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category, stockStatus } = req.query;
        
        const query = { companyId: req.user.companyId, isActive: true };
        
        if (search) {
            query.$text = { $search: search };
        }
        if (category) {
            query.category = category;
        }
        if (stockStatus === 'out_of_stock') {
            query.quantity = 0;
        } else if (stockStatus === 'low_stock') {
            query.quantity = { $gt: 0 };
            query.$expr = { $lte: ["$quantity", "$reorderPoint"] };
        }
        
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            products,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Erreur récupération produits:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer un produit par ID
 */
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Erreur récupération produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Créer un nouveau produit
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name, genericName, category, manufacturer, batchNumber, barcode,
            quantity, unit, reorderPoint, location,
            purchasePrice, sellingPrice,
            manufacturingDate, expirationDate,
            prescriptionRequired, description
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Le nom du produit est requis'
            });
        }
        if (!purchasePrice) {
            return res.status(400).json({
                success: false,
                message: 'Le prix d\'achat est requis'
            });
        }
        if (!sellingPrice) {
            return res.status(400).json({
                success: false,
                message: 'Le prix de vente est requis'
            });
        }
        if (!expirationDate) {
            return res.status(400).json({
                success: false,
                message: 'La date d\'expiration est requise'
            });
        }

        const product = await Product.create({
            companyId: req.user.companyId,
            name,
            genericName: genericName || '',
            category: category || 'médicament',
            manufacturer: manufacturer || '',
            batchNumber: batchNumber || '',
            barcode: barcode || '',
            quantity: quantity || 0,
            unit: unit || 'boîte(s)',
            reorderPoint: reorderPoint || 10,
            location: location || '',
            purchasePrice,
            sellingPrice,
            manufacturingDate: manufacturingDate || null,
            expirationDate,
            prescriptionRequired: prescriptionRequired || false,
            description: description || '',
            isActive: true
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour un produit
 */
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        const updates = req.body;
        const allowedUpdates = ['name', 'genericName', 'category', 'manufacturer', 'batchNumber', 'barcode', 'quantity', 'unit', 'reorderPoint', 'location', 'purchasePrice', 'sellingPrice', 'manufacturingDate', 'expirationDate', 'prescriptionRequired', 'description'];
        
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) {
                product[key] = updates[key];
            }
        });

        await product.save();

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Erreur mise à jour produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un produit (archivage)
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        if (product.quantity > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer un produit avec du stock. Vendez ou ajustez le stock d\'abord.'
            });
        }

        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Produit archivé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les alertes
 */
exports.getAlerts = async (req, res) => {
    try {
        const today = new Date();
        const soonExpiration = new Date();
        soonExpiration.setDate(today.getDate() + 30);

        // Stock faible - utilisation de $expr pour comparer deux champs
        const lowStock = await Product.find({
            companyId: req.user.companyId,
            isActive: true,
            quantity: { $gt: 0 },
            $expr: { $lte: ["$quantity", "$reorderPoint"] }
        }).select('name quantity reorderPoint');

        // Rupture de stock
        const outOfStock = await Product.find({
            companyId: req.user.companyId,
            isActive: true,
            quantity: 0
        }).select('name quantity');

        // Expiration proche
        const expiringSoon = await Product.find({
            companyId: req.user.companyId,
            isActive: true,
            expirationDate: { $gte: today, $lte: soonExpiration },
            quantity: { $gt: 0 }
        }).select('name expirationDate quantity');

        // Produits expirés
        const expired = await Product.find({
            companyId: req.user.companyId,
            isActive: true,
            expirationDate: { $lt: today },
            quantity: { $gt: 0 }
        }).select('name expirationDate quantity');

        res.json({
            success: true,
            alerts: {
                lowStock: { count: lowStock.length, items: lowStock },
                outOfStock: { count: outOfStock.length, items: outOfStock },
                expiringSoon: { count: expiringSoon.length, items: expiringSoon },
                expired: { count: expired.length, items: expired }
            }
        });
    } catch (error) {
        console.error('Erreur récupération alertes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des alertes',
            error: error.message
        });
    }
};