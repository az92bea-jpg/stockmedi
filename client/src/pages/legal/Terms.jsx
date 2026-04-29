/**
 * PAGE CONDITIONS D'UTILISATION
 * Version renforcée - Protection juridique complète
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const Terms = () => {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
                
                {/* Navigation retour */}
                <div style={{ marginBottom: '24px' }}>
                    <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        ← {t('back_to_dashboard') || 'Retour au tableau de bord'}
                    </Link>
                </div>
                
                {/* En-tête */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                        <Icon name="lock" category="actions" fallback="📜" style={{ width: '48px', height: '48px' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', color: '#111827', marginBottom: '8px' }}>
                        {t('terms_title') || 'Conditions générales d\'utilisation'}
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                        {t('terms_last_update') || 'Dernière mise à jour'}: {new Date().toLocaleDateString('fr-FR')}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Section 1 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="✅" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            1. {t('terms_acceptance') || 'Acceptation des conditions'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_acceptance_text') || 'En créant un compte et en utilisant StockMedi, vous reconnaissez avoir lu, compris et accepté les présentes conditions générales d\'utilisation. Si vous n\'acceptez pas ces conditions, vous ne devez pas utiliser le service.'}
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="📋" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            2. {t('terms_service') || 'Description du service'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_service_text') || 'StockMedi est une application SaaS de gestion pharmaceutique multi-espaces destinée aux pharmacies, cliniques, hôpitaux et autres établissements de santé. Le service inclut la gestion des stocks, des ventes, des devis, des employés et des rapports.'}
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="👤" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            3. {t('terms_account') || 'Création de compte'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_account_text') || 'Lors de la création de votre compte, vous vous engagez à :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_account_1') || 'Fournir des informations exactes et complètes'}</li>
                            <li> {t('terms_account_2') || 'Maintenir la confidentialité de vos identifiants de connexion'}</li>
                            <li> {t('terms_account_3') || 'Être responsable de toute activité effectuée sous votre compte'}</li>
                            <li> {t('terms_account_4') || 'Nous informer immédiatement de toute utilisation non autorisée de votre compte'}</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="💳" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            4. {t('terms_subscription') || 'Abonnement et paiement'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_subscription_text') || 'StockMedi propose des abonnements mensuels via Stripe. En souscrivant, vous acceptez que :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_sub_1') || 'Les frais d\'abonnement sont facturés mensuellement et non remboursables'}</li>
                            <li> {t('terms_sub_2') || 'Aucun remboursement partiel n\'est accordé pour les périodes non utilisées'}</li>
                            <li> {t('terms_sub_3') || 'Vous pouvez annuler votre abonnement à tout moment, l\'accès reste valide jusqu\'à la fin de la période payée'}</li>
                            <li> {t('terms_sub_4') || 'Les prix peuvent être modifiés avec un préavis de 30 jours'}</li>
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="⚠️" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            5. {t('terms_liability') || 'Limitation de responsabilité'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_liability_text') || 'StockMedi ne peut être tenu responsable :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_lia_1') || 'Des erreurs de saisie commises par l\'utilisateur'}</li>
                            <li> {t('terms_lia_2') || 'De la perte de données résultant d\'une mauvaise utilisation du service'}</li>
                            <li> {t('terms_lia_3') || 'Des interruptions de service temporaires pour maintenance'}</li>
                            <li> {t('terms_lia_4') || 'Des conséquences de décisions prises sur la base des rapports générés'}</li>
                            <li> {t('terms_lia_5') || 'Des dommages indirects (perte de clientèle, manque à gagner)'}</li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="🛡️" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            6. {t('terms_health_data') || 'Protection des données de santé'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_health_data_text') || 'StockMedi peut contenir des données liées aux patients (noms, téléphones, numéros d\'ordonnance). En tant que professionnel de santé, vous êtes responsable de :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_health_1') || 'Obtenir le consentement de vos patients pour le traitement de leurs données'}</li>
                            <li> {t('terms_health_2') || 'Respecter le secret médical et les réglementations locales'}</li>
                            <li> {t('terms_health_3') || 'Supprimer ou anonymiser les données patients avant suppression de votre compte'}</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="©️" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            7. {t('terms_ip') || 'Propriété intellectuelle'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_ip_text') || 'Tous les éléments de StockMedi sont protégés par les droits d\'auteur et la propriété intellectuelle :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_ip_1') || 'Le code source, l\'interface, le design et la marque StockMedi'}</li>
                            <li> {t('terms_ip_2') || 'La copie, reproduction ou réutilisation du service est strictement interdite'}</li>
                            <li> {t('terms_ip_3') || 'Vous ne pouvez pas revendre, sous-licencier ou louer l\'accès à StockMedi'}</li>
                        </ul>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="⚡" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            8. {t('terms_force_majeure') || 'Force majeure'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_force_majeure_text') || 'StockMedi ne peut être tenu responsable des retards ou manquements causés par des circonstances indépendantes de sa volonté : catastrophes naturelles, pannes de réseau, coupures d\'électricité, actes gouvernementaux, ou toute autre situation de force majeure.'}
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="🚫" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            9. {t('terms_termination') || 'Résiliation'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', marginBottom: '12px' }}>
                            {t('terms_termination_text') || 'StockMedi se réserve le droit de :'}
                        </p>
                        <ul style={{ color: '#4B5563', lineHeight: '1.6', paddingLeft: '24px' }}>
                            <li> {t('terms_term_1') || 'Suspendre ou résilier un compte en cas de non-respect des présentes conditions'}</li>
                            <li> {t('terms_term_2') || 'Supprimer les comptes inactifs depuis plus de 12 mois'}</li>
                            <li> {t('terms_term_3') || 'L\'utilisateur peut demander la suppression de son compte à tout moment avec un délai de rétractation de 7 jours'}</li>
                        </ul>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="⚖️" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            10. {t('terms_law') || 'Loi applicable'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_law_text') || 'Les présentes conditions sont régies par le droit guinéen. Tout litige relatif à l\'utilisation de StockMedi sera soumis aux tribunaux compétents de Conakry, République de Guinée.'}
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="success" category="status" fallback="🔄" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            11. {t('terms_changes') || 'Modifications des conditions'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_changes_text') || 'Ces conditions peuvent être modifiées à tout moment. Les utilisateurs seront informés des changements importants par email. La poursuite de l\'utilisation du service après modification vaut acceptation des nouvelles conditions.'}
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '12px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            12. {t('terms_contact') || 'Contact'}
                        </h2>
                        <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                            {t('terms_contact_text') || 'Pour toute question concernant ces conditions d\'utilisation :'}
                        </p>
                        <div style={{ backgroundColor: '#F3F4F6', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="email" category="status" fallback="📧" style={{ width: '16px', height: '16px' }} />
                                <strong>Email</strong> : <a href="mailto:stockmedi.contact@gmail.com" style={{ color: '#0F6B3A' }}>stockmedi.contact@gmail.com</a>
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="mobile" category="social" fallback="📞" style={{ width: '16px', height: '16px' }} />
                                <strong>{t('phone') || 'Téléphone'}</strong> : +224 623 679 567
                            </p>
                            <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="location" category="status" fallback="📍" style={{ width: '16px', height: '16px' }} />
                                <strong>{t('address') || 'Adresse'}</strong> : Conakry, Guinée
                            </p>
                        </div>
                    </section>
                </div>

                {/* Signature */}
                <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    <p>© {currentYear} StockMedi. {t('terms_footer') || 'Tous droits réservés.'}</p>
                    <p style={{ marginTop: '8px' }}>
                        {t('terms_version') || 'Version'} 1.0.0 | {t('terms_last_review') || 'Dernière révision'}: {new Date().toLocaleDateString('fr-FR')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Terms;