/**
 * SERVICE EMAIL - Mailersend
 */
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY
});

/**
 * Envoyer un code 2FA
 */
const send2FACode = async (to, code) => {
    const sentFrom = new Sender('MS_trial@test-65qngkd16o3lwr12.mlsender.net', 'StockMedi');
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject('🔐 Code de vérification StockMedi')
        .setHtml(`
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">🔐 Vérification en deux étapes</h2>
                <p>Voici votre code de vérification :</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; 
                            border-radius: 8px; margin: 16px 0;">
                    <span style="font-size: 32px; font-weight: bold; 
                                 letter-spacing: 8px; color: #0F6B3A;">${code}</span>
                </div>
                <p style="font-size: 0.85rem; color: #6B7280;">Ce code expire dans 5 minutes.</p>
                <p style="font-size: 0.85rem; color: #6B7280;">
                    Si vous n'avez pas demandé ce code, ignorez cet email.
                </p>
            </div>
        `);

    await mailerSend.email.send(emailParams);
};

/**
 * Envoyer un lien de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
    const sentFrom = new Sender('MS_trial@test-65qngkd16o3lwr12.mlsender.net', 'StockMedi');
    const recipients = [new Recipient(to)];

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject('🔑 Réinitialisation de mot de passe StockMedi')
        .setHtml(`
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">🔑 Réinitialisation de mot de passe</h2>
                <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${resetUrl}" 
                       style="background: #0F6B3A; color: white; padding: 12px 24px; 
                              border-radius: 6px; text-decoration: none; font-weight: bold;">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                <p style="font-size: 0.85rem; color: #6B7280;">Ce lien expire dans 15 minutes.</p>
                <p style="font-size: 0.85rem; color: #6B7280;">
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
            </div>
        `);

    await mailerSend.email.send(emailParams);
};

/**
 * Envoyer un email de vérification de compte
 */
const sendVerificationEmail = async (to, verificationUrl, firstName) => {
    const sentFrom = new Sender(
        'MS_trial@test-65qngkd16o3lwr12.mlsender.net',
        'StockMedi'
    );

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo([new Recipient(to)])
        .setSubject('✅ Activez votre compte StockMedi')
        .setHtml(`
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">👋 Bienvenue sur StockMedi, ${firstName} !</h2>
                <p>Votre compte a bien été créé. Il vous reste une dernière étape pour l'activer.</p>
                <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${verificationUrl}"
                       style="background: #0F6B3A; color: white; padding: 14px 28px;
                              border-radius: 6px; text-decoration: none; font-weight: bold;
                              font-size: 1rem;">
                        Activer mon compte
                    </a>
                </div>
                <div style="background: #FEF3C7; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                    <p style="margin: 0; color: #92400E;">
                        ⚠️ Ce lien expire dans <strong>24 heures</strong>.
                    </p>
                </div>
                <p style="font-size: 0.85rem; color: #6B7280;">
                    Si vous n'avez pas créé ce compte, ignorez cet email.
                </p>
                <hr/>
                <p style="font-size: 0.85rem; color: #6B7280;">
                    L'équipe StockMedi
                </p>
            </div>
        `);

    await mailerSend.email.send(emailParams);
};

module.exports = { send2FACode, sendPasswordResetEmail, sendVerificationEmail };