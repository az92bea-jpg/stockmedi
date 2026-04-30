/**
 * CONTRÔLEUR CONTACT - Envoi d'email depuis le formulaire de contact
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.sendContactEmail = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        await transporter.sendMail({
            from: `"${name}" <${process.env.EMAIL_USER}>`,
            to: 'stockmedi.contact@gmail.com',
            replyTo: email,
            subject: `📩 Contact StockMedi - ${name}`,
            html: `
                <h2>Nouveau message de contact</h2>
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Message :</strong></p>
                <p>${message.replace(/\n/g, '<br/>')}</p>
            `
        });

        res.json({ success: true, message: 'Message envoyé avec succès' });
    } catch (error) {
        console.error('Erreur envoi contact:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi' });
    }
};