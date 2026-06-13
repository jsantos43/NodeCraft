import React from 'react';
import './Button.css';
import Spinner from './Spinner.jsx';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size={14} />
      ) : Icon ? (
        <Icon size={14} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={14} />}
    </button>
  );
}
