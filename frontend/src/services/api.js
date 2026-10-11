/**
 * API service for React MERN frontend
 */

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || `HTTP ${res.status}`);
    error.data = data;
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  dashboard: {
    getStats: () => request('/api/dashboard/stats')
  },
  tenants: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/tenants${q ? `?${q}` : ''}`);
    },
    get: (id) => request(`/api/tenants/${id}`),
    create: (data) => request('/api/tenants', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, reason) => request(`/api/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    }),
    updatePlan: (id, planId, cycle) => request(`/api/tenants/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan_id: planId, billing_cycle: cycle })
    }),
    impersonate: (id) => request(`/api/tenants/${id}/impersonate`, { method: 'POST', body: JSON.stringify({}) }),
    delete: (id) => request(`/api/tenants/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    seedDemo: () => request('/api/tenants/seed-demo', { method: 'POST', body: JSON.stringify({}) })
  },
  plans: {
    list: () => request('/api/plans'),
    create: (data) => request('/api/plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id) => request(`/api/plans/${id}/toggle`, { method: 'PATCH' })
  },
  billing: {
    invoices: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/billing/invoices${q ? `?${q}` : ''}`);
    },
    updateStatus: (id, status) => request(`/api/billing/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },
  users: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/users${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateProfile: (data) => request('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
    toggleStatus: (id, status) => request(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },
  audit: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/audit-logs${q ? `?${q}` : ''}`);
    }
  },
  settings: {
    get: () => request('/api/settings'),
    update: (settings) => request('/api/settings', { method: 'PUT', body: JSON.stringify({ settings }) })
  },
  tenantPortal: {
    overview: (restaurantId) => request(`/api/tenant/${restaurantId}/overview`),
    orders: (restaurantId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/tenant/${restaurantId}/orders${q ? `?${q}` : ''}`);
    },
    updateOrderStatus: (restaurantId, orderId, status) => request(`/api/tenant/${restaurantId}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    menu: (restaurantId) => request(`/api/tenant/${restaurantId}/menu`),
    createCategory: (restaurantId, data) => request(`/api/tenant/${restaurantId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deleteCategory: (restaurantId, id) => request(`/api/tenant/${restaurantId}/categories/${id}`, {
      method: 'DELETE'
    }),
    createItem: (restaurantId, data) => request(`/api/tenant/${restaurantId}/items`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateItem: (restaurantId, id, data) => request(`/api/tenant/${restaurantId}/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    toggleItemStock: (restaurantId, id) => request(`/api/tenant/${restaurantId}/items/${id}/availability`, {
      method: 'PATCH'
    }),
    deleteItem: (restaurantId, id) => request(`/api/tenant/${restaurantId}/items/${id}`, {
      method: 'DELETE'
    }),
    tables: (restaurantId) => request(`/api/tenant/${restaurantId}/tables`),
    createTable: (restaurantId, data) => request(`/api/tenant/${restaurantId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    customers: (restaurantId) => request(`/api/tenant/${restaurantId}/customers`),
    reports: (restaurantId) => request(`/api/tenant/${restaurantId}/reports`),
    seedDine: (restaurantId) => request(`/api/tenant/${restaurantId}/seed-dine`, {
      method: 'POST'
    }),
    login: (restaurantId, data) => request(`/api/tenant/${restaurantId}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    register: (restaurantId, data) => request(`/api/tenant/${restaurantId}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    staff: (restaurantId) => request(`/api/tenant/${restaurantId}/staff`),
    createStaff: (restaurantId, data) => request(`/api/tenant/${restaurantId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateStaff: (restaurantId, id, data) => request(`/api/tenant/${restaurantId}/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteStaff: (restaurantId, id) => request(`/api/tenant/${restaurantId}/staff/${id}`, {
      method: 'DELETE'
    }),
    subscription: (restaurantId) => request(`/api/tenant/${restaurantId}/subscription`),
    changeSubscriptionPlan: (restaurantId, data) => request(`/api/tenant/${restaurantId}/subscription/change-plan`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateSettings: (restaurantId, data) => request(`/api/tenant/${restaurantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    addons: (restaurantId) => request(`/api/tenant/${restaurantId}/addons`),
    createAddon: (restaurantId, data) => request(`/api/tenant/${restaurantId}/addons`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateAddon: (restaurantId, id, data) => request(`/api/tenant/${restaurantId}/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    deleteAddon: (restaurantId, id) => request(`/api/tenant/${restaurantId}/addons/${id}`, {
      method: 'DELETE'
    }),
    uploadImage: (restaurantId, data) => request(`/api/tenant/${restaurantId}/upload`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  storefront: {
    get: (slug) => request(`/api/storefront/${slug}`),
    customerLogin: (slug, data) => request(`/api/storefront/${slug}/auth/customer-login`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    register: (slug, data) => request(`/api/storefront/${slug}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    placeOrder: (slug, data) => request(`/api/storefront/${slug}/orders`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    trackOrder: (slug, orderNumber) => request(`/api/storefront/${slug}/orders/${orderNumber}`),
    customerOrders: (slug, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/storefront/${slug}/customer/orders${q ? `?${q}` : ''}`);
    }
  }
};
