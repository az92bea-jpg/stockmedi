/**
 * COMPOSANT SÉLECTEUR D'ÉTABLISSEMENT
 * Traductions FR/EN complètes
 * Option "Tous les établissements" ajoutée
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Icon from '../../components/ui/Icon';
import { useLanguage } from '../../context/LanguageContext';

const EstablishmentSelector = ({ selectedId, onSelect, className = '' }) => {
    const { t } = useLanguage();
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEstablishments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/establishments');
            setEstablishments(response.establishments || []);
            // Ne PAS sélectionner automatiquement le premier établissement
            // Laisser le parent gérer la valeur par défaut (chaîne vide = "Tous")
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEstablishments();
    }, [loadEstablishments]);

    if (loading) {
        return <div className="form-hint">{t('loading_establishments')}</div>;
    }

    if (establishments.length === 0) {
        return (
            <div className="alert alert-warning">
                {t('no_establishments_create_one')}
            </div>
        );
    }

    return (
        <div className={`form-group ${className}`}>
            <label className="form-label">{t('establishment')}</label>
            <select
                className="form-select"
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
            >
                {/* Option "Tous les établissements" */}
                <option value="">
                    <Icon name="establishment" category="nav" fallback="🏢" style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                    {t('all_establishments')}
                </option>
                {establishments.map(est => (
                    <option key={est._id} value={est._id}>
                        {est.name} {!est.isActive && `(${t('inactive')})`}
                    </option>
                ))}
            </select>
            <div className="form-hint">
                {establishments.length} {t('establishment_count')}
            </div>
        </div>
    );
};

export default EstablishmentSelector;