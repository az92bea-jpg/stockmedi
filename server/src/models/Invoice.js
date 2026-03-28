/**
 * MODÈLE INVOICE - Gestion des factures
 */

const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        
        // Type de facture
        type: {
            type: String,
            enum: ['sale', 'purchase', 'credit_note'],
            required: true
        },
        
        // Numéro de facture
        invoiceNumber: {
            type: String,
            unique: true
        },
        
        // Références
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier'
        },
        
        // Client/Fournisseur
        customerInfo: {
            name: String,
            address: String,
            phone: String,
            email: String,
            taxNumber: String
        },
        
        // Articles
        items: [
            {
                productId: mongoose.Schema.Types.ObjectId,
                name: String,
                quantity: Number,
                unitPrice: Number,
                taxRate: Number,
                subtotal: Number
            }
        ],
        
        // Totaux
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },
        
        // Statut
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            default: 'draft'
        },
        
        // Dates
        issueDate: { type: Date, default: Date.now },
        dueDate: Date,
        paidAt: Date,
        
        pdfUrl: String,
        
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Génération du numéro de facture
InvoiceSchema.pre('save', async function(next) {
    if (this.isNew && !this.invoiceNumber) {
        const company = await mongoose.model('Company').findById(this.companyId);
        const prefix = company?.settings?.invoicePrefix || 'INV';
        
        const count = await mongoose.model('Invoice').countDocuments({
            companyId: this.companyId
        });
        
        this.invoiceNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);