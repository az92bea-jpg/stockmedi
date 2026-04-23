const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    },
    used: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);