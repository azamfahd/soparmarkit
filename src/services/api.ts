const API_BASE = ''; // Since it's the same origin

export const api = {
  products: {
    getAll: async () => fetch(`${API_BASE}/api/products`).then(res => res.json()),
    add: async (product: any) => fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(res => res.json()),
    update: async (id: number, product: any) => fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(res => res.json()),
    delete: async (id: number) => fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' }).then(res => res.json()),
    getHistory: async (id: number) => fetch(`${API_BASE}/api/products/${id}/history`).then(res => res.json()),
  },
  customers: {
    getAll: async () => fetch(`${API_BASE}/api/customers`).then(res => res.json()),
    add: async (customer: any) => fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    }).then(res => res.json()),
    delete: async (id: number) => fetch(`${API_BASE}/api/customers/${id}`, { method: 'DELETE' }).then(res => res.json()),
    pay: async (id: number, amount: number) => fetch(`${API_BASE}/api/customers/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    }).then(res => res.json()),
    getHistory: async (id: number) => fetch(`${API_BASE}/api/customers/${id}/history`).then(res => res.json()),
  },
  sales: {
    getAll: async () => fetch(`${API_BASE}/api/sales`).then(res => res.json()),
    add: async (sale: any) => fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    }).then(res => res.json()),
    delete: async (id: number) => fetch(`${API_BASE}/api/sales/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },
  reports: {
    getSummary: async () => fetch(`${API_BASE}/api/reports/summary`).then(res => res.json()),
    getDailySales: async () => fetch(`${API_BASE}/api/reports/daily-sales`).then(res => res.json()),
  }
};
