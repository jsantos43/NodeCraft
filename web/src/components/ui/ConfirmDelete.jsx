import React, { useState, useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal, { ModalFooter } from './Modal.jsx';
import Button from './Button.jsx';
import './ConfirmDelete.css';

export default function ConfirmDelete({ open, onClose, onConfirm, name, loading }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const match = typed === name;

  const handleConfirm = async () => {
    if (!match) return;
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="cd-header">
        <div className="cd-icon">
          <TriangleAlert size={20} />
        </div>
        <div>
          <h3 className="cd-title">Delete this?</h3>
          <p className="cd-subtitle">This action cannot be undone.</p>
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
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!match} loading={loading} onClick={handleConfirm}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
