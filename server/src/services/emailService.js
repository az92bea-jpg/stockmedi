/**
 * ENVOYER UN CODE 2FA PAR EMAIL
 */
const send2FACode = async (to, code) => {
    const mailOptions = {
        from: `"StockMedi Sécurité" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Code de vérification StockMedi',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">🔐 Vérification en deux étapes</h2>
                <p>Voici votre code de vérification :</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 16px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F6B3A;">${code}</span>
                </div>
                <p style="font-size: 0.85rem; color: #6B7280;">Ce code expire dans 5 minutes.</p>
                <p style="font-size: 0.85rem; color: #6B7280;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, send2FACode };