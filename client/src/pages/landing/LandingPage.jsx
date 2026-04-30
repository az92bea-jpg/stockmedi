/**
 * PAGE D'ACCUEIL (LANDING PAGE) - StockMedi
 * 
 * BUT : Présenter StockMedi aux visiteurs non connectés et les convertir en utilisateurs.
 * 
 * COMPORTEMENT :
 * - Visible UNIQUEMENT pour les visiteurs NON connectés
 * - Si l'utilisateur est déjà connecté → redirection vers /dashboard
 * 
 * SECTIONS DE LA PAGE :
 * 1. Navbar           → Navigation fixe avec menu desktop + hamburger mobile
 * 2. Hero             → Bannière principale avec titre, sous-titre, boutons
 * 3. Pourquoi         → 3 valeurs clés (sécurité, simplicité, support)
 * 4. Fonctionnalités  → 6 fonctionnalités en cartes avec icônes
 * 5. Plans/Tarifs     → Trial, Basic, Premium, Enterprise avec anchor pricing
 * 6. FAQ              → Accordéon questions/réponses
 * 7. Contact          → Formulaire + infos de contact
 * 8. Footer           → Liens légaux, réseaux sociaux, copyright
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Alert from '../../components/common/Alert';
import api from '../../services/api';
import { authService } from '../../services/authService';

const LandingPage = () => {
    const navigate = useNavigate();

    // ==================== ÉTATS ====================

    // État du menu mobile (ouvert/fermé)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // État de l'accordéon FAQ (index de la question ouverte, null = tout fermé)
    const [faqOpen, setFaqOpen] = useState(null);

    // État du formulaire de contact
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSuccess, setContactSuccess] = useState('');

    // ==================== EFFECTS ====================

    /**
     * Vérifier si l'utilisateur est déjà connecté.
     * Si oui → redirection vers /dashboard (il n'a rien à faire sur la landing page).
     */
    useEffect(() => {
        if (authService.isAuthenticated()) {
            navigate('/dashboard');
        }
    }, [navigate]);

    /**
     * Fermer le menu mobile quand on clique EN DEHORS de la navbar.
     * Utile sur mobile : l'utilisateur ouvre le menu, puis touche ailleurs → ça ferme.
     */
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Si le menu est ouvert ET que le clic n'est PAS dans <nav> → fermer
            if (mobileMenuOpen && !e.target.closest('nav')) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [mobileMenuOpen]);

    // ==================== FONCTIONS ====================

    /**
     * Gérer l'accordéon FAQ.
     * Si on clique sur une question déjà ouverte → la fermer.
     * Si on clique sur une autre → l'ouvrir (et fermer la précédente).
     */
    const toggleFaq = (index) => {
        setFaqOpen(faqOpen === index ? null : index);
    };

    /**
     * Envoyer le formulaire de contact via l'API Resend.
     * Appelle POST /api/companies/contact avec nom, email, message.
     */
    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            await api.post('/companies/contact', contactForm);
            setContactSuccess('✅ Message envoyé ! Nous vous répondrons dans les plus brefs délais.');
            setContactForm({ name: '', email: '', message: '' }); // Vider le formulaire
            setTimeout(() => setContactSuccess(''), 5000);
        } catch (err) {
            setContactSuccess(''); // Pas de message d'erreur visible (évite de stresser l'utilisateur)
        } finally {
            setContactLoading(false);
        }
    };

    // ==================== DONNÉES ====================

    /**
     * PLANS D'ABONNEMENT
     * 
     * STRUCTURE :
     * - name       : Nom affiché du plan
     * - price      : Prix affiché
     * - oldPrice   : Prix barré (anchor pricing). null = pas de prix barré
     * - showOldPrice : true → afficher le prix barré | false → affichage normal
     * - period     : Période (30 jours, /mois)
     * - features   : Liste des fonctionnalités incluses
     * - color      : Couleur du plan (pour badge et bouton)
     * 
     * ⚠️ CONFIGURATION ANCHOR PRICING :
     * Pour activer/désactiver les prix barrés, changer showOldPrice à true/false.
     * Exemple : { showOldPrice: true } → prix barré visible | { showOldPrice: false } → normal
     */
    const plans = [
        { 
            name: 'Essai Gratuit', 
            price: '0 €', 
            oldPrice: null,            // Pas de prix barré pour le gratuit
            showOldPrice: false,       // Affichage normal
            period: '30 jours', 
            features: ['50 produits', '3 employés', 'Gestion de stock basique', 'Ventes basiques', 'Rapports basiques'], 
            color: '#10B981' 
        },
        { 
            name: 'Basic', 
            price: '8,99 €', 
            oldPrice: '12,99 €',       // Prix barré pour effet "bonne affaire"
            showOldPrice: true,       // Mettre true pour activer le prix barré
            period: '/mois', 
            features: ['500 produits', '10 employés', 'Export PDF/Excel', 'Devis', 'Reçus personnalisés'], 
            color: '#3B82F6' 
        },
        { 
            name: 'Premium', 
            price: '18,99 €', 
            oldPrice: '24,99 €', 
            showOldPrice: true, 
            period: '/mois', 
            features: ['2000 produits', '30 employés', 'Stats avancées', 'Fournisseurs', 'Gestion des employés'], 
            color: '#8B5CF6' 
        },
        { 
            name: 'Enterprise', 
            price: '47,99 €', 
            oldPrice: '59,99 €', 
            showOldPrice: true, 
            period: '/mois', 
            features: ['Produits illimités', 'Employés illimités', 'Multi-établissements', 'Dossiers patients', 'Support prioritaire'], 
            color: '#F59E0B' 
        }
    ];

    /**
     * FAQ — Questions fréquentes
     * Chaque entrée a une question et une réponse.
     * Affichées en accordéon (une seule ouverte à la fois).
     */
    const faq = [
        { 
            question: 'Comment créer un compte ?', 
            answer: 'Cliquez sur "Essai gratuit", remplissez le formulaire avec vos informations et le nom de votre entreprise. Votre compte sera créé instantanément.' 
        },
        { 
            question: 'Est-ce que l\'essai de 30 jours est vraiment gratuit ?', 
            answer: 'Oui, totalement gratuit. Aucune carte bancaire requise. Vous pouvez utiliser toutes les fonctionnalités du plan Trial pendant 30 jours.' 
        },
        { 
            question: 'Comment changer de plan ?', 
            answer: 'Allez dans Paramètres → Abonnement. Choisissez le plan souhaité et payez par carte bancaire ou Mobile Money.' 
        },
        { 
            question: 'Mes données sont-elles en sécurité ?', 
            answer: 'Oui. Vos mots de passe sont chiffrés en SHA256. Les connexions sont en HTTPS. La double authentification (2FA) est disponible.' 
        },
        { 
            question: 'Puis-je avoir plusieurs établissements ?', 
            answer: 'Oui, avec le plan Enterprise. Vous pouvez gérer plusieurs pharmacies, cliniques ou hôpitaux depuis un seul compte.' 
        }
    ];

    // ==================== RENDU ====================

    return (
        <div style={{ backgroundColor: '#F9FAFB', overflowX: 'hidden' }}>

            {/* ================================================================ */}
            {/* NAVBAR — Barre de navigation fixe en haut de page */}
            {/* ================================================================ */}
            <nav style={{
                position: 'fixed',      // Reste en haut même quand on scrolle
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(15, 107, 58, 0.95)',  // Vert StockMedi semi-transparent
                backdropFilter: 'blur(10px)',                 // Effet de flou derrière la navbar
                padding: '12px 24px',
                zIndex: 1000,          // Toujours au-dessus du contenu
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    {/* Logo StockMedi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="pill" category="nav" fallback="💊" style={{ width: '28px', height: '28px' }} />
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>StockMedi</span>
                    </div>

                    {/* Liens desktop — Cachés sur mobile via CSS (nav-desktop) */}
                    <div className="nav-desktop" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <a href="#features" style={{ color: 'white', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.9 }}>Fonctionnalités</a>
                        <a href="#pricing" style={{ color: 'white', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.9 }}>Tarifs</a>
                        <a href="#faq" style={{ color: 'white', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.9 }}>FAQ</a>
                        <a href="#contact" style={{ color: 'white', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.9 }}>Contact</a>
                        <Link to="/login" style={{ backgroundColor: 'white', color: '#0F6B3A', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Connexion</Link>
                        <Link to="/register" style={{ backgroundColor: 'transparent', color: 'white', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', border: '2px solid white' }}>Essai gratuit</Link>
                    </div>

                    {/* Bouton hamburger mobile — ☰ quand fermé, ✕ quand ouvert */}
                    <button 
                        className="nav-mobile-btn" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                        style={{ display: 'none', background: 'none', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer' }}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Menu mobile — Affiché uniquement si mobileMenuOpen = true */}
                {mobileMenuOpen && (
                    <div id="mobile-menu" style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '12px' }}>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: 'white', padding: '10px 0', textDecoration: 'none' }}>Fonctionnalités</a>
                        <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: 'white', padding: '10px 0', textDecoration: 'none' }}>Tarifs</a>
                        <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: 'white', padding: '10px 0', textDecoration: 'none' }}>FAQ</a>
                        <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: 'white', padding: '10px 0', textDecoration: 'none' }}>Contact</a>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', backgroundColor: 'white', color: '#0F6B3A', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Connexion</Link>
                            <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textAlign: 'center', backgroundColor: 'transparent', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, border: '2px solid white' }}>Essai gratuit</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Styles responsives pour la navbar */}
            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }    /* Cacher liens desktop */
                    .nav-mobile-btn { display: block !important; } /* Afficher bouton ☰ */
                }
            `}</style>

            {/* Espaceur pour compenser la navbar fixe (64px de hauteur) */}
            <div style={{ height: '64px' }} />

            {/* ================================================================ */}
            {/* SECTION 1 : HERO — Bannière principale avec titre et boutons */}
            {/* ================================================================ */}
            <section style={{
                background: 'linear-gradient(135deg, #0F6B3A 0%, #065F46 50%, #0A5230 100%)',  // Dégradé vert
                color: 'white',
                padding: '80px 24px',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    
                    {/* Icône pilule */}
                    <div style={{ marginBottom: '32px' }}>
                        <Icon name="pill" category="nav" fallback="💊" style={{ width: '64px', height: '64px' }} />
                    </div>
                    
                    {/* Titre principal — Taille responsive (clamp) */}
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '16px', lineHeight: '1.2' }}>
                        Gérez votre pharmacie<br />comme un pro
                    </h1>
                    
                    {/* Sous-titre */}
                    <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '40px', lineHeight: '1.6' }}>
                        StockMedi simplifie la gestion de votre stock, vos ventes et vos employés.<br />
                        La solution pharmaceutique conçue pour l'Afrique.
                    </p>
                    
                    {/* Boutons d'action : Essai gratuit + Connexion */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" style={{
                            backgroundColor: 'white', color: '#0F6B3A', padding: '16px 32px', borderRadius: '12px',
                            textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                           <Icon name="starting" category="nav" fallback="🚀" style={{ width: '20px', height: '20px', marginRight: '6px' }} />
                            Essai gratuit de 30 jours
                        </Link>
                        <Link to="/login" style={{
                            backgroundColor: 'transparent', color: 'white', padding: '16px 32px', borderRadius: '12px',
                            textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', border: '2px solid white', transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Se connecter
                        </Link>
                    </div>
                    
                    {/* Chiffres clés (preuve sociale) */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '60px', flexWrap: 'wrap' }}>
                        <div><strong style={{ fontSize: '2rem' }}>500+</strong><br />Produits gérés</div>
                        <div><strong style={{ fontSize: '2rem' }}>100%</strong><br />Sécurisé</div>
                        <div><strong style={{ fontSize: '2rem' }}>24/7</strong><br />Disponible</div>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 2 : POURQUOI STOCKMEDI ? — 3 valeurs clés */}
            {/* ================================================================ */}
            {/* <section style={{ padding: '80px 24px', backgroundColor: 'white' }}> */}
            <section id="why" style={{ padding: '80px 24px', backgroundColor: '#F0FDF4' }}>

                <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', marginBottom: '48px' }}>
                        Pourquoi choisir <span style={{ color: 'var(--primary-500)' }}>StockMedi</span> ?
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        
                        {/* Valeur 1 : Sécurité */}
                        <div style={{ padding: '24px' }}>
                            <Icon name="lock" category="actions" fallback="🔒" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                            <h3 style={{ color: '#111827', marginBottom: '8px' }}>Sécurité maximale</h3>
                            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>Double authentification, chiffrement avancé, logs de sécurité complets. Vos données sont protégées.</p>
                        </div>
                        
                        {/* Valeur 2 : Simplicité */}
                        <div style={{ padding: '24px' }}>
                            <Icon name="dashboard" category="nav" fallback="⚡" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                            <h3 style={{ color: '#111827', marginBottom: '8px' }}>Simplicité d'utilisation</h3>
                            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>Interface intuitive, recherche rapide, prise en main en 5 minutes. Pas besoin d'être informaticien.</p>
                        </div>
                        
                        {/* Valeur 3 : Support */}
                        <div style={{ padding: '24px' }}>
                            <Icon name="mobile" category="social" fallback="📱" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                            <h3 style={{ color: '#111827', marginBottom: '8px' }}>Support réactif</h3>
                            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>Support par WhatsApp et email. Guide utilisateur intégré. Nous parlons français et nous vous répondons rapidement.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 3 : FONCTIONNALITÉS — 6 cartes avec icônes */}
            {/* ================================================================ */}
            <section id="features" style={{ padding: '80px 24px', backgroundColor: '#EFF6FF' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', textAlign: 'center', marginBottom: '48px' }}>
                        Tout ce dont vous avez <span style={{ color: 'var(--primary-500)' }}>besoin</span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {[
                            { icon: 'products', fallback: '📦', title: 'Gestion de stock', desc: 'Ajoutez vos produits, suivez les quantités, recevez des alertes avant expiration.' },
                            { icon: 'sales', fallback: '💰', title: 'Point de vente', desc: 'Recherche rapide, panier, remises, TVA, reçu PDF automatique.' },
                            { icon: 'document', fallback: '📄', title: 'Devis', desc: 'Créez des devis professionnels, convertissez-les en vente en un clic.' },
                            { icon: 'employees', fallback: '👥', title: 'Employés', desc: 'Ajoutez vos employés, gérez leurs permissions (ventes, stock, rapports).' },
                            { icon: 'reports', fallback: '📊', title: 'Rapports', desc: 'Exportez vos inventaires et ventes en PDF ou Excel.' },
                            { icon: 'patients', fallback: '🩺', title: 'Dossiers patients', desc: 'Suivez vos patients : antécédents, traitements, constantes. Fiche PDF.' }
                        ].map((feature, i) => (
                            <div key={i} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}   // Légère remontée au survol
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <Icon name={feature.icon} category="nav" fallback={feature.fallback} style={{ width: '40px', height: '40px', marginBottom: '16px' }} />
                                <h3 style={{ color: '#111827', marginBottom: '8px' }}>{feature.title}</h3>
                                <p style={{ color: '#6B7280', lineHeight: '1.6' }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 4 : PLANS ET TARIFS — Anchor pricing activable */}
            {/* ================================================================ */}
            <section id="pricing" style={{ padding: '80px 24px', backgroundColor: '#F0FDF4' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
                        Des <span style={{ color: 'var(--primary-500)' }}>plans</span> pour tous
                    </h2>
                    <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '48px' }}>Du petit kiosque à la grande pharmacie</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                        {plans.map((plan, i) => (
                            <div key={i} style={{ padding: '32px', borderRadius: '12px', border: i === 3 ? `2px solid ${plan.color}` : '1px solid #E5E7EB', textAlign: 'center', position: 'relative' }}>
                                
                                {/* Badge "POPULAIRE" sur le plan Enterprise */}
                                {i === 3 && (
                                    <div style={{ position: 'absolute', top: '-12px', right: '24px', backgroundColor: plan.color, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                                        POPULAIRE
                                    </div>
                                )}
                                
                                <h3 style={{ color: '#111827', marginBottom: '16px' }}>{plan.name}</h3>
                                
                                {/* AFFICHAGE DU PRIX — Anchor pricing OU normal */}
                                {plan.showOldPrice && plan.oldPrice ? (
                                    /* Mode Anchor Pricing : prix barré + vrai prix */
                                    <div>
                                        <span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '1rem', marginRight: '8px' }}>{plan.oldPrice}</span>
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.color }}>{plan.price}</span>
                                    </div>
                                ) : (
                                    /* Mode Normal : juste le prix */
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: plan.color, marginBottom: '4px' }}>{plan.price}</div>
                                )}
                                
                                <div style={{ color: '#6B7280', marginBottom: '24px' }}>{plan.period}</div>
                                
                                {/* Liste des fonctionnalités */}
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', lineHeight: '2.2', color: '#4B5563' }}>
                                    {plan.features.map((f, j) => (<li key={j}>✅ {f}</li>))}
                                </ul>
                                
                                {/* Bouton Commencer */}
                                <Link to="/register" style={{
                                    display: 'block', backgroundColor: plan.color, color: 'white', padding: '12px',
                                    borderRadius: '8px', textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >Commencer</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 5 : FAQ — Accordéon questions/réponses */}
            {/* ================================================================ */}
            <section id="faq" style={{ padding: '80px 24px', backgroundColor: '#F9FAFB' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', textAlign: 'center', marginBottom: '48px' }}>
                        Questions <span style={{ color: 'var(--primary-500)' }}>fréquentes</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {faq.map((item, i) => (
                            <div key={i} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                {/* Bouton question — cliquer ouvre/ferme la réponse */}
                                <button onClick={() => toggleFaq(i)} style={{ width: '100%', padding: '20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                                    {item.question}
                                    {/* Flèche qui tourne quand la réponse est ouverte */}
                                    <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                                </button>
                                {/* Réponse — affichée uniquement si cette question est ouverte */}
                                {faqOpen === i && (
                                    <div style={{ padding: '0 20px 20px', color: '#6B7280', lineHeight: '1.6' }}>{item.answer}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 6 : CONTACT — Formulaire + infos */}
            {/* ================================================================ */}
            <section id="contact" style={{ padding: '80px 24px', backgroundColor: '#F0FDF4' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
                        <Icon name="email" category="status" fallback="📧" style={{ width: '32px', height: '32px', marginRight: '8px' }} />
                        Contactez-nous
                    </h2>
                    <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '32px' }}>Une question ? Une démo ? Écrivez-nous.</p>
                    
                    {contactSuccess && <Alert type="success" message={contactSuccess} />}
                    
                    {/* Formulaire de contact */}
                    <form onSubmit={handleContactSubmit}>
                        <div className="form-group">
                            <input type="text" className="form-input" placeholder="Votre nom" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <input type="email" className="form-input" placeholder="Votre email" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <textarea className="form-textarea" rows="4" placeholder="Votre message" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={contactLoading}>
                            {contactLoading ? 'Envoi...' : 'Envoyer le message'}
                        </button>
                    </form>
                    
                    {/* Coordonnées directes */}
                    <div style={{ textAlign: 'center', marginTop: '32px', color: '#6B7280', lineHeight: '2' }}>
                        <p><Icon name="email" category="status" fallback="📧" style={{ width: '16px', height: '16px', marginRight: '6px' }} /> <a href="mailto:stockmedi.contact@gmail.com" style={{ color: 'var(--primary-500)' }}>stockmedi.contact@gmail.com</a></p>
                        <p><Icon name="whatsapp" category="social" fallback="💬" style={{ width: '16px', height: '16px', marginRight: '6px' }} /> <a href="https://wa.me/224623679567" style={{ color: 'var(--primary-500)' }}>+224 623 679 567</a></p>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 7 : FOOTER — Liens légaux, réseaux sociaux, copyright */}
            {/* ================================================================ */}
            <footer style={{ backgroundColor: '#111827', color: '#9CA3AF', padding: '40px 24px 20px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                    
                    {/* Colonne 1 : Marque */}
                    <div>
                        <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>
                            <Icon name="pill" category="nav" fallback="💊" style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                            StockMedi
                        </h3>
                        <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>Solution de gestion pharmaceutique pour pharmacies, cliniques et hôpitaux en Afrique.</p>
                    </div>
                    
                    {/* Colonne 2 : Liens rapides */}
                    <div>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '0.9rem' }}>Liens rapides</h4>
                        <Link to="/privacy" style={{ color: '#9CA3AF', textDecoration: 'none', display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Confidentialité</Link>
                        <Link to="/terms" style={{ color: '#9CA3AF', textDecoration: 'none', display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Conditions d'utilisation</Link>
                        <Link to="/about" style={{ color: '#9CA3AF', textDecoration: 'none', display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>À propos</Link>
                        <Link to="/contact" style={{ color: '#9CA3AF', textDecoration: 'none', display: 'block', fontSize: '0.85rem' }}>Contact</Link>
                    </div>
                    
                    {/* Colonne 3 : Coordonnées */}
                    <div>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '0.9rem' }}>Contact</h4>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="email" category="status" fallback="📧" style={{ width: '14px', height: '14px' }} />
                            <a href="mailto:stockmedi.contact@gmail.com" style={{ color: '#9CA3AF', textDecoration: 'none' }}>stockmedi.contact@gmail.com</a>
                        </p>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="mobile" category="social" fallback="📞" style={{ width: '14px', height: '14px' }} />
                            <a href="tel:+224623679567" style={{ color: '#9CA3AF', textDecoration: 'none' }}>+224 623 679 567</a>
                        </p>
                        <p style={{ margin: '0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="location" category="status" fallback="📍" style={{ width: '14px', height: '14px' }} />
                            Conakry, Guinée
                        </p>
                    </div>

                    {/* Colonne 4 : Réseaux sociaux */}
                    <div>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '0.9rem' }}>Suivez-nous</h4>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a href="https://www.facebook.com/share/18hseuKpLT/" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF' }}>
                                <Icon name="facebook" category="social" fallback="📘" style={{ width: '22px', height: '22px' }} />
                            </a>
                            <a href="https://wa.me/224623679567" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF' }}>
                                <Icon name="whatsapp" category="social" fallback="💬" style={{ width: '22px', height: '22px' }} />
                            </a>
                            <a href="https://www.linkedin.com/company/116134308" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF' }}>
                                <Icon name="linkedin" category="social" fallback="🔗" style={{ width: '22px', height: '22px' }} />
                            </a>
                        </div>
                    </div>
                </div>
                
                {/* Copyright — Année dynamique */}
                <div style={{ borderTop: '1px solid #1F2937', paddingTop: '16px', textAlign: 'center', fontSize: '0.8rem' }}>
                    © {new Date().getFullYear()} StockMedi. Tous droits réservés.
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;