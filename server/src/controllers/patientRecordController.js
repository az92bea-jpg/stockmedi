/**
 * CONTRÔLEUR DOSSIER PHARMACEUTIQUE PATIENT (DPP)
 * CRUD complet + Archivage + Export PDF/Excel
 */

const PatientRecord = require('../models/PatientRecord');
const Counter = require('../models/Counter');

// ==================== CRUD ====================

/**
 * @desc    Créer un nouveau dossier patient
 * @route   POST /api/patients
 * @access  Private (entreprise uniquement)
 */
exports.createPatientRecord = async (req, res) => {
    try {
        const {
            lastName, firstName, dateOfBirth, phone, email, address,
            medicalHistory, treatmentFollowUps, vitalSigns, pharmacistNotes
        } = req.body;

        if (!lastName || !firstName) {
            return res.status(400).json({
                success: false,
                message: 'Nom et prénom requis'
            });
        }

        // Générer le numéro de dossier unique
        const recordNumber = await Counter.getNextNumber('DPP', 'patientrecord');

        const record = await PatientRecord.create({
            recordNumber,
            lastName,
            firstName,
            dateOfBirth: dateOfBirth || null,
            phone: phone || '',
            email: email || '',
            address: address || '',
            medicalHistory: medicalHistory || {},
            treatmentFollowUps: treatmentFollowUps || [],
            vitalSigns: vitalSigns || [],
            pharmacistNotes: pharmacistNotes || '',
            companyId: req.user.companyId,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Dossier patient créé avec succès',
            record
        });
    } catch (error) {
        console.error('❌ Erreur création dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du dossier'
        });
    }
};

/**
 * @desc    Récupérer tous les dossiers patients (non archivés)
 * @route   GET /api/patients
 * @access  Private
 */
exports.getPatientRecords = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const query = { 
            companyId: req.user.companyId, 
            isArchived: false 
        };

        // Recherche par nom ou prénom
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { lastName: regex },
                { firstName: regex },
                { recordNumber: regex }
            ];
        }

        const total = await PatientRecord.countDocuments(query);
        const records = await PatientRecord.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName');

        res.json({
            success: true,
            records,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération dossiers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des dossiers'
        });
    }
};

/**
 * @desc    Récupérer un dossier patient par ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
exports.getPatientRecord = async (req, res) => {
    try {
        const record = await PatientRecord.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        })
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Dossier patient non trouvé'
            });
        }

        res.json({
            success: true,
            record
        });
    } catch (error) {
        console.error('❌ Erreur récupération dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du dossier'
        });
    }
};

/**
 * @desc    Mettre à jour un dossier patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
exports.updatePatientRecord = async (req, res) => {
    try {
        const {
            lastName, firstName, dateOfBirth, phone, email, address,
            medicalHistory, treatmentFollowUps, vitalSigns, pharmacistNotes
        } = req.body;

        const record = await PatientRecord.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Dossier patient non trouvé'
            });
        }

        // Mettre à jour les champs
        if (lastName) record.lastName = lastName;
        if (firstName) record.firstName = firstName;
        if (dateOfBirth !== undefined) record.dateOfBirth = dateOfBirth;
        if (phone !== undefined) record.phone = phone;
        if (email !== undefined) record.email = email;
        if (address !== undefined) record.address = address;
        if (medicalHistory) record.medicalHistory = medicalHistory;
        if (treatmentFollowUps) record.treatmentFollowUps = treatmentFollowUps;
        if (vitalSigns) record.vitalSigns = vitalSigns;
        if (pharmacistNotes !== undefined) record.pharmacistNotes = pharmacistNotes;
        
        record.updatedBy = req.user.id;

        await record.save();

        res.json({
            success: true,
            message: 'Dossier patient mis à jour',
            record
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du dossier'
        });
    }
};

/**
 * @desc    Supprimer définitivement un dossier patient
 * @route   DELETE /api/patients/:id
 * @access  Private (owner uniquement)
 */
exports.deletePatientRecord = async (req, res) => {
    try {
        const record = await PatientRecord.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Dossier patient non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Dossier patient supprimé définitivement'
        });
    } catch (error) {
        console.error('❌ Erreur suppression dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du dossier'
        });
    }
};

// ==================== ARCHIVAGE ====================

/**
 * @desc    Archiver un dossier patient
 * @route   PUT /api/patients/:id/archive
 * @access  Private
 */
exports.archivePatientRecord = async (req, res) => {
    try {
        const record = await PatientRecord.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Dossier patient non trouvé'
            });
        }

        record.isArchived = true;
        record.archivedAt = new Date();
        // Suppression automatique après 1 an
        record.archiveAutoDeleteAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        await record.save();

        res.json({
            success: true,
            message: 'Dossier patient archivé avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur archivage dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'archivage du dossier'
        });
    }
};

/**
 * @desc    Récupérer les dossiers archivés
 * @route   GET /api/patients/archives
 * @access  Private
 */
exports.getArchivedRecords = async (req, res) => {
    try {
        const records = await PatientRecord.find({
            companyId: req.user.companyId,
            isArchived: true
        })
            .sort({ archivedAt: -1 })
            .populate('createdBy', 'firstName lastName');

        res.json({
            success: true,
            records
        });
    } catch (error) {
        console.error('❌ Erreur récupération archives:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des archives'
        });
    }
};

// ==================== EXPORT ====================

/**
 * @desc    Exporter un dossier en JSON (pour PDF/Excel côté frontend)
 * @route   GET /api/patients/:id/export
 * @access  Private
 */
exports.exportPatientRecord = async (req, res) => {
    try {
        const record = await PatientRecord.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        })
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Dossier patient non trouvé'
            });
        }

        res.json({
            success: true,
            record
        });
    } catch (error) {
        console.error('❌ Erreur export dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'export du dossier'
        });
    }
};