/**
 * CONTRÔLEUR PRODUIT
 * ⭐ Support filtrage par établissements accessibles (employés)
 */

const Product = require('../models/Product');
const Establishment = require('../models/Establishment');
const mongoose = require('mongoose');

/**
 * @desc    Récupérer tous les produits
 * ⭐ Filtrage automatique par établissements accessibles pour les employés
 */
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category, stockStatus } = req.query;
        
        const query = { companyId: req.user.companyId, isActive: true };
        
        // ⭐ Filtrer par établissements accessibles pour les employés
        const accessibleIds = req.user.getAccessibleEstablishmentIds();
        if (accessibleIds !== null) {
            if (accessibleIds.length === 0) {
                // L'employé n'a accès à aucun établissement
                return res.json({
                    success: true,
                    products: [],
                    total: 0,
                    page: parseInt(page),
                    pages: 0
                });
            }
            query.establishmentId = { $in: accessibleIds };
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category = category;
        }
        if (stockStatus === 'out_of_stock') {
            query.quantity = 0;
        } else if (stockStatus === 'low_stock') {
            query.quantity = { $gt: 0 };
            query.$expr = { $lte: ['$quantity', '$reorderPoint'] };
        }
        
        const products = await Product.find(query)
            .populate('establishmentId', 'name type')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            products,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('❌ Erreur récupération produits:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer un produit par ID
 * ⭐ Vérification de l'accès à l'établissement du produit
 */
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        }).populate('establishmentId', 'name type');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        // ⭐ Vérifier que l'employé a accès à l'établissement du produit
        if (product.establishmentId && !req.user.hasAccessToEstablishment(product.establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cet établissement'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('❌ Erreur récupération produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Créer un nouveau produit
 * ⭐ Vérification de l'accès à l'établissement
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name, genericName, category, manufacturer, batchNumber, barcode,
            quantity, unit, reorderPoint, location,
            purchasePrice, sellingPrice,
            manufacturingDate, expirationDate,
            prescriptionRequired, description,
            establishmentId
        } = req.body;

        // Validations de base
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Le nom du produit est requis'
            });
        }
        if (!purchasePrice && purchasePrice !== 0) {
            return res.status(400).json({
                success: false,
                message: 'Le prix d\'achat est requis'
            });
        }
        if (!sellingPrice && sellingPrice !== 0) {
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

        // Vérifier si l'utilisateur a des établissements
        const userEstablishments = await Establishment.find({ companyId: req.user.companyId });
        const hasEstablishments = userEstablishments.length > 0;

        // Si l'utilisateur a des établissements, il doit en fournir un
        let cleanEstablishmentId = null;
        if (hasEstablishments) {
            if (!establishmentId || establishmentId === '') {
                return res.status(400).json({
                    success: false,
                    message: 'L\'établissement est requis pour créer un produit'
                });
            }
            cleanEstablishmentId = establishmentId;
            
            // ⭐ Vérifier que l'employé a accès à cet établissement
            if (!req.user.hasAccessToEstablishment(cleanEstablishmentId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet établissement'
                });
            }
        }

        const product = await Product.create({
            companyId: req.user.companyId,
            name,
            type: req.body.type || 'Générique',
            genericName: genericName || '',
            category: category || 'Médicament',
            subCategory: req.body.subCategory || '',
            manufacturer: manufacturer || '',
            batchNumber: batchNumber || '',
            barcode: barcode || '',
            establishmentId: cleanEstablishmentId,
            quantity: parseInt(quantity) || 0,
            unit: unit || 'Boîtes',
            reorderPoint: reorderPoint || 10,
            location: location || '',
            purchasePrice: parseFloat(purchasePrice) || 0,
            sellingPrice: parseFloat(sellingPrice) || 0,
            manufacturingDate: manufacturingDate || null,
            expirationDate,
            prescriptionRequired: prescriptionRequired || false,
            description: description || '',
            isActive: true
        });

        await product.populate('establishmentId', 'name type');

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('❌ Erreur création produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour un produit
 * ⭐ Vérification de l'accès à l'établissement
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

        // ⭐ Vérifier l'accès à l'établissement actuel
        if (product.establishmentId && !req.user.hasAccessToEstablishment(product.establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cet établissement'
            });
        }

        // ⭐ Si changement d'établissement, vérifier l'accès au nouveau
        if (req.body.establishmentId && req.body.establishmentId !== product.establishmentId?.toString()) {
            if (!req.user.hasAccessToEstablishment(req.body.establishmentId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé au nouvel établissement'
                });
            }
        }

        const allowedUpdates = [
            'name', 'type', 'genericName', 'category', 'subCategory', 'manufacturer',
            'batchNumber', 'barcode', 'unit', 'reorderPoint',
            'location', 'purchasePrice', 'sellingPrice',
            'manufacturingDate', 'expirationDate',
            'prescriptionRequired', 'description', 'quantity', 'establishmentId'
        ];
        
        allowedUpdates.forEach(key => {
            if (req.body[key] !== undefined) {
                product[key] = req.body[key];
            }
        });

        await product.save();
        await product.populate('establishmentId', 'name type');

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un produit (archivage)
 * ⭐ Vérification de l'accès à l'établissement
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

        // ⭐ Vérifier l'accès à l'établissement
        if (product.establishmentId && !req.user.hasAccessToEstablishment(product.establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cet établissement'
            });
        }

        if (product.quantity > 0) {
            return res.status(400).json({
                success: false,
                message: `Impossible de supprimer ce produit car il reste ${product.quantity} ${product.unit} en stock. Vendez ou ajustez le stock d'abord.`
            });
        }

        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Produit archivé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression produit:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du produit',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer les alertes
 * ⭐ Filtrage par établissements accessibles
 */
exports.getAlerts = async (req, res) => {
    try {
        const today = new Date();
        const soonExpiration = new Date();
        soonExpiration.setDate(today.getDate() + 30);

        const query = { companyId: req.user.companyId, isActive: true };
        
        // ⭐ Filtrer par établissements accessibles
        const accessibleIds = req.user.getAccessibleEstablishmentIds();
        if (accessibleIds !== null) {
            if (accessibleIds.length === 0) {
                return res.json({
                    success: true,
                    alerts: {
                        lowStock: { count: 0, items: [] },
                        outOfStock: { count: 0, items: [] },
                        expiringSoon: { count: 0, items: [] },
                        expired: { count: 0, items: [] }
                    }
                });
            }
            query.establishmentId = { $in: accessibleIds };
        }

        const lowStock = await Product.find({
            ...query,
            quantity: { $gt: 0 },
            $expr: { $lte: ['$quantity', '$reorderPoint'] }
        }).select('name quantity reorderPoint establishmentId');

        const outOfStock = await Product.find({
            ...query,
            quantity: 0
        }).select('name quantity establishmentId');

        const expiringSoon = await Product.find({
            ...query,
            expirationDate: { $gte: today, $lte: soonExpiration },
            quantity: { $gt: 0 }
        }).select('name expirationDate quantity establishmentId');

        const expired = await Product.find({
            ...query,
            expirationDate: { $lt: today },
            quantity: { $gt: 0 }
        }).select('name expirationDate quantity establishmentId');

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
        console.error('❌ Erreur récupération alertes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des alertes',
            error: error.message
        });
    }
};