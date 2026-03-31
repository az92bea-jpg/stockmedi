/**
 * COMPOSANT FOOTER - Pied de page professionnel
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { name: 'Facebook', url: 'https://facebook.com/stockmedi', icon: '📘', color: '#1877F2' },
        { name: 'WhatsApp', url: 'https://wa.me/224600000000', icon: '💬', color: '#25D366' },
        { name: 'Telegram', url: 'https://t.me/stockmedi', icon: '✈️', color: '#26A5E4' }
    ];

    return (
        <footer style={{
            backgroundColor: '#111827',
            color: '#9CA3AF',
            padding: '32px 24px 24px',
            marginTop: 'auto',
            borderTop: '1px solid #1F2937',
            width: '100%',
            boxSizing: 'border-box',
            flexShrink: 0
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '32px',
                marginBottom: '32px'
            }}>
                {/* Colonne 1 - Logo et description */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '1.5rem' }}>💊</span>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1.125rem' }}>{t('app_name')}</h3>
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '16px' }}>
                        {t('footer_description') || 'Solution de gestion pharmaceutique multi-espaces pour pharmacies, cliniques et hôpitaux.'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#9CA3AF',
                                    textDecoration: 'none',
                                    fontSize: '1.25rem',
                                    transition: 'all 0.2s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = social.color;
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.color = '#9CA3AF';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title={social.name}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Colonne 2 - Liens rapides */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '1rem' }}>{t('footer_quick_links') || 'Liens rapides'}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/dashboard" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📊 {t('nav_dashboard')}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/products" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📦 {t('nav_products')}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/sales" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                💰 {t('nav_sales')}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/reports" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📄 {t('nav_reports')}
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Colonne 3 - Informations légales */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '1rem' }}>{t('footer_information') || 'Informations'}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/about" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📖 {t('footer_about') || 'À propos'}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                🔒 {t('footer_privacy') || 'Confidentialité'}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📜 {t('footer_terms') || "Conditions d'utilisation"}
                            </Link>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                            <Link to="/contact" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
                                📧 {t('footer_contact') || 'Contact'}
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Colonne 4 - Contact */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '1rem' }}>{t('footer_contact_title') || 'Contact'}</h4>
                    <p style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        📧 <a href="mailto:support@stockmedi.com" style={{ color: '#9CA3AF', textDecoration: 'none' }}>support@stockmedi.com</a>
                    </p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        📞 <a href="tel:+224600000000" style={{ color: '#9CA3AF', textDecoration: 'none' }}>+224 600 000 000</a>
                    </p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        🕒 {t('footer_hours') || 'Lundi - Vendredi: 8h - 18h'}
                    </p>
                </div>
            </div>

            {/* Séparateur */}
            <div style={{ height: '1px', backgroundColor: '#1F2937', marginBottom: '24px' }} />

            {/* Copyright */}
            <div style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#6B7280',
                paddingBottom: '8px'
            }}>
                <p>© {currentYear} {t('app_name')}. {t('footer_copyright') || 'Tous droits réservés.'}</p>
                <p style={{ marginTop: '8px' }}>
                    {t('footer_version') || 'Version'} 1.0.0 | {t('footer_developed') || 'Développé avec'} 💊 {t('footer_for_health') || 'pour la santé'}
                </p>
            </div>
        </footer>
    );
};

export default Footer;