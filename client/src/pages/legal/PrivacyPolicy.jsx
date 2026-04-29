/**
 * PAGE CHARTE DE CONFIDENTIALITÉ - Mentions légales
 * Icônes SVG avec fallback emoji
 * Section Cookies ajoutée
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const PrivacyPolicy = () => {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F9FAFB',
            padding: '40px 24px'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '40px',
                animation: 'fadeIn 0.3s ease'
            }}>
                {/* Navigation retour */}
                <div style={{ marginBottom: '24px' }}>
                    <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        ← {t('back_to_dashboard') || 'Retour au tableau de bord'}
                    </Link>
                </div>

                {/* En-tête */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                        <Icon name="lock" category="actions" fallback="🔒" style={{ width: '48px', height: '48px' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', color: '#111827', marginBottom: '8px' }}>
                        {t('privacy_title') || 'Charte de confidentialité'}
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {t('privacy_last_update') || 'Dernière mise à jour'}: {new Date().toLocaleDateString('fr-FR')}
                    </p>
                </div>

                {/* Contenu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Section 1 - Introduction */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            1. {t('privacy_intro_title') || 'Introduction'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_intro_text') || 'StockMedi s\'engage à protéger vos données personnelles. Cette charte de confidentialité explique quelles informations nous collectons, comment nous les utilisons et comment vous pouvez les contrôler.'}
                        </p>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('privacy_intro_text2') || 'En utilisant StockMedi, vous acceptez les pratiques décrites dans ce document.'}
                        </p>
                    </section>

                    {/* Section 2 - Données collectées */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            2. {t('privacy_data_collected') || 'Données collectées'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_data_collected_text') || 'Nous collectons les informations suivantes :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li><strong>{t('privacy_account') || 'Informations de compte'}</strong> : {t('privacy_account_text') || 'nom, prénom, email, téléphone'}</li>
                            <li><strong>{t('privacy_company') || 'Informations d\'entreprise'}</strong> : {t('privacy_company_text') || 'nom, adresse, type d\'établissement'}</li>
                            <li><strong>{t('privacy_activity') || 'Données d\'activité'}</strong> : {t('privacy_activity_text') || 'produits, ventes, employés, paramètres'}</li>
                            <li><strong>{t('privacy_payment') || 'Données de paiement'}</strong> : {t('privacy_payment_text') || 'traitées par Stripe (nous ne stockons pas les données de carte)'}</li>
                        </ul>
                    </section>

                    {/* Section 3 - Utilisation des données */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            3. {t('privacy_data_usage') || 'Utilisation des données'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_data_usage_text') || 'Vos données sont utilisées pour :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>                  {/* ✓ Valider en cas de besoin marqueur emoji*/}
                            <li> {t('privacy_usage_1') || 'Gérer votre compte et votre abonnement'}</li>
                            <li> {t('privacy_usage_2') || 'Traiter vos ventes et votre stock'}</li>
                            <li> {t('privacy_usage_3') || 'Générer vos rapports'}</li>
                            <li> {t('privacy_usage_4') || 'Améliorer nos services'}</li>
                            <li> {t('privacy_usage_5') || 'Vous contacter concernant votre abonnement'}</li>
                        </ul>
                    </section>

                    {/* Section 4 - Partage des données */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            4. {t('privacy_data_sharing') || 'Partage des données'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_data_sharing_text') || 'Nous ne vendons jamais vos données à des tiers. Vos données peuvent être partagées avec :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> <strong>Stripe</strong> : {t('privacy_sharing_stripe') || 'pour les paiements (données de carte non stockées)'}</li>  {/* • Point marqueur emoji*/}
                            <li> <strong>MongoDB Atlas</strong> : {t('privacy_sharing_mongodb') || 'pour l\'hébergement sécurisé des données'}</li>
                            <li> <strong>Autorités légales</strong> : {t('privacy_sharing_legal') || 'si requis par la loi'}</li>
                        </ul>
                    </section>

                    {/* Section 5 - Sécurité des données */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            5. {t('privacy_security') || 'Sécurité des données'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_security_text') || 'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="lock" category="actions" fallback="🔐" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_security_1') || 'Chiffrement des mots de passe (SHA256)'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_security_2') || 'Authentification par token JWT'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="lock" category="actions" fallback="🔒" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_security_3') || 'Connexion HTTPS'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="👥" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_security_4') || 'Accès restreint aux données'}
                            </li>
                        </ul>
                    </section>

                    {/* Section 6 - Conservation des données */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            6. {t('privacy_retention') || 'Conservation des données'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('privacy_retention_text') || 'Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont anonymisées dans un délai de 30 jours, sauf obligation légale de conservation.'}
                        </p>
                    </section>

                    {/* Section 7 - Vos droits */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            7. {t('privacy_rights') || 'Vos droits'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('privacy_rights_text') || 'Conformément au RGPD, vous disposez des droits suivants :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_rights_1') || 'Droit d\'accès à vos données'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_rights_2') || 'Droit de rectification'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_rights_3') || 'Droit à l\'effacement'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_rights_4') || 'Droit à la portabilité'}
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '16px', height: '16px' }} />
                                {t('privacy_rights_5') || 'Droit d\'opposition'}
                            </li>
                        </ul>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginTop: '12px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                            {t('privacy_rights_contact') || 'Pour exercer vos droits, contactez-nous à :'}{' '}
                            <a href="mailto:stockmedi.contact@gmail.com" style={{ color: '#0F6B3A' }}>privacy@stockmedi.com</a>
                        </p>
                    </section>

                    {/* Section 8 - Cookies */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '16px' }}>
                            <Icon name="lock" category="actions" fallback="🔐" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
                            8. {t('privacy_cookies') || 'Cookies'}
                        </h2>
                        
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '16px' }}>
                            {t('privacy_cookies_text') || 'StockMedi utilise des cookies strictement nécessaires au fonctionnement du service :'}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            
                            <div style={{ 
                                backgroundColor: '#F0FDF4', 
                                padding: '14px 16px', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="lock" category="actions" fallback="🔐" style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px' }} />
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <strong style={{ display: 'block', marginBottom: '2px' }}>
                                        {t('privacy_cookie_auth') || 'Authentification'}
                                    </strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                                        {t('privacy_cookie_auth_text') || 'pour maintenir votre connexion sécurisée'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ 
                                backgroundColor: '#EFF6FF', 
                                padding: '14px 16px', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="success" category="status" fallback="✅" style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px' }} />
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <strong style={{ display: 'block', marginBottom: '2px' }}>
                                        {t('privacy_cookie_stripe') || 'Paiement Stripe'}
                                    </strong>
                                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                                        {t('privacy_cookie_stripe_text') || 'cookies gérés par Stripe pour la sécurité des transactions'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            backgroundColor: '#F3F4F6', 
                            padding: '12px 16px', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            flexWrap: 'wrap'
                        }}>
                            <Icon name="mobile" category="social" fallback="📱" style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.6' }}>
                                {t('privacy_cookies_no_tracking') || 'Nous n\'utilisons aucun cookie publicitaire ou de tracking. Aucun consentement n\'est requis pour les cookies essentiels.'}
                            </span>
                        </div>
                    </section>

                    {/* Section 9 - Contact */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '16px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
                            9. {t('privacy_contact') || 'Contact'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '16px' }}>
                            {t('privacy_contact_text') || 'Pour toute question concernant cette politique de confidentialité, vous pouvez nous joindre:'}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            
                            <div style={{ 
                                backgroundColor: '#F3F4F6', 
                                padding: '12px 16px', 
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                <strong style={{ whiteSpace: 'nowrap' }}>Email :</strong>
                                <a href="mailto:stockmedi.contact@gmail.com" style={{ color: '#0F6B3A', wordBreak: 'break-all' }}>stockmedi.contact@gmail.com</a>
                            </div>

                            <div style={{ 
                                backgroundColor: '#F3F4F6', 
                                padding: '12px 16px', 
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                <strong style={{ whiteSpace: 'nowrap' }}>DPO :</strong>
                                <a href="mailto:stockmedi.contact@gmail.com" style={{ color: '#0F6B3A', wordBreak: 'break-all' }}>stockmedi.contact@gmail.com</a>
                            </div>

                            <div style={{ 
                                backgroundColor: '#F3F4F6', 
                                padding: '12px 16px', 
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="mobile" category="social" fallback="📞" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                <strong style={{ whiteSpace: 'nowrap' }}>{t('phone') || 'Téléphone'} :</strong>
                                <span>+224 623 679 567</span>
                            </div>

                            <div style={{ 
                                backgroundColor: '#F3F4F6', 
                                padding: '12px 16px', 
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <Icon name="location" category="status" fallback="📍" style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                <strong style={{ whiteSpace: 'nowrap' }}>{t('address') || 'Adresse'} :</strong>
                                <span>Conakry, Guinée</span>
                            </div>
                        </div>
                    </section>
                    {/* Section 10 - Modifications */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            10. {t('privacy_changes') || 'Modifications de la charte'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('privacy_changes_text') || 'Nous pouvons modifier cette charte de confidentialité. Les modifications seront publiées sur cette page avec une date de mise à jour. Nous vous informerons des changements importants par email.'}
                        </p>
                    </section>
                </div>

                {/* Signature */}
                <div style={{
                    marginTop: '40px',
                    paddingTop: '24px',
                    borderTop: '1px solid #E5E7EB',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#9CA3AF'
                }}>
                    <p>© {currentYear} StockMedi. {t('privacy_footer') || 'Tous droits réservés.'}</p>
                    <p style={{ marginTop: '8px' }}>
                        {t('privacy_version') || 'Version'} 1.0.0 | {t('privacy_last_review') || 'Dernière révision'}: {new Date().toLocaleDateString('fr-FR')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;