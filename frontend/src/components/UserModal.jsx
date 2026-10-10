import React, { useState, useEffect } from 'react';

export default function UserModal({ isOpen, onClose, onSubmit, editUser = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'superadmin',
    password: '',
    phone: '',
    status: 'active',
    avatar: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name || '',
        email: editUser.email || '',
        role: editUser.role || 'superadmin',
        password: '', // leave empty unless changing
        phone: editUser.phone || '',
        status: editUser.status || 'active',
        avatar: editUser.avatar || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'superadmin',
        password: 'SuperAdmin2026!',
        phone: '',
        status: 'active',
        avatar: ''
      });
    }
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editUser;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (isEdit && !payload.password) {
      delete payload.password; // Do not overwrite with empty
    }
    onSubmit(payload, editUser ? editUser.id : null);
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal-container" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,90,31,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className={isEdit ? "ri-user-settings-line" : "ri-user-add-line"}></i>
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px' }}>
                {isEdit ? 'Edit Super Administrator / User' : 'Add New Super Administrator'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {isEdit ? 'Update identity credentials and platform permissions' : 'Grant root access to a new platform administrator'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><i className="ri-close-line"></i></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Maria Santos"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="admin@restosaas.com"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            {/* Role & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Role Access</label>
                <select
                  className="form-control form-select"
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="superadmin">Super Administrator (Root)</option>
                  <option value="restaurant_owner">Restaurant Owner</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Account Status</label>
                <select
                  className="form-control form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {isEdit ? 'New Password (leave blank to keep current)' : 'Account Password *'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                required={!isEdit}
                placeholder={isEdit ? "Enter new password to reset..." : "Create strong password..."}
                value={formData.password}
                onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
              />
            </div>

            {/* Phone */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="+63 917 888 1234"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <i className={isEdit ? "ri-save-line" : "ri-user-add-line"}></i>
              <span>{isEdit ? 'Save Changes' : 'Create Super Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
