/*const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@stockmedi.com';

async function sendEmail({ to, subject, html }) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
        if (error) console.error('❌ Erreur Resend:', error);
        else console.log(`✅ Email envoyé à ${to}`);
        return { data, error };
    } catch (err) {
        console.error('❌ Exception email:', err);
        return { error: err };
    }
}

module.exports = { sendEmail };
*/