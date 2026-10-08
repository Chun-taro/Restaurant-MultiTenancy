import React, { useState } from 'react';

export default function LoginView({ onLoginSuccess, onBackToLanding }) {
  const [email, setEmail] = useState('admin@restosaas.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Successful login
      localStorage.setItem('restosaas_admin_token', data.data.token);
      localStorage.setItem('restosaas_admin_user', JSON.stringify(data.data.user));
      onLoginSuccess(data.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@restosaas.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(20px)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-lg), 0 0 35px rgba(99, 102, 241, 0.2)',
        position: 'relative'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #4338CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '26px',
            boxShadow: '0 8px 20px var(--primary-glow)'
          }}>
            <i className="ri-store-3-fill"></i>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            RestoSaaS Platform
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Super Admin Authentication Portal
          </p>
        </div>

        {/* Demo Quickfill pill */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Credentials: </span>
            <code style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>admin@restosaas.com</code>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={handleQuickDemo}
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '18px',
            color: '#FB7185',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="ri-error-warning-fill" style={{ fontSize: '18px' }}></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label">Superadmin Email</label>
            <div style={{ position: 'relative' }}>
              <i className="ri-mail-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="admin@restosaas.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Master Password</label>
            <div style={{ position: 'relative' }}>
              <i className="ri-lock-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line ri-spin"></i> Authenticating...
              </>
            ) : (
              <>
                <i className="ri-login-box-line"></i> Sign In to Super Admin
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            onClick={onBackToLanding}
          >
            <i className="ri-arrow-left-line"></i> Back to Public Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
