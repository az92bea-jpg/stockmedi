/**
 * COMPOSANT CONFIRM MODAL - Modale de confirmation
 */

import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    children,  // ⭐ AJOUTER
    confirmText = 'Confirmer', 
    cancelText = 'Annuler', 
    isDanger = false,
    confirmDisabled = false  // ⭐ AJOUTER
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            {message && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <p>{message}</p>
                </div>
            )}
            {children}
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                    {cancelText}
                </button>
                <button 
                    className={isDanger ? 'btn btn-danger' : 'btn btn-primary'} 
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;