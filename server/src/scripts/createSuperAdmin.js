/**
 * SCRIPT - CRÉATION DU SUPER-ADMIN
 * Exécuter une seule fois pour créer le compte administrateur
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
require('dotenv').config();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Vérifier si super-admin existe déjà
        const existingAdmin = await User.findOne({ role: 'super-admin' });
        
        if (existingAdmin) {
            console.log('⚠️ Un compte super-admin existe déjà:', existingAdmin.email);
            process.exit(0);
        }

        // Créer le super-admin
        const superAdmin = await User.create({
            email: 'admin@stockmedi.com',
            password: hashPassword('Admin123!'),
            firstName: 'Super',
            lastName: 'Admin',
            phone: '+224000000000',
            role: 'super-admin',
            permissions: ['*'], // Toutes les permissions
            isActive: true
        });

        console.log('✅ Super-admin créé avec succès !');
        console.log('📧 Email: admin@stockmedi.com');
        console.log('🔑 Mot de passe: Admin123!');
        console.log('⚠️ Changez ce mot de passe après la première connexion !');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

createSuperAdmin();