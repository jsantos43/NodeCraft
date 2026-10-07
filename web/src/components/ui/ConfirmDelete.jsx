import React, { useState, useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal, { ModalFooter } from './Modal.jsx';
import Button from './Button.jsx';
import './ConfirmDelete.css';

export default function ConfirmDelete({ open, onClose, onConfirm, name, loading, description }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const match = typed === name;
  const close = () => { if (!loading) onClose(); };

  const handleConfirm = async () => {
    if (!match || loading) return;
    try {
      await onConfirm();
      onClose();
    } catch {
      // The action keeps this dialog open and shows its own error.
    }
  };

  return (
    <Modal open={open} onClose={close} size="sm">
      <div className="cd-header">
        <div className="cd-icon">
          <TriangleAlert size={20} />
        </div>
        <div>
          <h3 className="cd-title">Delete this?</h3>
          <p className="cd-subtitle">{description || 'This action cannot be undone.'}</p>
        </div>
      </div>

      <div className="cd-name-block">
        <span className="cd-name">{name}</span>
      </div>

      <label className="cd-label">
        Type <strong>{name}</strong> to confirm
      </label>
      <input
        className={`cd-input ${typed && !match ? 'cd-input-error' : ''} ${match ? 'cd-input-match' : ''}`}
        value={typed}
        onChange={e => setTyped(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        placeholder={name}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />

      <ModalFooter>
        <Button variant="secondary" disabled={loading} onClick={close}>Cancel</Button>
        <Button variant="danger" disabled={!match} loading={loading} onClick={handleConfirm}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
