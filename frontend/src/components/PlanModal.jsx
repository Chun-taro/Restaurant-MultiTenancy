import React, { useState, useEffect } from 'react';

export default function PlanModal({ isOpen, onClose, onSubmit, editPlan = null }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price_monthly: 2999,
    price_yearly: 29990,
    max_products: 100,
    max_staff: 5,
    transaction_fee_percent: 2.0,
    has_qr_ordering: true,
    has_online_payment: true,
    has_custom_domain: false,
    has_advanced_analytics: false,
    has_inventory: false,
    is_popular: false
  });

  useEffect(() => {
    if (editPlan) {
      setFormData({
        name: editPlan.name,
        code: editPlan.code,
        description: editPlan.description || '',
        price_monthly: editPlan.price_monthly,
        price_yearly: editPlan.price_yearly,
        max_products: editPlan.max_products,
        max_staff: editPlan.max_staff,
        transaction_fee_percent: editPlan.transaction_fee_percent,
        has_qr_ordering: !!editPlan.has_qr_ordering,
        has_online_payment: !!editPlan.has_online_payment,
        has_custom_domain: !!editPlan.has_custom_domain,
        has_advanced_analytics: !!editPlan.has_advanced_analytics,
        has_inventory: !!editPlan.has_inventory,
        is_popular: !!editPlan.is_popular
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        price_monthly: 2999,
        price_yearly: 29990,
        max_products: 100,
        max_staff: 5,
        transaction_fee_percent: 2.0,
        has_qr_ordering: true,
        has_online_payment: true,
        has_custom_domain: false,
        has_advanced_analytics: false,
        has_inventory: false,
        is_popular: false
      });
    }
  }, [editPlan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, editPlan ? editPlan.id : null);
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {editPlan ? `Edit Plan: ${editPlan.name}` : 'Create Subscription Plan'}
          </h3>
          <button className="modal-close" onClick={onClose}><i className="ri-close-line"></i></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Plan Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  readOnly={!!editPlan}
                  value={formData.code}
                  onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Price Monthly (₱) *</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.price_monthly}
                  onChange={(e) => setFormData(p => ({ ...p, price_monthly: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Price Yearly (₱)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData(p => ({ ...p, price_yearly: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Menu Items</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.max_products}
                  onChange={(e) => setFormData(p => ({ ...p, max_products: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Max Staff</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.max_staff}
                  onChange={(e) => setFormData(p => ({ ...p, max_staff: Number(e.target.value) }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Platform Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={formData.transaction_fee_percent}
                  onChange={(e) => setFormData(p => ({ ...p, transaction_fee_percent: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_qr_ordering}
                  onChange={(e) => setFormData(p => ({ ...p, has_qr_ordering: e.target.checked }))}
                /> Enable QR Table Ordering
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_online_payment}
                  onChange={(e) => setFormData(p => ({ ...p, has_online_payment: e.target.checked }))}
                /> Enable Online Gateway (Maya/Cards)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_custom_domain}
                  onChange={(e) => setFormData(p => ({ ...p, has_custom_domain: e.target.checked }))}
                /> Enable Custom Domains (.ph / .com)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_advanced_analytics}
                  onChange={(e) => setFormData(p => ({ ...p, has_advanced_analytics: e.target.checked }))}
                /> Enable Advanced Analytics
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_inventory}
                  onChange={(e) => setFormData(p => ({ ...p, has_inventory: e.target.checked }))}
                /> Enable Raw Inventory Control
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber)', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData(p => ({ ...p, is_popular: e.target.checked }))}
                /> Highlight as "Most Popular"
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Plan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
