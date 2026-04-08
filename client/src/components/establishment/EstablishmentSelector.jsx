/**
 * COMPOSANT SÉLECTEUR D'ÉTABLISSEMENT
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const EstablishmentSelector = ({ selectedId, onSelect, className = '' }) => {
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
        return <div className="form-hint">Chargement des établissements...</div>;
    }

    if (establishments.length === 0) {
        return (
            <div className="alert alert-warning">
                Aucun établissement. Créez-en un dans les paramètres.
            </div>
        );
    }

    return (
        <div className={`form-group ${className}`}>
            <label className="form-label">Établissement</label>
            <select
                className="form-select"
                value={selectedId || ''}
                onChange={(e) => onSelect(e.target.value)}
            >
                {establishments.map(est => (
                    <option key={est._id} value={est._id}>
                        {est.name} {!est.isActive && '(inactif)'}
                    </option>
                ))}
            </select>
            <div className="form-hint">
                {establishments.length} établissement(s)
            </div>
        </div>
    );
};

export default EstablishmentSelector;