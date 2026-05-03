const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY
});

const sentFrom = new Sender(
    'MS_trial@test-65qngkd16o3lwr12.mlsender.net',
    'StockMedi'
);

exports.sendContactEmail = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        // Email à l'admin
        const adminEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">✅ Nouveau message de contact</h2>
                <hr />
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                <h3>Message :</h3>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0;">${message}</p>
                </div>
                <hr />
                <p><em>Envoyé depuis le formulaire de contact StockMedi.</em></p>
            </div>
        `;

        // Email de confirmation au client
        const clientEmailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0F6B3A;">Votre message a bien été reçu !</h2>
                <p>Bonjour ${name.split(' ')[0]},</p>
                <p>Nous avons bien reçu votre message et nous vous en remercions.</p>
                <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0;">🕐 <strong>Votre message est en cours de traitement.</strong></p>
                    <p style="margin: 8px 0 0;">Notre équipe examine votre demande et vous répondra 
                    dans les plus brefs délais, généralement sous <strong>24 à 48 heures</strong>.</p>
                </div>
                <h3 style="color: #0F6B3A;">Récapitulatif de votre message :</h3>
                <div style="background: #F9FAFB; padding: 16px; border-left: 4px solid #0F6B3A; border-radius: 4px;">
                    <p style="margin: 0; color: #4B5563;">${message}</p>
                </div>
                <br/>
                <p>En attendant, vous pouvez consulter notre 
                   <a href="${process.env.FRONTEND_URL}/guide" style="color: #0F6B3A;">guide utilisateur</a> 
                   ou notre 
                   <a href="${process.env.FRONTEND_URL}/faq" style="color: #0F6B3A;">FAQ</a> 
                   pour trouver des réponses à vos questions.
                </p>
                <hr />
                <p>Cordialement,</p>
                <p><strong>L'équipe StockMedi</strong></p>
                <p><small style="color: #6B7280;">Cet email est automatique, merci de ne pas y répondre directement.<br/>
                Pour toute question, utilisez notre 
                <a href="${process.env.FRONTEND_URL}/contact" style="color: #0F6B3A;">formulaire de contact</a>.
                </small></p>
            </div>
        `;

        // Envoyer email à l'admin
        await mailerSend.email.send(
            new EmailParams()
                .setFrom(sentFrom)
                .setTo([new Recipient('stockmedi.contact@gmail.com')])
                .setReplyTo(new Sender(email, name))
                .setSubject(`✅ [StockMedi] Contact - ${name}`)
                .setHtml(adminEmailContent)
        );

        // Envoyer confirmation automatique au client
        await mailerSend.email.send(
            new EmailParams()
                .setFrom(sentFrom)
                .setTo([new Recipient(email)])
                .setSubject(`✅ [StockMedi] Votre message a bien été reçu`)
                .setHtml(clientEmailContent)
        );

        console.log(`📧 Contact → admin + confirmation client (${email})`);

        res.json({
            success: true,
            message: 'Message envoyé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur envoi contact:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message'
        });
    }
};