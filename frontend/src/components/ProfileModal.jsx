import React, { useState, useEffect } from 'react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexandre',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Executive',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=MasterAdmin'
];

export default function ProfileModal({ isOpen, onClose, user, onUpdateProfile }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
      setPassword('');
      setConfirmPassword('');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);
      await onUpdateProfile({
        id: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
        password: password.trim() || undefined
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal-container" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255,90,31,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="ri-user-settings-fill"></i>
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px' }}>
                Super Administrator Profile
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Customize your name, email credentials, login password, and avatar
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><i className="ri-close-line"></i></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-error-warning-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Avatar Preview & Picker */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Profile Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                <img
                  src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Admin'}`}
                  alt="Avatar"
                  style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary-light)', objectFit: 'cover', background: '#1E293B' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Select a preset or enter a custom image URL:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(p)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: avatar === p ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                          padding: 0,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: '#1E293B'
                        }}
                      >
                        <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Or paste custom image URL..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>

            {/* Full Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Superadmin Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Alexandre Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="admin@restosaas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="+63 917 888 1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Password Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                  <i className="ri-lock-password-line" style={{ color: 'var(--primary-light)', marginRight: '6px' }}></i>
                  Change Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Leave empty to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <i className="ri-loader-4-line spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-3-line"></i>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
