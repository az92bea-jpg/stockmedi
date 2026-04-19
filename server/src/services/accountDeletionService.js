/**
 * SERVICE DE SUPPRESSION DE COMPTE - Nettoyage cascade RGPD
 */

const User = require('../models/User');
const Company = require('../models/Company');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Quote = require('../models/Quote');
const Establishment = require('../models/Establishment');
const StockMovement = require('../models/StockMovement');
const Archive = require('../models/Archive');
const Counter = require('../models/Counter');
const Subscription = require('../models/Subscription');

/**
 * Supprimer définitivement un compte owner et toutes ses données
 */
async function deleteOwnerAccount(userId, companyId) {
    console.log(`🗑️ Suppression compte owner ${userId}, company ${companyId}`);
    
    // 1. Anonymiser les données clients
    await Sale.updateMany(
        { companyId },
        { $set: { customerName: '[ANONYMISÉ]', customerPhone: '[ANONYMISÉ]' } }
    );
    await Quote.updateMany(
        { companyId },
        { $set: { customerName: '[ANONYMISÉ]', customerPhone: '[ANONYMISÉ]' } }
    );
    
    // 2. Supprimer toutes les données
    await Product.deleteMany({ companyId });
    await Sale.deleteMany({ companyId });
    await Quote.deleteMany({ companyId });
    await Establishment.deleteMany({ companyId });
    await StockMovement.deleteMany({ companyId });
    await Archive.deleteMany({ companyId });
    await Counter.deleteMany({ companyId });
    await Subscription.deleteOne({ companyId });
    
    // 3. Supprimer tous les employés
    await User.deleteMany({ companyId, role: 'employee' });
    
    // 4. Supprimer l'entreprise
    await Company.findByIdAndDelete(companyId);
    
    // 5. Supprimer l'owner
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ Compte ${userId} supprimé avec succès`);
    return { success: true };
}

/**
 * Supprimer les comptes inactifs depuis plus de 365 jours
 */
async function cleanupInactiveAccounts() {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const inactiveOwners = await User.find({
        role: 'owner',
        lastActivity: { $lt: oneYearAgo },
        deletionRequestedAt: null
    });
    
    let deletedCount = 0;
    
    for (const owner of inactiveOwners) {
        try {
            await deleteOwnerAccount(owner._id, owner.companyId);
            deletedCount++;
            console.log(`✅ Compte inactif supprimé: ${owner.email}`);
        } catch (error) {
            console.error(`❌ Erreur suppression ${owner.email}:`, error);
        }
    }
    
    return deletedCount;
}

/**
 * Traiter les demandes de suppression (délai de 7 jours écoulé)
 */
async function processDeletionRequests() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const accountsToDelete = await User.find({
        role: 'owner',
        deletionRequestedAt: { $lt: sevenDaysAgo }
    });
    
    let deletedCount = 0;
    
    for (const owner of accountsToDelete) {
        try {
            await deleteOwnerAccount(owner._id, owner.companyId);
            deletedCount++;
            console.log(`✅ Compte supprimé (demande): ${owner.email}`);
        } catch (error) {
            console.error(`❌ Erreur suppression ${owner.email}:`, error);
        }
    }
    
    return deletedCount;
}

module.exports = {
    deleteOwnerAccount,
    cleanupInactiveAccounts,
    processDeletionRequests
};