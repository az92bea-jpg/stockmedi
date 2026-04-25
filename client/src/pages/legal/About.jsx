/**
 * PAGE À PROPOS - Présentation de StockMedi
 * Icônes SVG avec fallback emoji
 * Traductions FR/EN
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const About = () => {
    const { t } = useLanguage();
    
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
                
                <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    ← {t('back_to_dashboard') || 'Retour au tableau de bord'}
                </Link>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                        <Icon name="pill" category="nav" fallback="💊" style={{ width: '48px', height: '48px' }} />
                    </div>
                    <h1 style={{ color: '#111827', marginBottom: '8px' }}>
                        {t('about_title') || 'À propos de StockMedi'}
                    </h1>
                    <p style={{ color: '#6B7280' }}>
                        {t('about_version') || 'Version'} 1.0.0
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Mission */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="success" category="status" fallback="🎯" style={{ width: '20px', height: '20px' }} />
                            {t('about_mission_title') || 'Notre mission'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('about_mission_text') || 'StockMedi a pour mission de simplifier la gestion pharmaceutique pour les pharmacies, cliniques et hôpitaux. Notre application permet de gérer efficacement les stocks, les ventes et les employés en un seul endroit.'}
                        </p>
                    </section>

                    {/* Histoire */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="success" category="status" fallback="📖" style={{ width: '20px', height: '20px' }} />
                            {t('about_story_title') || 'Notre histoire'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('about_story_text') || 'Né d\'une volonté de digitaliser la gestion pharmaceutique en Afrique, StockMedi a été développé pour répondre aux besoins spécifiques des professionnels de santé guinéens et africains.'}
                        </p>
                    </section>

                    {/* Équipe */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="employees" category="nav" fallback="👥" style={{ width: '20px', height: '20px' }} />
                            {t('about_team_title') || 'Notre équipe'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('about_team_text') || 'Développé par'} <strong>Alexis Zézé Béavogui</strong>, {t('about_team_text2') || 'passionné par les solutions digitales pour le secteur de la santé. StockMedi est le fruit d\'un travail collaboratif avec des professionnels de santé pour créer un outil adapté aux réalités du terrain.'}
                        </p>
                    </section>

                    {/* {/* Valeurs */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="success" category="status" fallback="⭐" style={{ width: '20px', height: '20px' }} />
                            {t('about_values_title') || 'Nos valeurs'}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                            
                            <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Icon name="lock" category="actions" fallback="🔒" style={{ width: '22px', height: '22px', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{t('about_value_security') || 'Sécurité'}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>{t('about_value_security_text') || 'Protection des données sensibles'}</span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#EFF6FF', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Icon name="globe" category="actions" fallback="🌍" style={{ width: '22px', height: '22px', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{t('about_value_accessibility') || 'Accessibilité'}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>{t('about_value_accessibility_text') || 'Solution adaptée aux besoins africains'}</span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#FFF7ED', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Icon name="idea" category="actions" fallback="💡" style={{ width: '22px', height: '22px', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{t('about_value_innovation') || 'Innovation'}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>{t('about_value_innovation_text') || 'Technologies modernes au service de la santé'}</span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#FEF2F2', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Icon name="handshake" category="actions" fallback="🤝" style={{ width: '22px', height: '22px', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{t('about_value_proximity') || 'Proximité'}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>{t('about_value_proximity_text') || 'Support et accompagnement personnalisés'}</span>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px' }} />
                            {t('about_contact_title') || 'Contact'}
                        </h2>
                        <div style={{ backgroundColor: '#F3F4F6', padding: '16px', borderRadius: '8px' }}>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px' }} />
                                <a href="mailto:azbea.lomagui@gmail.com" style={{ color: '#0F6B3A' }}>support@stockmedi.com</a>
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="mobile" category="social" fallback="📞" style={{ width: '20px', height: '20px' }} />
                                <a href="tel:+224623679567" style={{ color: '#0F6B3A' }}>+224 600 000 000</a>
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="location" category="status" fallback="📍" style={{ width: '20px', height: '20px' }} />
                                Conakry, Guinée
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                <Icon name="globe" category="actions" fallback="🌐" style={{ width: '20px', height: '20px' }} />
                                {t('about_follow_us') || 'Suivez-nous'} : 
                                <a href="https://facebook.com/stockmedi" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6B3A', marginLeft: '8px' }}>
                                    <Icon name="facebook" category="social" fallback="📘" style={{ width: '20px', height: '20px' }} />
                                </a>
                                <a href="https://wa.me/224623679567" target="_blank" rel="noopener noreferrer" style={{ color: '#0F6B3A', marginLeft: '8px' }}>
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
        </div>
    );
};

export default About;