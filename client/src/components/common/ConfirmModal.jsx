/**
 * COMPOSANT CONFIRM MODAL - Modale de confirmation
 */

import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler', isDanger = false }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <p>{message}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                    {cancelText}
                </button>
                <button 
                    className={isDanger ? 'btn btn-danger' : 'btn btn-primary'} 
                    onClick={onConfirm}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;