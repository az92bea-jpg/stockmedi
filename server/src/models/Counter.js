const mongoose = require('mongoose');

/**
 * MODÈLE COMPTEUR - Anti-doublon pour numéros uniques
 * 
 * PROBLÈME ÉVITÉ : Sans ce système, deux créations simultanées
 * peuvent générer le même numéro. Avec $inc atomique, c'est impossible.
 * 
 * FORMATS GÉNÉRÉS :
 * - Ventes      : SALE-20260426-0001
 * - Devis       : DEV-20260426-0001
 * - Dossiers    : DPP-20260426-0001
 * 
 * STOCKAGE : Collection "counters" dans MongoDB
 * - _id: "patientrecord" → seq: 42 (exemple)
 * - _id: "sale"          → seq: 158
 */

const CounterSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true 
        // Identifiant unique du compteur
        // Ex: "patientrecord", "sale", "quote"
    },
    seq: { 
        type: Number, 
        default: 0 
        // Numéro de séquence, incrémenté automatiquement
    }
}, { 
    timestamps: true 
    // createdAt : date de création du compteur
    // updatedAt : date de dernière incrémentation
});

/**
 * GENÈRE LE PROCHAIN NUMÉRO UNIQUE (ATOMIQUE)
 * 
 * @param {string} prefix - Préfixe du document (ex: "DPP", "SALE", "DEV")
 * @param {string} counterId - ID du compteur (ex: "patientrecord")
 * @returns {string} Numéro formaté (ex: "DPP-20260426-0042")
 * 
 * EXEMPLE D'UTILISATION :
 * const Counter = require('../models/Counter');
 * const numero = await Counter.getNextNumber('DPP', 'patientrecord');
 * // → "DPP-20260426-0001"
 */
CounterSchema.statics.getNextNumber = async function(prefix, counterId) {
    // $inc garantit l'incrémentation atomique (0 conflit)
    // upsert crée le compteur s'il n'existe pas encore
    const counter = await this.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    
    // Date du jour formatée YYYYMMDD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Numéro de séquence sur 4 chiffres (0001, 0002...)
    const seqStr = String(counter.seq).padStart(4, '0');
    
    return `${prefix}-${dateStr}-${seqStr}`;
};

module.exports = mongoose.model('Counter', CounterSchema);