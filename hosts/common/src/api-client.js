const fetch = require('node-fetch');

const BASE_URL = process.env.API_URL || 'http://central-server:3000';
let authToken = null;

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

module.exports = {
  async login(uid, password) {
    const data = await request('POST', '/api/auth/login', { uid, password });
    authToken = data.token;
    return data.user;
  },
  getShipments: () => request('GET', '/api/shipments'),
  getShipment: (id) => request('GET', `/api/shipments/${id}`),
  createShipment: (data) => request('POST', '/api/shipments', data),
  updateStatus: (id, status, notes) =>
    request('PUT', `/api/shipments/${id}/status`, { status, notes }),
  getStats: () => request('GET', '/api/admin/stats'),
  getAllShipments: () => request('GET', '/api/admin/shipments'),
  getComplaints: () => request('GET', '/api/customers/complaints'),
  searchCustomer: (q) => request('GET', `/api/customers/search?q=${encodeURIComponent(q)}`),
  createComplaint: (data) => request('POST', '/api/customers/complaint', data),
  getEmployeeActivity: () => request('GET', '/api/admin/activity'),
};

