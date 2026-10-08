import React from 'react';

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  const iconMap = {
    success: 'ri-checkbox-circle-fill',
    error: 'ri-error-warning-fill',
    info: 'ri-information-fill'
  };

  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} show`}>
          <i className={iconMap[t.type] || 'ri-information-fill'} style={{ fontSize: '20px' }}></i>
          <div className="toast-msg">{t.message}</div>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
            onClick={() => onDismiss(t.id)}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
