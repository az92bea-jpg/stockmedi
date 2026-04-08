/**
 * CONTRÔLEUR ÉTABLISSEMENTS - Gestion multi-sites
 * Plan Enterprise uniquement
 */

const Establishment = require('../models/Establishment');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const mongoose = require('mongoose');

/**
 * @desc    Récupérer tous les établissements de l'entreprise
 * @route   GET /api/establishments
 * @access  Private (owner)
 */
exports.getEstablishments = async (req, res) => {
    try {
        // ⭐ Vérifier que l'utilisateur a le plan Enterprise
        const subscription = await Subscription.findOne({ companyId: req.user.companyId });
        
        if (!subscription || subscription.plan !== 'enterprise') {
            return res.json({
                success: true,
                establishments: []
            });
        }
        
        const establishments = await Establishment.find({
            companyId: req.user.companyId,
            isActive: true
        }).populate('managerId', 'firstName lastName email');

        res.json({
            success: true,
            establishments
        });
    } catch (error) {
        console.error('❌ Erreur récupération établissements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des établissements'
        });
    }
};

/**
 * @desc    Créer un établissement
 * @route   POST /api/establishments
 * @access  Private (owner, plan enterprise uniquement)
 */
exports.createEstablishment = async (req, res) => {
    try {
        const { name, type, address, phone, email, managerId } = req.body;
        
        // ⭐ Vérifier que l'utilisateur a le plan Enterprise
        const subscription = await Subscription.findOne({ companyId: req.user.companyId });
        
        if (!subscription || subscription.plan !== 'enterprise') {
            return res.status(403).json({
                success: false,
                message: 'Les établissements sont disponibles uniquement avec le plan Enterprise. Veuillez souscrire au plan Enterprise pour créer des établissements.'
            });
        }
        
        const establishment = await Establishment.create({
            companyId: req.user.companyId,
            name,
            type: type || 'pharmacy',
            address,
            phone,
            email,
            managerId: managerId || null
        });

        res.status(201).json({
            success: true,
            establishment
        });
    } catch (error) {
        console.error('❌ Erreur création établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'établissement'
        });
    }
};


/**
 * @desc    Mettre à jour un établissement
 * @route   PUT /api/establishments/:id
 * @access  Private (owner)
 */
exports.updateEstablishment = async (req, res) => {
    try {
        const establishment = await Establishment.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!establishment) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }

        const { name, type, address, phone, email, managerId, isActive } = req.body;
        if (name) establishment.name = name;
        if (type) establishment.type = type;
        if (address) establishment.address = address;
        if (phone) establishment.phone = phone;
        if (email) establishment.email = email;
        if (managerId !== undefined) establishment.managerId = managerId;
        if (isActive !== undefined) establishment.isActive = isActive;

        await establishment.save();

        res.json({
            success: true,
            establishment
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour'
        });
    }
};

/**
 * @desc    Supprimer un établissement (uniquement si stock = 0)
 * @route   DELETE /api/establishments/:id
 * @access  Private (owner)
 */
exports.deleteEstablishment = async (req, res) => {
    try {
        const establishment = await Establishment.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!establishment) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }

        // Vérifier s'il reste du stock
        const products = await Product.find({
            companyId: req.user.companyId,
            'stockByEstablishment.establishmentId': establishment._id,
            'stockByEstablishment.quantity': { $gt: 0 }
        });

        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer : il reste du stock dans cet établissement'
            });
        }

        await establishment.deleteOne();

        res.json({
            success: true,
            message: 'Établissement supprimé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur suppression établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
};

/**
 * @desc    Transférer du stock entre établissements
 * @route   POST /api/establishments/transfer
 * @access  Private (owner)
 */

exports.transferStock = async (req, res) => {
    try {
        const { productId, fromEstablishmentId, toEstablishmentId, quantity, reason } = req.body;

        // Trouver le produit source
        const sourceProduct = await Product.findOne({
            _id: productId,
            companyId: req.user.companyId,
            establishmentId: fromEstablishmentId
        });

        if (!sourceProduct) {
            return res.status(404).json({ success: false, message: 'Produit source non trouvé' });
        }

        if (sourceProduct.quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Stock insuffisant' });
        }

        // Diminuer stock source
        sourceProduct.quantity -= quantity;
        await sourceProduct.save();

        // Trouver ou créer le produit destination
        let destProduct = await Product.findOne({
            name: sourceProduct.name,
            companyId: req.user.companyId,
            establishmentId: toEstablishmentId,
            isActive: true
        });

        if (destProduct) {
            destProduct.quantity += quantity;
            await destProduct.save();
        } else {
            // Créer un nouveau produit pour la destination
            destProduct = await Product.create({
                companyId: sourceProduct.companyId,
                name: sourceProduct.name,
                genericName: sourceProduct.genericName,
                category: sourceProduct.category,
                manufacturer: sourceProduct.manufacturer,
                batchNumber: sourceProduct.batchNumber,
                barcode: sourceProduct.barcode,
                establishmentId: toEstablishmentId,
                quantity: quantity,
                unit: sourceProduct.unit,
                reorderPoint: sourceProduct.reorderPoint,
                location: sourceProduct.location,
                purchasePrice: sourceProduct.purchasePrice,
                sellingPrice: sourceProduct.sellingPrice,
                manufacturingDate: sourceProduct.manufacturingDate,
                expirationDate: sourceProduct.expirationDate,
                prescriptionRequired: sourceProduct.prescriptionRequired,
                description: sourceProduct.description,
                isActive: true
            });
        }

        res.json({
            success: true,
            message: `${quantity} ${sourceProduct.unit} transféré(s) avec succès`
        });
    } catch (error) {
        console.error('❌ Erreur transfert stock:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du transfert' });
    }
};