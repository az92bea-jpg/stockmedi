/**
 * CONTRÔLEUR FOURNISSEURS - CRUD complet
 */

const Supplier = require('../models/Supplier');

/**
 * @desc    Créer un fournisseur
 * @route   POST /api/suppliers
 */
exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, email, address, contactPerson, notes } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Nom et téléphone requis' });

        const supplier = await Supplier.create({
            name, phone, email: email || '', address: address || {},
            contactPerson: contactPerson || {}, notes: notes || '',
            companyId: req.user.companyId
        });

        res.status(201).json({ success: true, message: 'Fournisseur créé', supplier });
    } catch (error) {
        console.error('❌ Erreur création fournisseur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Récupérer tous les fournisseurs
 * @route   GET /api/suppliers
 */
exports.getSuppliers = async (req, res) => {
    try {
        const { search } = req.query;
        const query = { companyId: req.user.companyId, isActive: true };
        if (search) query.name = new RegExp(search, 'i');

        const suppliers = await Supplier.find(query).sort({ name: 1 });
        res.json({ success: true, suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Modifier un fournisseur
 * @route   PUT /api/suppliers/:id
 */
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });

        const { name, phone, email, address, contactPerson, notes } = req.body;
        if (name) supplier.name = name;
        if (phone) supplier.phone = phone;
        if (email !== undefined) supplier.email = email;
        if (address) supplier.address = address;
        if (contactPerson) supplier.contactPerson = contactPerson;
        if (notes !== undefined) supplier.notes = notes;

        await supplier.save();
        res.json({ success: true, message: 'Fournisseur mis à jour', supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Supprimer un fournisseur (soft delete)
 * @route   DELETE /api/suppliers/:id
 */
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });

        supplier.isActive = false;
        await supplier.save();
        res.json({ success: true, message: 'Fournisseur désactivé' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};