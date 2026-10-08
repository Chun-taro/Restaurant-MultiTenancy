/**
 * RestoSaaS Superadmin API Layer
 */

const API = {
  async get(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${url}?${query}` : url;
    const res = await fetch(fullUrl);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  async post(url, body = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  async put(url, body = {}) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  async patch(url, body = {}) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  async delete(url, body = {}) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  },

  // Specific API calls
  dashboard: {
    getStats: () => API.get('/api/dashboard/stats')
  },
  tenants: {
    list: (params) => API.get('/api/tenants', params),
    get: (id) => API.get(`/api/tenants/${id}`),
    create: (data) => API.post('/api/tenants', data),
    update: (id, data) => API.put(`/api/tenants/${id}`, data),
    updateStatus: (id, status, reason) => API.patch(`/api/tenants/${id}/status`, { status, reason }),
    updatePlan: (id, planId, cycle) => API.patch(`/api/tenants/${id}/plan`, { plan_id: planId, billing_cycle: cycle }),
    impersonate: (id) => API.post(`/api/tenants/${id}/impersonate`),
    delete: (id) => API.delete(`/api/tenants/${id}`)
  },
  plans: {
    list: () => API.get('/api/plans'),
    create: (data) => API.post('/api/plans', data),
    update: (id, data) => API.put(`/api/plans/${id}`, data),
    toggle: (id) => API.patch(`/api/plans/${id}/toggle`)
  },
  billing: {
    invoices: (params) => API.get('/api/billing/invoices', params),
    updateStatus: (id, status) => API.patch(`/api/billing/invoices/${id}/status`, { status })
  },
  users: {
    list: (params) => API.get('/api/users', params),
    create: (data) => API.post('/api/users', data),
    toggleStatus: (id, status) => API.patch(`/api/users/${id}/status`, { status })
  },
  audit: {
    list: (params) => API.get('/api/audit-logs', params)
  },
  settings: {
    get: () => API.get('/api/settings'),
    update: (settings) => API.put('/api/settings', { settings })
  }
};

window.API = API;
