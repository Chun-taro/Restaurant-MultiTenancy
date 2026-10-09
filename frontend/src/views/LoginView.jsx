import React, { useState } from 'react';

export default function LoginView({ onLoginSuccess, onBackToLanding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
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
        background: 'radial-gradient(circle, rgba(255, 90, 31, 0.18) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(22, 25, 33, 0.88)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(20px)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-lg), 0 0 35px rgba(255, 90, 31, 0.2)',
        position: 'relative'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #EA580C 50%, #DC2626 100%)',
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
            Super Admin & Developer Authentication Portal
          </p>
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
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '40px', paddingRight: '42px' }}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: showPassword ? 'var(--primary-light)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'color 0.15s ease'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              </button>
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
