/**
 * CONTRÔLEUR RAPPORTS - Génération PDF et Excel
 * Correction devise dynamique
 * Correction colonne Établissement
 * Correction colonne Princeps/Générique
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Company = require('../models/Company');
const Establishment = require('../models/Establishment');

/**
 * Formate un nombre en devise (dynamique selon la configuration)
 */
const formatCurrency = (value, currency) => {
    if (value === undefined || value === null) return `0 ${currency}`;
    const formatted = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} ${currency}`;
};

/**
 * Formate un nombre simple
 */
const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Traduit le type de produit
 */
const getTypeLabel = (type, language) => {
    if (!type) return '';
    const typeLower = type.toLowerCase();
    if (typeLower === 'princeps') return language === 'fr' ? 'Princeps' : 'Princeps';
    if (typeLower === 'générique' || typeLower === 'generique') return language === 'fr' ? 'Générique' : 'Generic';
    return type;
};

/**
 * Traduit la catégorie de produit
 */
const getCategoryLabel = (category, language) => {
    if (!category) return '';
    const catLower = category.toLowerCase();
    
    if (catLower === 'médicament' || catLower === 'medication') 
        return language === 'fr' ? 'Médicament' : 'Medication';
    if (catLower === 'dispositif_médical' || catLower === 'dispositif médical' || catLower === 'medical_device') 
        return language === 'fr' ? 'Dispositif médical' : 'Medical Device';
    if (catLower === 'consommable' || catLower === 'consumable') 
        return language === 'fr' ? 'Consommable' : 'Consumable';
    if (catLower === 'parapharmacie' || catLower === 'parapharmacy' || catLower === 'parapharmaceutique') 
        return language === 'fr' ? 'Parapharmacie' : 'Parapharmacy';
    if (catLower === 'complément alimentaire' || catLower === 'food_supplement') 
        return language === 'fr' ? 'Complément alimentaire' : 'Food Supplement';
    if (catLower === 'vitamine' || catLower === 'vitamin') 
        return language === 'fr' ? 'Vitamine' : 'Vitamin';
    if (catLower === 'prestation médicale' || catLower === 'medical_service') 
        return language === 'fr' ? 'Prestation médicale' : 'Medical Service';
    
    return category;
};

/**
 * @desc    Générer rapport d'inventaire (PDF)
 * @route   GET /api/reports/inventory/pdf
 * @access  Private
 */
exports.generateInventoryPDF = async (req, res) => {
    try {
        const { establishmentId } = req.query;
        const company = await Company.findById(req.user.companyId);
        
        // Récupérer la devise configurée
        const currency = company?.settings?.currency || 'GNF';
        const language = company?.settings?.language || 'fr';
        
        // Construire la requête produits
        const productQuery = { companyId: req.user.companyId, isActive: true };
        
        // Ajouter le filtre par établissement si fourni
        let establishmentName = 'Tous les établissements';
        if (establishmentId) {
            productQuery.establishmentId = establishmentId;
            const establishment = await Establishment.findById(establishmentId);
            establishmentName = establishment?.name || 'Établissement inconnu';
        }
        
        const products = await Product.find(productQuery)
            .populate('establishmentId', 'name')
            .sort({ name: 1 });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=inventaire_${Date.now()}.pdf`);
        
        doc.pipe(res);

        // En-tête
        doc.fontSize(20).text('RAPPORT D\'INVENTAIRE', { align: 'center' });
        doc.fontSize(12).text(company.name, { align: 'center' });
        doc.fontSize(10).text(`Établissement: ${establishmentName}`, { align: 'center' });
        doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
        doc.moveDown();

        // Calcul des statistiques
        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
        const totalSellingValue = products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);
        const outOfStock = products.filter(p => p.quantity === 0).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length;
        const expired = products.filter(p => p.expirationDate && new Date(p.expirationDate) < new Date()).length;
        
        doc.fontSize(12).text('RÉSUMÉ', { underline: true });
        doc.fontSize(10);
        doc.text(`Nombre total de produits: ${formatNumber(products.length)}`);
        doc.text(`Valeur totale du stock (achat): ${formatCurrency(totalValue, currency)}`);
        doc.text(`Valeur totale du stock (vente): ${formatCurrency(totalSellingValue, currency)}`);
        doc.text(`Produits en rupture: ${formatNumber(outOfStock)}`);
        doc.text(`Produits en stock faible: ${formatNumber(lowStock)}`);
        doc.text(`Produits expirés: ${formatNumber(expired)}`);
        doc.moveDown();

        // Tableau des produits
        doc.fontSize(12).text('LISTE DES PRODUITS', { underline: true });
        doc.moveDown(0.5);

        // En-têtes du tableau - Largeurs optimisées
        let y = doc.y;
        const startX = 50;
        const colWidths = [120, 60, 70, 50, 70, 70, 70]; // Plus d'espace entre les colonnes

        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('Produit', startX, y);
        doc.text('Type', startX + colWidths[0], y);
        doc.text('Établissement', startX + colWidths[0] + colWidths[1], y);
        doc.text('Stock', startX + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text('Prix achat U', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        doc.text('Prix vente U', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
        doc.text('Expiration', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], y);
        
        y += 18;
        doc.font('Helvetica');
        
        for (const product of products) {
            if (y > 700) {
                doc.addPage();
                y = 50;
                doc.fontSize(7).font('Helvetica-Bold');
                doc.text('Produit', startX, y);
                doc.text('Type', startX + colWidths[0], y);
                doc.text('Établissement', startX + colWidths[0] + colWidths[1], y);
                doc.text('Stock', startX + colWidths[0] + colWidths[1] + colWidths[2], y);
                doc.text('Prix achat', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
                doc.text('Prix vente', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
                doc.text('Expiration', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], y);
                y += 18;
                doc.font('Helvetica');
            }
            
            // Établissement : nom ou "Non rattaché"
            const establishmentName_product = product.establishmentId?.name || 'Non rattaché';
            
            // Type du produit (Princeps/Générique)
            const productType = getTypeLabel(product.type, language);
            
            doc.fontSize(6);
            doc.text(product.name.substring(0, 30), startX, y);
            doc.text(productType.substring(0, 12), startX + colWidths[0], y);
            doc.text(establishmentName_product.substring(0, 15), startX + colWidths[0] + colWidths[1], y);
            doc.text(`${formatNumber(product.quantity)} ${product.unit}`, startX + colWidths[0] + colWidths[1] + colWidths[2], y);
            doc.text(formatCurrency(product.purchasePrice, currency), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
            doc.text(formatCurrency(product.sellingPrice, currency), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
            doc.text(product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : 'N/A', 
                startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], y);
            y += 14;
        }

        doc.end();
    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du PDF',
            error: error.message
        });
    }
};

/**
 * @desc    Générer rapport d'inventaire (Excel)
 * @route   GET /api/reports/inventory/excel
 * @access  Private
 */
exports.generateInventoryExcel = async (req, res) => {
    try {
        const { establishmentId } = req.query;
        const company = await Company.findById(req.user.companyId);
        
        // Récupérer la devise et la langue configurées
        const currency = company?.settings?.currency || 'GNF';
        const language = company?.settings?.language || 'fr';
        
        // Construire la requête produits
        const productQuery = { companyId: req.user.companyId, isActive: true };
        
        // Ajouter le filtre par établissement si fourni
        let establishmentName = 'Tous les établissements';
        if (establishmentId) {
            productQuery.establishmentId = establishmentId;
            const establishment = await Establishment.findById(establishmentId);
            establishmentName = establishment?.name || 'Établissement inconnu';
        }
        
        const products = await Product.find(productQuery)
            .populate('establishmentId', 'name')
            .sort({ name: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventaire');

        worksheet.columns = [
            { header: 'Nom du produit', key: 'name', width: 35 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Établissement', key: 'establishment', width: 25 },
            { header: 'Catégorie', key: 'category', width: 22 },
            { header: 'Lot', key: 'batchNumber', width: 15 },
            { header: 'Stock', key: 'quantity', width: 12 },
            { header: 'Unité', key: 'unit', width: 12 },
            { header: `Prix d'achat (${currency})`, key: 'purchasePrice', width: 18 },
            { header: `Prix de vente (${currency})`, key: 'sellingPrice', width: 18 },
            { header: 'Marge (%)', key: 'margin', width: 12 },
            { header: 'Date fabrication', key: 'manufacturingDate', width: 15 },
            { header: 'Date expiration', key: 'expirationDate', width: 15 },
            { header: 'Emplacement', key: 'location', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F6B3A' }
        };

        worksheet.getColumn('purchasePrice').numFmt = '#,##0';
        worksheet.getColumn('sellingPrice').numFmt = '#,##0';

        for (const product of products) {
            const margin = product.purchasePrice > 0 
                ? ((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)
                : 0;
            
            // Type du produit
            const productType = getTypeLabel(product.type, language);
            
            // Catégorie traduite
            const categoryLabel = getCategoryLabel(product.category, language);
            
            // Établissement : nom ou "Non rattaché"
            const establishmentLabel = product.establishmentId?.name || 'Non rattaché';
                
            worksheet.addRow({
                name: product.name,
                type: productType,
                establishment: establishmentLabel,
                category: categoryLabel,
                batchNumber: product.batchNumber || '',
                quantity: product.quantity,
                unit: product.unit,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                margin: parseFloat(margin),
                manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate).toLocaleDateString('fr-FR') : '',
                expirationDate: product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : '',
                location: product.location || ''
            });
        }

        const summarySheet = workbook.addWorksheet('Résumé');
        summarySheet.columns = [
            { header: 'Métrique', key: 'metric', width: 35 },
            { header: 'Valeur', key: 'value', width: 30 }
        ];
        
        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
        const totalSellingValue = products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);
        const outOfStock = products.filter(p => p.quantity === 0).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length;
        const expired = products.filter(p => p.expirationDate && new Date(p.expirationDate) < new Date()).length;
        
        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F6B3A' }
        };
        
        summarySheet.addRow({ metric: 'Entreprise', value: company.name });
        summarySheet.addRow({ metric: 'Établissement', value: establishmentName });
        summarySheet.addRow({ metric: 'Date de génération', value: new Date().toLocaleString('fr-FR') });
        summarySheet.addRow({ metric: 'Nombre total de produits', value: formatNumber(products.length) });
        summarySheet.addRow({ metric: `Valeur totale du stock (achat)`, value: formatCurrency(totalValue, currency) });
        summarySheet.addRow({ metric: `Valeur totale du stock (vente)`, value: formatCurrency(totalSellingValue, currency) });
        summarySheet.addRow({ metric: 'Produits en rupture', value: formatNumber(outOfStock) });
        summarySheet.addRow({ metric: 'Produits en stock faible', value: formatNumber(lowStock) });
        summarySheet.addRow({ metric: 'Produits expirés', value: formatNumber(expired) });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=inventaire_${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('❌ Erreur génération Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du fichier Excel',
            error: error.message
        });
    }
};

/**
 * @desc    Générer rapport des ventes (Excel)
 * @route   GET /api/reports/sales/excel
 * @access  Private
 */
exports.generateSalesExcel = async (req, res) => {
    try {
        const { startDate, endDate, establishmentId } = req.query;
        const company = await Company.findById(req.user.companyId);
        
        // Récupérer la devise configurée
        const currency = company?.settings?.currency || 'GNF';
        
        const query = { companyId: req.user.companyId };
        
        // Ajouter le filtre par établissement si fourni
        let establishmentName = 'Tous les établissements';
        if (establishmentId) {
            query.establishmentId = establishmentId;
            const establishment = await Establishment.findById(establishmentId);
            establishmentName = establishment?.name || 'Établissement inconnu';
        }
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const sales = await Sale.find(query)
            .populate('establishmentId', 'name')
            .sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventes');

        worksheet.columns = [
            { header: 'N° vente', key: 'saleNumber', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Établissement', key: 'establishment', width: 25 },
            { header: 'Client', key: 'customer', width: 25 },
            { header: 'Articles', key: 'items', width: 12 },
            { header: `Sous-total (${currency})`, key: 'subtotal', width: 18 },
            { header: `Remise (${currency})`, key: 'discount', width: 15 },
            { header: `TVA (${currency})`, key: 'tax', width: 15 },
            { header: `Total (${currency})`, key: 'total', width: 18 },
            { header: 'Paiement', key: 'payment', width: 15 },
            { header: 'Statut', key: 'status', width: 12 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F6B3A' }
        };

        worksheet.getColumn('subtotal').numFmt = '#,##0';
        worksheet.getColumn('discount').numFmt = '#,##0';
        worksheet.getColumn('tax').numFmt = '#,##0';
        worksheet.getColumn('total').numFmt = '#,##0';

        let totalSales = 0;
        
        for (const sale of sales) {
            const totalItems = sale.items.reduce((sum, i) => sum + i.quantity, 0);
            totalSales += sale.total;
            
            // Établissement : nom ou "Non rattaché"
            const establishmentLabel = sale.establishmentId?.name || 'Non rattaché';
            
            worksheet.addRow({
                saleNumber: sale.saleNumber,
                date: new Date(sale.createdAt).toLocaleString('fr-FR'),
                establishment: establishmentLabel,
                customer: sale.customerName || '-',
                items: totalItems,
                subtotal: sale.subtotal,
                discount: sale.discount,
                tax: sale.tax,
                total: sale.total,
                payment: sale.paymentMethod === 'cash' ? '💰 Espèces' : 
                         sale.paymentMethod === 'card' ? '💳 Carte' : 
                         sale.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : sale.paymentMethod,
                status: sale.isCancelled ? '❌ Annulée' : '✅ Validée'
            });
        }

        const summarySheet = workbook.addWorksheet('Résumé');
        summarySheet.columns = [
            { header: 'Métrique', key: 'metric', width: 35 },
            { header: 'Valeur', key: 'value', width: 30 }
        ];
        
        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F6B3A' }
        };
        
        summarySheet.addRow({ metric: 'Entreprise', value: company.name });
        summarySheet.addRow({ metric: 'Établissement', value: establishmentName });
        summarySheet.addRow({ metric: 'Période', value: startDate && endDate ? 
            `${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}` : 
            'Toutes les ventes' });
        summarySheet.addRow({ metric: 'Nombre de ventes', value: formatNumber(sales.length) });
        summarySheet.addRow({ metric: 'Chiffre d\'affaires total', value: formatCurrency(totalSales, currency) });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ventes_${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('❌ Erreur génération rapport ventes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport',
            error: error.message
        });
    }
};

/**
 * @desc    Rapport d'inventaire par établissement
 * @route   GET /api/reports/inventory/establishment/:establishmentId
 * @access  Private
 */
exports.getInventoryByEstablishment = async (req, res) => {
    try {
        const { establishmentId } = req.params;
        
        if (!req.user.hasAccessToEstablishment(establishmentId)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cet établissement'
            });
        }
        
        const products = await Product.find({
            companyId: req.user.companyId,
            establishmentId: establishmentId,
            isActive: true
        }).populate('establishmentId', 'name');
        
        res.json({
            success: true,
            establishmentId,
            products
        });
    } catch (error) {
        console.error('❌ Erreur rapport établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du rapport'
        });
    }
};