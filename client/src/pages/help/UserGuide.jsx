/**
 * PAGE GUIDE UTILISATEUR
 * Documentation intégrée pour les utilisateurs de StockMedi
 * Icônes SVG avec fallback emoji — Toutes les icônes codées
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const UserGuide = () => {
    const { t } = useLanguage();

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', animation: 'fadeIn var(--transition-normal)' }}>
            
            {/* En-tête */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                    <Icon name="info" category="status" fallback="📖" style={{ width: '48px', height: '48px' }} />
                </div>
                <h1 style={{ color: 'var(--primary-500)', marginBottom: '8px' }}>
                    {t('user_guide') || 'Guide utilisateur StockMedi'}
                </h1>
                <p style={{ color: 'var(--gray-500)' }}>
                    Apprenez à utiliser toutes les fonctionnalités de votre espace pharmaceutique
                </p>
                <Link to="/dashboard" style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary-500)' }}>
                    <Icon name="back" category="actions" fallback="←" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                    Retour au tableau de bord
                </Link>
            </div>

            {/* Sommaire */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    <h3>
                        <Icon name="info" category="status" fallback="📑" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        Sommaire
                    </h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                        {[
                            { href: '#getting-started', icon: 'success', fallback: '🚀', label: '1. Démarrer avec StockMedi' },
                            { href: '#products', icon: 'products', fallback: '📦', label: '2. Gérer vos produits' },
                            { href: '#sales', icon: 'sales', fallback: '💰', label: '3. Réaliser une vente' },
                            { href: '#quotes', icon: 'document', fallback: '📄', label: '4. Créer un devis' },
                            { href: '#employees', icon: 'employees', fallback: '👥', label: '5. Gérer vos employés' },
                            { href: '#patients', icon: 'patients', fallback: '🩺', label: '6. Dossiers patients (DPP)' },
                            { href: '#suppliers', icon: 'suppliers', fallback: '🏭', label: '7. Gérer vos fournisseurs' },
                            { href: '#reports', icon: 'reports', fallback: '📊', label: '8. Exporter des rapports' },
                            { href: '#subscription', icon: 'subscription', fallback: '💎', label: '9. Gérer votre abonnement' },
                            { href: '#settings', icon: 'settings', fallback: '⚙️', label: '10. Paramètres et sécurité' }
                        ].map((item, i) => (
                            <a key={i} href={item.href} style={{ color: 'var(--primary-500)', textDecoration: 'none', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name={item.icon} category="nav" fallback={item.fallback} style={{ width: '16px', height: '16px' }} />
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 1 : Démarrer */}
            <div className="card" style={{ marginBottom: '32px' }} id="getting-started">
                <div className="card-header">
                    <h3>
                        <Icon name="success" category="status" fallback="🚀" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        1. Démarrer avec StockMedi
                    </h3>
                </div>
                <div className="card-body">
                    <h4 style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="add" category="actions" fallback="📝" style={{ width: '16px', height: '16px' }} />
                        Créer votre compte
                    </h4>
                    <ol style={{ lineHeight: '2' }}>
                        <li>Allez sur <strong>https://stockmedi.vercel.app/register</strong></li>
                        <li>Remplissez vos informations personnelles (nom, prénom, email)</li>
                        <li>Choisissez un <strong>mot de passe sécurisé</strong> (8+ caractères, majuscule, minuscule, chiffre, spécial)</li>
                        <li>Remplissez le nom de votre entreprise</li>
                        <li>Cochez <strong>"J'accepte les conditions d'utilisation"</strong></li>
                        <li>Cliquez sur <strong>"Créer mon espace entreprise"</strong></li>
                    </ol>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="login" category="actions" fallback="🔐" style={{ width: '16px', height: '16px' }} />
                        Se connecter
                    </h4>
                    <ol style={{ lineHeight: '2' }}>
                        <li>Allez sur <strong>https://stockmedi.vercel.app/login</strong></li>
                        <li>Saisissez votre email et mot de passe</li>
                        <li>Si vous avez oublié votre mot de passe, cliquez sur <strong>"Mot de passe oublié ?"</strong></li>
                    </ol>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="dashboard" category="nav" fallback="📊" style={{ width: '16px', height: '16px' }} />
                        Le tableau de bord
                    </h4>
                    <ul style={{ lineHeight: '2' }}>
                        <li><Icon name="sales" category="nav" fallback="💰" style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Chiffre d'affaires du jour et du mois</li>
                        <li><Icon name="products" category="nav" fallback="📦" style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Nombre de produits en stock</li>
                        <li><Icon name="warning" category="status" fallback="⚠️" style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Alertes : stocks faibles, expirations imminentes</li>
                        <li><Icon name="success" category="status" fallback="🏆" style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Top produits les plus vendus</li>
                        <li><Icon name="idea" category="actions" fallback="⚡" style={{ width: '14px', height: '14px', marginRight: '4px' }} /> Actions rapides</li>
                    </ul>
                </div>
            </div>

            {/* Section 2 : Produits */}
            <div className="card" style={{ marginBottom: '32px' }} id="products">
                <div className="card-header">
                    <h3>
                        <Icon name="products" category="nav" fallback="📦" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        2. Gérer vos produits
                    </h3>
                </div>
                <div className="card-body">
                    <h4 style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="add" category="actions" fallback="➕" style={{ width: '16px', height: '16px' }} />
                        Ajouter un produit
                    </h4>
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, cliquez sur <strong>"Produits"</strong></li>
                        <li>Cliquez sur <strong>"Nouveau produit"</strong></li>
                        <li>Remplissez les champs : nom, prix d'achat, prix de vente, date d'expiration</li>
                        <li>Cliquez sur <strong>"Ajouter"</strong></li>
                    </ol>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="edit" category="actions" fallback="✏️" style={{ width: '16px', height: '16px' }} />
                        Modifier un produit
                    </h4>
                    <p>Dans la liste, cliquez sur l'icône <Icon name="edit" category="actions" fallback="✏️" style={{ width: '14px', height: '14px' }} /> pour modifier.</p>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="search" category="actions" fallback="🔍" style={{ width: '16px', height: '16px' }} />
                        Rechercher un produit
                    </h4>
                    <p>Utilisez la barre de recherche. Vous pouvez chercher par nom, nom générique (DCI) ou code-barres.</p>

                    <div style={{ backgroundColor: '#FEF3C7', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', border: '1px solid #F59E0B' }}>
                        <Icon name="warning" category="status" fallback="⚠️" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        <strong>Important :</strong> Les produits expirés apparaissent en rouge. StockMedi vous alerte automatiquement.
                    </div>
                </div>
            </div>

            {/* Section 3 : Ventes */}
            <div className="card" style={{ marginBottom: '32px' }} id="sales">
                <div className="card-header">
                    <h3>
                        <Icon name="sales" category="nav" fallback="💰" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        3. Réaliser une vente
                    </h3>
                </div>
                <div className="card-body">
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, cliquez sur <strong>"Ventes"</strong></li>
                        <li>Recherchez le produit par nom, générique ou code-barres</li>
                        <li>Cliquez sur le produit pour l'ajouter au panier</li>
                        <li>Optionnel : ajoutez un nom de client, téléphone, N° d'ordonnance</li>
                        <li>Ajoutez une remise si nécessaire (<Icon name="money" category="status" fallback="💵" style={{ width: '12px', height: '12px' }} /> GNF ou %)</li>
                        <li>Sélectionnez le mode de paiement : <Icon name="money" category="status" fallback="💵" style={{ width: '12px', height: '12px' }} /> espèces, <Icon name="card" category="actions" fallback="💳" style={{ width: '12px', height: '12px' }} /> carte, <Icon name="mobile" category="social" fallback="📱" style={{ width: '12px', height: '12px' }} /> mobile money</li>
                        <li>Cliquez sur <strong>"Valider la vente"</strong></li>
                        <li>Un reçu est généré automatiquement (<Icon name="pdf" category="actions" fallback="📄" style={{ width: '12px', height: '12px' }} /> PDF, <Icon name="print" category="actions" fallback="🖨️" style={{ width: '12px', height: '12px' }} /> imprimable)</li>
                    </ol>
                </div>
            </div>

            {/* Section 4 : Devis */}
            <div className="card" style={{ marginBottom: '32px' }} id="quotes">
                <div className="card-header">
                    <h3>
                        <Icon name="document" category="nav" fallback="📄" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        4. Créer un devis
                    </h3>
                </div>
                <div className="card-body">
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, cliquez sur <strong>"Devis"</strong></li>
                        <li>Cliquez sur <strong>"Nouveau devis"</strong></li>
                        <li>Ajoutez les produits et informations client</li>
                        <li>Cliquez sur <strong>"Générer le devis"</strong></li>
                        <li>Le devis est valable <strong>7 jours</strong> et convertible en vente en un clic</li>
                    </ol>
                </div>
            </div>

            {/* Section 5 : Employés */}
            <div className="card" style={{ marginBottom: '32px' }} id="employees">
                <div className="card-header">
                    <h3>
                        <Icon name="employees" category="nav" fallback="👥" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        5. Gérer vos employés
                    </h3>
                </div>
                <div className="card-body">
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, cliquez sur <strong>"Employés"</strong></li>
                        <li>Cliquez sur <strong>"Ajouter un employé"</strong></li>
                        <li>Remplissez ses informations et choisissez sa discipline</li>
                        <li>Cochez les permissions adaptées (<Icon name="sales" category="nav" fallback="💰" style={{ width: '12px', height: '12px' }} /> ventes, <Icon name="products" category="nav" fallback="📦" style={{ width: '12px', height: '12px' }} /> stock, <Icon name="reports" category="nav" fallback="📊" style={{ width: '12px', height: '12px' }} /> rapports)</li>
                        <li>Utilisez <Icon name="lock" category="actions" fallback="🔒" style={{ width: '12px', height: '12px' }} /> pour bloquer/débloquer un employé</li>
                    </ol>
                </div>
            </div>

            {/* Section 6 : Patients */}
            <div className="card" style={{ marginBottom: '32px' }} id="patients">
                <div className="card-header">
                    <h3>
                        <Icon name="patients" category="nav" fallback="🩺" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        6. Dossiers Pharmaceutiques Patients (DPP)
                    </h3>
                </div>
                <div className="card-body">
                    <p><strong>Plan Enterprise requis.</strong></p>
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, cliquez sur <strong>"Patients"</strong></li>
                        <li>Cliquez sur <strong>"Nouveau dossier"</strong></li>
                        <li>Renseignez les antécédents médicaux</li>
                        <li>Ajoutez des suivis de traitement (<Icon name="treatment" category="actions" fallback="💊" style={{ width: '12px', height: '12px' }} />)</li>
                        <li>Ajoutez des constantes (<Icon name="vitals" category="actions" fallback="🩺" style={{ width: '12px', height: '12px' }} />)</li>
                        <li>Téléchargez la fiche en <Icon name="pdf" category="actions" fallback="📄" style={{ width: '12px', height: '12px' }} /> PDF</li>
                    </ol>
                </div>
            </div>

            {/* Section 7 : Fournisseurs */}
            <div className="card" style={{ marginBottom: '32px' }} id="suppliers">
                <div className="card-header">
                    <h3>
                        <Icon name="suppliers" category="nav" fallback="🏭" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        7. Gérer vos fournisseurs
                    </h3>
                </div>
                <div className="card-body">
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, ouvrez <strong>"Activités"</strong> → <strong>"Fournisseurs"</strong></li>
                        <li>Cliquez sur <strong>"Nouveau fournisseur"</strong></li>
                        <li>Remplissez : nom, téléphone, email, ville, contact</li>
                        <li>Utilisez <Icon name="eye" category="actions" fallback="👁️" style={{ width: '12px', height: '12px' }} /> pour voir la fiche détaillée</li>
                        <li>Téléchargez la fiche en <Icon name="pdf" category="actions" fallback="📄" style={{ width: '12px', height: '12px' }} /> PDF</li>
                    </ol>
                </div>
            </div>

            {/* Section 8 : Rapports */}
            <div className="card" style={{ marginBottom: '32px' }} id="reports">
                <div className="card-header">
                    <h3>
                        <Icon name="reports" category="nav" fallback="📊" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        8. Exporter des rapports
                    </h3>
                </div>
                <div className="card-body">
                    <h4 style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="products" category="nav" fallback="📦" style={{ width: '16px', height: '16px' }} />
                        Rapport d'inventaire
                    </h4>
                    <p>Exportez la liste complète de vos produits en <Icon name="pdf" category="actions" fallback="📄" style={{ width: '12px', height: '12px' }} /> PDF ou <Icon name="excel" category="actions" fallback="📊" style={{ width: '12px', height: '12px' }} /> Excel.</p>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="sales" category="nav" fallback="💰" style={{ width: '16px', height: '16px' }} />
                        Rapport des ventes
                    </h4>
                    <p>Exportez l'historique des ventes avec filtres par période en <Icon name="excel" category="actions" fallback="📊" style={{ width: '12px', height: '12px' }} /> Excel.</p>
                </div>
            </div>

            {/* Section 9 : Abonnement */}
            <div className="card" style={{ marginBottom: '32px' }} id="subscription">
                <div className="card-header">
                    <h3>
                        <Icon name="subscription" category="nav" fallback="💎" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        9. Gérer votre abonnement
                    </h3>
                </div>
                <div className="card-body">
                    <h4 style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="info" category="status" fallback="📋" style={{ width: '16px', height: '16px' }} />
                        Plans disponibles
                    </h4>
                    <ul style={{ lineHeight: '2' }}>
                        <li><Icon name="success" category="status" fallback="🆓" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> <strong>Essai gratuit</strong> : 30 jours, 50 produits, 3 employés</li>
                        <li><Icon name="subscription" category="nav" fallback="💎" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> <strong>Basic</strong> : 8,99 €/mois, 500 produits, 10 employés</li>
                        <li><Icon name="subscription" category="nav" fallback="💎" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> <strong>Premium</strong> : 18,99 €/mois, 2000 produits, 30 employés</li>
                        <li><Icon name="subscription" category="nav" fallback="💎" style={{ width: '12px', height: '12px', marginRight: '4px' }} /> <strong>Enterprise</strong> : 47,99 €/mois, illimité, multi-établissements, dossiers patients</li>
                    </ul>
                    <ol style={{ lineHeight: '2' }}>
                        <li>Dans le menu latéral, ouvrez <strong>"Administration"</strong> → <strong>"Abonnement"</strong></li>
                        <li>Choisissez votre plan et cliquez sur <strong>"S'abonner"</strong></li>
                        <li>Payez par <Icon name="card" category="actions" fallback="💳" style={{ width: '12px', height: '12px' }} /> carte bancaire ou <Icon name="mobile" category="social" fallback="📱" style={{ width: '12px', height: '12px' }} /> Mobile Money</li>
                    </ol>
                </div>
            </div>

            {/* Section 10 : Paramètres */}
            <div className="card" style={{ marginBottom: '32px' }} id="settings">
                <div className="card-header">
                    <h3>
                        <Icon name="settings" category="nav" fallback="⚙️" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        10. Paramètres et sécurité
                    </h3>
                </div>
                <div className="card-body">
                    <h4 style={{ color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '16px', height: '16px' }} />
                        Paramètres entreprise
                    </h4>
                    <p>Modifiez le nom, l'adresse, la devise (<Icon name="money" category="status" fallback="💵" style={{ width: '12px', height: '12px' }} />), la langue et le taux de TVA.</p>

                    <h4 style={{ color: 'var(--primary-500)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="lock" category="actions" fallback="🔐" style={{ width: '16px', height: '16px' }} />
                        Double authentification (2FA)
                    </h4>
                    <p>Activez la 2FA pour sécuriser votre compte. Un code sera envoyé par <Icon name="email" category="status" fallback="📧" style={{ width: '12px', height: '12px' }} /> email à chaque nouvel appareil.</p>
                </div>
            </div>

            {/* Contact */}
            <div className="card" style={{ backgroundColor: '#F0FDF4', border: '1px solid #0F6B3A', marginBottom: '40px' }}>
                <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--primary-500)' }}>
                        <Icon name="email" category="status" fallback="📧" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        Besoin d'aide ?
                    </h3>
                    <p style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Icon name="email" category="status" fallback="📧" style={{ width: '14px', height: '14px' }} />
                        <a href="mailto:stockmedi.contact@gmail.com" style={{ color: 'var(--primary-500)' }}>stockmedi.contact@gmail.com</a>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Icon name="whatsapp" category="social" fallback="💬" style={{ width: '14px', height: '14px' }} />
                        <a href="https://wa.me/224623679567" style={{ color: 'var(--primary-500)' }}>+224 623 679 567</a>
                    </p>
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Icon name="clock" category="status" fallback="🕒" style={{ width: '12px', height: '12px' }} />
                        {t('footer_hours') || 'Lundi - Vendredi: 8h - 18h'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;