/**
 * CONTRÔLEUR RAPPORTS - Génération PDF et Excel
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Company = require('../models/Company');

/**
 * Formate un nombre en devise (sans espaces parasites)
 */
const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 GNF';
    const formatted = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} GNF`;
};

/**
 * Formate un nombre simple
 */
const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * @desc    Générer rapport d'inventaire (PDF)
 * @route   GET /api/reports/inventory/pdf
 * @access  Private
 */
exports.generateInventoryPDF = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId);
        const products = await Product.find({
            companyId: req.user.companyId,
            isActive: true
        }).sort({ name: 1 });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=inventaire_${Date.now()}.pdf`);
        
        doc.pipe(res);

        // En-tête
        doc.fontSize(20).text('RAPPORT D\'INVENTAIRE', { align: 'center' });
        doc.fontSize(12).text(company.name, { align: 'center' });
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
        doc.text(`Valeur totale du stock (achat): ${formatCurrency(totalValue)}`);
        doc.text(`Valeur totale du stock (vente): ${formatCurrency(totalSellingValue)}`);
        doc.text(`Produits en rupture: ${formatNumber(outOfStock)}`);
        doc.text(`Produits en stock faible: ${formatNumber(lowStock)}`);
        doc.text(`Produits expirés: ${formatNumber(expired)}`);
        doc.moveDown();

        // Tableau des produits
        doc.fontSize(12).text('LISTE DES PRODUITS', { underline: true });
        doc.moveDown(0.5);

        // En-têtes du tableau
        let y = doc.y;
        const startX = 50;
        const colWidths = [150, 70, 80, 80, 80];
        
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Produit', startX, y);
        doc.text('Stock', startX + colWidths[0], y);
        doc.text('Prix achat', startX + colWidths[0] + colWidths[1], y);
        doc.text('Prix vente', startX + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text('Expiration', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        
        y += 20;
        doc.font('Helvetica');
        
        for (const product of products) {
            if (y > 700) {
                doc.addPage();
                y = 50;
                doc.fontSize(9).font('Helvetica-Bold');
                doc.text('Produit', startX, y);
                doc.text('Stock', startX + colWidths[0], y);
                doc.text('Prix achat', startX + colWidths[0] + colWidths[1], y);
                doc.text('Prix vente', startX + colWidths[0] + colWidths[1] + colWidths[2], y);
                doc.text('Expiration', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
                y += 20;
                doc.font('Helvetica');
            }
            
            doc.fontSize(8);
            doc.text(product.name.substring(0, 40), startX, y);
            doc.text(`${formatNumber(product.quantity)} ${product.unit}`, startX + colWidths[0], y);
            doc.text(formatCurrency(product.purchasePrice), startX + colWidths[0] + colWidths[1], y);
            doc.text(formatCurrency(product.sellingPrice), startX + colWidths[0] + colWidths[1] + colWidths[2], y);
            doc.text(product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('fr-FR') : 'N/A', 
                startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
            y += 18;
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
        const company = await Company.findById(req.user.companyId);
        const products = await Product.find({
            companyId: req.user.companyId,
            isActive: true
        }).sort({ name: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventaire');

        worksheet.columns = [
            { header: 'Nom du produit', key: 'name', width: 35 },
            { header: 'Générique', key: 'genericName', width: 25 },
            { header: 'Catégorie', key: 'category', width: 18 },
            { header: 'Lot', key: 'batchNumber', width: 15 },
            { header: 'Stock', key: 'quantity', width: 12 },
            { header: 'Unité', key: 'unit', width: 12 },
            { header: "Prix d'achat", key: 'purchasePrice', width: 18 },
            { header: 'Prix de vente', key: 'sellingPrice', width: 18 },
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
                
            worksheet.addRow({
                name: product.name,
                genericName: product.genericName || '',
                category: product.category === 'médicament' ? '💊 Médicament' :
                          product.category === 'dispositif_médical' ? '🩺 DM' :
                          product.category === 'consommable' ? '🧻 Consommable' : 
                          product.category === 'parapharmacie' ? '🧴 Parapharmacie' : product.category,
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
        summarySheet.addRow({ metric: 'Date de génération', value: new Date().toLocaleString('fr-FR') });
        summarySheet.addRow({ metric: 'Nombre total de produits', value: formatNumber(products.length) });
        summarySheet.addRow({ metric: 'Valeur totale du stock (achat)', value: formatCurrency(totalValue) });
        summarySheet.addRow({ metric: 'Valeur totale du stock (vente)', value: formatCurrency(totalSellingValue) });
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
        const { startDate, endDate } = req.query;
        const company = await Company.findById(req.user.companyId);
        
        const query = { companyId: req.user.companyId };
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const sales = await Sale.find(query).sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventes');

        worksheet.columns = [
            { header: 'N° vente', key: 'saleNumber', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Client', key: 'customer', width: 25 },
            { header: 'Articles', key: 'items', width: 12 },
            { header: 'Sous-total', key: 'subtotal', width: 18 },
            { header: 'Remise', key: 'discount', width: 15 },
            { header: 'TVA', key: 'tax', width: 15 },
            { header: 'Total', key: 'total', width: 18 },
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
            
            worksheet.addRow({
                saleNumber: sale.saleNumber,
                date: new Date(sale.createdAt).toLocaleString('fr-FR'),
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
        summarySheet.addRow({ metric: 'Période', value: startDate && endDate ? 
            `${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}` : 
            'Toutes les ventes' });
        summarySheet.addRow({ metric: 'Nombre de ventes', value: formatNumber(sales.length) });
        summarySheet.addRow({ metric: 'Chiffre d\'affaires total', value: formatCurrency(totalSales) });

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