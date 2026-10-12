import React, { useEffect } from 'react';

/**
 * Premium glassmorphism confirmation & alert modal
 * Replaces ugly native browser window.alert() and window.confirm()
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirmation Required',
  message = '',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isAlert = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel?.();
      } else if (e.key === 'Enter') {
        onConfirm?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: 'ri-delete-bin-7-line',
      color: '#EF4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.35)',
      confirmBtnBg: '#EF4444',
      confirmBtnHover: '#DC2626'
    },
    warning: {
      icon: 'ri-error-warning-line',
      color: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
      confirmBtnBg: '#F59E0B',
      confirmBtnHover: '#D97706'
    },
    info: {
      icon: 'ri-information-line',
      color: '#38BDF8',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.35)',
      confirmBtnBg: '#38BDF8',
      confirmBtnHover: '#0284C7'
    },
    success: {
      icon: 'ri-checkbox-circle-line',
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
      confirmBtnBg: '#10B981',
      confirmBtnHover: '#059669'
    }
  };

  const cfg = typeConfig[type] || typeConfig.danger;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: `1px solid ${cfg.border}`,
          borderRadius: '16px',
          boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px -5px ${cfg.bgGlow}`,
          padding: '24px',
          color: '#F8FAFC',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: cfg.bgGlow,
              border: `1px solid ${cfg.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cfg.color,
              fontSize: '24px',
              flexShrink: 0
            }}
          >
            <i className={cfg.icon} />
          </div>

          <div style={{ flex: 1, paddingTop: '2px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.3
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#94A3B8'
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px'
          }}
        >
          {!isAlert && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: 'rgba(51, 65, 85, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#CBD5E1',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.7)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)';
                e.currentTarget.style.color = '#CBD5E1';
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: cfg.confirmBtnBg,
              border: 'none',
              color: '#FFFFFF',
              boxShadow: `0 4px 12px ${cfg.bgGlow}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = cfg.confirmBtnHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = cfg.confirmBtnBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
