/**
 * MODÈLE DOSSIER PHARMACEUTIQUE PATIENT (DPP)
 * StockMedi - Suivi pharmaceutique professionnel
 */

const mongoose = require('mongoose');

// Sous-schéma : Antécédents médicaux
const MedicalHistorySchema = new mongoose.Schema({
    chronicDiseases: { type: String, default: '' },
    allergies: { type: String, default: '' },
    currentTreatments: { type: String, default: '' },
    surgicalHistory: { type: String, default: '' },
    drugIntolerances: { type: String, default: '' }
}, { _id: false });

// Sous-schéma : Suivi des traitements
const TreatmentFollowUpSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    duration: { type: String, default: '' },
    observation: { type: String, default: '' }
});

// Sous-schéma : Suivi des constantes
const VitalSignsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    systolicPressure: { type: Number, default: null },
    diastolicPressure: { type: Number, default: null },
    glycemia: { type: Number, default: null },
    heartRate: { type: Number, default: null },
    weight: { type: Number, default: null },
    temperature: { type: Number, default: null }
});

// Schéma principal
const PatientRecordSchema = new mongoose.Schema({
    // Identifiant unique du dossier
    recordNumber: {
        type: String,
        required: true,
        unique: true
    },
    
    // Informations personnelles
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    dateOfBirth: { type: Date, default: null },
    phone: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true },
    address: { type: String, default: '' },
    
    // Antécédents médicaux
    medicalHistory: { type: MedicalHistorySchema, default: () => ({}) },
    
    // Suivi des traitements (tableau)
    treatmentFollowUps: { type: [TreatmentFollowUpSchema], default: [] },
    
    // Suivi des constantes (tableau)
    vitalSigns: { type: [VitalSignsSchema], default: [] },
    
    // Notes du pharmacien
    pharmacistNotes: { type: String, default: '' },
    
    // Rattachement à l'entreprise
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    
    // Pharmacien créateur
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Dernier pharmacien modificateur
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Archivage
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    archiveAutoDeleteAt: { type: Date, default: null }
}, {
    timestamps: true
});

// Index pour recherche rapide
PatientRecordSchema.index({ companyId: 1, isArchived: 1 });
PatientRecordSchema.index({ companyId: 1, lastName: 1, firstName: 1 });

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);