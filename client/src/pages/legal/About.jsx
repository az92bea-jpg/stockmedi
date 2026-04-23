/**
 * PAGE À PROPOS - Présentation de StockMedi
 * ⭐ Icônes SVG avec fallback emoji
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

const About = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#D1D5DB', padding: '40px 24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'green', borderRadius: '16px', padding: '40px' }}>
                <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
                    ← Retour au tableau de bord
                </Link>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem' }}>
                        <Icon name="pill" category="nav" fallback="💊" style={{ width: '48px', height: '48px' }} />
                    </div>
                    <h1 style={{ color: '#111827', marginBottom: '8px' }}>À propos de StockMedi</h1>
                    <p style={{ color: '#6B7280' }}>Version 1.0.0</p>
                </div>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>Notre mission</h2>
                    <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                        StockMedi a pour mission de simplifier la gestion pharmaceutique pour les pharmacies, 
                        cliniques et hôpitaux. Notre application permet de gérer efficacement les stocks, 
                        les ventes et les employés en un seul endroit.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>Notre histoire</h2>
                    <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                        Né d'une volonté de digitaliser la gestion pharmaceutique en Afrique, StockMedi a été développé 
                        pour répondre aux besoins spécifiques des professionnels de santé guinéens et africains.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>Notre équipe</h2>
                    <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                        Développé par <strong>Alexis Zézé Béavogui</strong>, passionné par les solutions digitales pour le secteur de la santé. 
                        StockMedi est le fruit d'un travail collaboratif avec des professionnels de santé pour créer un outil 
                        adapté aux réalités du terrain.
                    </p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>Nos valeurs</h2>
                    <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="lock" category="actions" fallback="🔒" style={{ width: '20px', height: '20px' }} />
                            <strong>Sécurité</strong> - Protection des données sensibles
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="globe" category="actions" fallback="🌍" style={{ width: '20px', height: '20px' }} />
                            <strong>Accessibilité</strong> - Solution adaptée aux besoins africains
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="idea" category="actions" fallback="💡" style={{ width: '20px', height: '20px' }} />
                            <strong>Innovation</strong> - Technologies modernes au service de la santé
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="handshake" category="actions" fallback="🤝" style={{ width: '20px', height: '20px' }} />
                            <strong>Proximité</strong> - Support et accompagnement personnalisés
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>Contact</h2>
                    <div style={{ backgroundColor: '#F3F4F6', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px' }} />
                            <a href="mailto:support@stockmedi.com" style={{ color: '#0F6B3A' }}>support@stockmedi.com</a>
                        </p>
                        <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="phone" category="status" fallback="📞" style={{ width: '20px', height: '20px' }} />
                            <a href="tel:+224600000000" style={{ color: '#0F6B3A' }}>+224 600 000 000</a>
                        </p>
                        <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="location" category="status" fallback="📍" style={{ width: '20px', height: '20px' }} />
                            Conakry, Guinée
                        </p>
                        <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Icon name="globe" category="actions" fallback="🌐" style={{ width: '20px', height: '20px' }} />
                            Suivez-nous : 
                            <a href="https://facebook.com/stockmedi" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6B3A', marginLeft: '8px' }}>
                                <Icon name="facebook" category="social" fallback="📘" style={{ width: '20px', height: '20px' }} />
                            </a>
                            <a href="https://wa.me/224600000000" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6B3A', marginLeft: '8px' }}>
                                <Icon name="whatsapp" category="social" fallback="💬" style={{ width: '20px', height: '20px' }} />
                            </a>
                            <a href="https://t.me/stockmedi" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6B3A', marginLeft: '8px' }}>
                                <Icon name="telegram" category="social" fallback="✈️" style={{ width: '20px', height: '20px' }} />
                            </a>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;