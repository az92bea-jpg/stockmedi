/**
 * CONTRÔLEUR UTILISATEUR - Profil et suppression RGPD
 */

const User = require('../models/User');

/**
 * @desc    Demander la suppression du compte (délai de 7 jours)
 * @route   POST /api/users/request-deletion
 * @access  Private (owner)
 */
exports.requestAccountDeletion = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        
        if (user.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut supprimer le compte'
            });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe incorrect'
            });
        }
        
        user.deletionRequestedAt = new Date();
        await user.save();
        
        res.json({
            success: true,
            message: 'Votre demande de suppression a été enregistrée. Votre compte et toutes vos données seront définitivement supprimés dans 7 jours. Vous pouvez annuler cette demande avant ce délai.',
            deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    } catch (error) {
        console.error('❌ Erreur demande suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de suppression'
        });
    }
};

/**
 * @desc    Annuler une demande de suppression
 * @route   POST /api/users/cancel-deletion
 * @access  Private (owner)
 */
exports.cancelDeletionRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user.deletionRequestedAt) {
            return res.status(400).json({
                success: false,
                message: 'Aucune demande de suppression en cours'
            });
        }
        
        user.deletionRequestedAt = null;
        user.lastActivity = new Date();
        await user.save();
        
        res.json({
            success: true,
            message: 'Votre demande de suppression a été annulée. Votre compte reste actif.'
        });
    } catch (error) {
        console.error('❌ Erreur annulation suppression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation'
        });
    }
};