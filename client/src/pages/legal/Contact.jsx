/**
 * PAGE CONTACT
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/common/Alert';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setSuccess('✅ Message envoyé ! Nous vous répondrons dans les plus brefs délais.');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setSuccess(''), 5000);
    };

    const socialLinks = [
        { name: 'Facebook', url: 'https://facebook.com/stockmedi', icon: '📘', color: '#1877F2' },
        { name: 'WhatsApp', url: 'https://wa.me/224600000000', icon: '💬', color: '#25D366' },
        { name: 'Telegram', url: 'https://t.me/stockmedi', icon: '✈️', color: '#26A5E4' }
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 24px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '40px' }}>
                <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
                    ← Retour au tableau de bord
                </Link>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem' }}>📧</div>
                    <h1 style={{ color: '#111827', marginBottom: '8px' }}>Nous contacter</h1>
                    <p style={{ color: '#6B7280' }}>Une question ? Une suggestion ? Écrivez-nous !</p>
                </div>

                {success && <Alert type="success" message={success} />}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nom complet</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Jean Dupont"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="jean@exemple.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Message</label>
                        <textarea
                            className="form-textarea"
                            rows="5"
                            placeholder="Votre message..."
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        📧 Envoyer le message
                    </button>
                </form>

                <hr style={{ margin: '32px 0' }} />

                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Ou contactez-nous directement</h3>
                
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ margin: '8px 0' }}>📧 <a href="mailto:support@stockmedi.com" style={{ color: '#0F6B3A' }}>support@stockmedi.com</a></p>
                    <p style={{ margin: '8px 0' }}>📞 <a href="tel:+224600000000" style={{ color: '#0F6B3A' }}>+224 600 000 000</a></p>
                    <p style={{ margin: '8px 0' }}>📍 Conakry, Guinée</p>
                </div>

                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Suivez-nous</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {socialLinks.map((social) => (
                        <a
                            key={social.name}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: social.color,
                                color: 'white',
                                fontSize: '1.5rem',
                                textDecoration: 'none',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title={social.name}
                        >
                            {social.icon}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Contact;