/**
 * COMPOSANT SÉLECTEUR D'ÉTABLISSEMENT
 * ⭐ Traductions FR/EN complètes
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
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
            if (response.establishments?.length > 0 && !selectedId) {
                onSelect(response.establishments[0]._id);
            }
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedId, onSelect]);

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