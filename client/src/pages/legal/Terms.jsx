/**
 * PAGE CONDITIONS D'UTILISATION
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
    const currentYear = new Date().getFullYear();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '40px' }}>
                <Link to="/dashboard" style={{ color: '#0F6B3A', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
                    ← Retour au tableau de bord
                </Link>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '3rem' }}>📜</div>
                    <h1 style={{ color: '#111827', marginBottom: '8px' }}>Conditions générales d'utilisation</h1>
                    <p style={{ color: '#6B7280' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                </div>

                <section style={{ marginBottom: '32px' }}>
                    <h2>1. Acceptation des conditions</h2>
                    <p>En utilisant StockMedi, vous acceptez les présentes conditions générales d'utilisation.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>2. Description du service</h2>
                    <p>StockMedi est une application de gestion pharmaceutique multi-espaces destinée aux pharmacies, cliniques et hôpitaux.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>3. Création de compte</h2>
                    <p>L'utilisateur est responsable de la confidentialité de ses identifiants. Toute activité sous son compte lui est imputable.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>4. Abonnement et paiement</h2>
                    <p>Les abonnements sont payables mensuellement. Aucun remboursement pour les périodes partielles. L'utilisateur peut annuler à tout moment.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>5. Responsabilité</h2>
                    <p>StockMedi ne peut être tenu responsable des erreurs de saisie, de la perte de données due à une mauvaise utilisation, ou des interruptions de service.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>6. Propriété intellectuelle</h2>
                    <p>Tous les éléments de StockMedi (code, design, marque) sont protégés par les droits d'auteur.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>7. Résiliation</h2>
                    <p>StockMedi se réserve le droit de suspendre ou résilier un compte en cas de non-respect des conditions d'utilisation.</p>
                </section>

                <section style={{ marginBottom: '32px' }}>
                    <h2>8. Modifications</h2>
                    <p>Ces conditions peuvent être modifiées. Les utilisateurs seront informés par email des changements importants.</p>
                </section>

                <section>
                    <h2>9. Contact</h2>
                    <p>Pour toute question : <a href="mailto:support@stockmedi.com" style={{ color: '#0F6B3A' }}>support@stockmedi.com</a></p>
                </section>

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    <p>© {currentYear} StockMedi. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;