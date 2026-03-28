/**
 * COMPOSANT ALERT - Messages d'alerte
 */

import React, { useState, useEffect } from 'react';

const Alert = ({ type = 'info', message, duration = 5000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!visible) return null;

    // Définition des styles pour chaque type d'alerte
    const typeStyles = {
        success: {
            backgroundColor: '#D1FAE5',
            borderColor: '#10B981',
            icon: '✓',
            color: '#065F46'
        },
        error: {
            backgroundColor: '#FEE2E2',
            borderColor: '#EF4444',
            icon: '✗',
            color: '#991B1B'
        },
        warning: {
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B',
            icon: '⚠',
            color: '#92400E'
        },
        info: {
            backgroundColor: '#DBEAFE',
            borderColor: '#3B82F6',
            icon: 'ℹ',
            color: '#1E40AF'
        },
        danger: {
            backgroundColor: '#FEE2E2',
            borderColor: '#EF4444',
            icon: '✗',
            color: '#991B1B'
        }
    };

    // Sécuriser l'accès au style
    const style = typeStyles[type] || typeStyles.info;

    return (
        <div style={{
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: style.backgroundColor,
            borderLeft: `4px solid ${style.borderColor}`,
            marginBottom: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)'
        }}>
            <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
            <span style={{ color: style.color, flex: 1 }}>{message}</span>
            <button
                onClick={() => {
                    setVisible(false);
                    onClose?.();
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    color: style.color,
                    opacity: 0.6,
                    padding: '0 4px'
                }}
            >
                ✕
            </button>
        </div>
    );
};

export default Alert;