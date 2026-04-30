const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendContactEmail = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        await resend.emails.send({
            from: 'StockMedi <onboarding@resend.dev>',
            to: 'stockmedi.contact@gmail.com',
            replyTo: email,
            subject: `✅ Contact StockMedi - ${name}`,
            html: `<h2>Nouveau message</h2><p><strong>Nom :</strong> ${name}</p><p><strong>Email :</strong> ${email}</p><p><strong>Message :</strong></p><p>${message}</p>`
        });

        res.json({ success: true, message: 'Message envoyé' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur' });
    }
};