/**
 * COMPOSANT MODAL - Fenêtre modale
 */

import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: { width: '400px' },
        md: { width: '600px' },
        lg: { width: '800px' },
        xl: { width: '1000px' }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-modal)'
        }} onClick={onClose}>
            <div style={{
                ...sizeStyles[size],
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                maxHeight: '90vh',
                overflow: 'auto',
                animation: 'fadeIn var(--transition-normal)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    padding: 'var(--spacing-4) var(--spacing-5)',
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            color: 'var(--gray-500)'
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div style={{ padding: 'var(--spacing-5)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;