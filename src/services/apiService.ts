import { syncService } from './syncService';

const API_URL = '/api';

export const remoteApi = {
  products: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    add: async (product: any) => {
      try {
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error('Failed to add product');
        return response.json();
      } catch (error) {
        await syncService.enqueue('create', 'products', product);
        return { ...product, id: Date.now() };
      }
    },
    update: async (id: number, product: any) => {
      try {
        const response = await fetch(`${API_URL}/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error('Failed to update product');
        return response.json();
      } catch (error) {
        await syncService.enqueue('update', 'products', { ...product, id });
        return { success: true };
      }
    },
    delete: async (id: number) => {
      try {
        const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete product');
        return true;
      } catch (error) {
        await syncService.enqueue('delete', 'products', { id });
        return true;
      }
    },
    getHistory: async (id: number) => {
      const response = await fetch(`${API_URL}/products/${id}/history`);
      if (!response.ok) throw new Error('Failed to fetch product history');
      return response.json();
    },
  },
  customers: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    add: async (customer: any) => {
      try {
        const response = await fetch(`${API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });
        if (!response.ok) throw new Error('Failed to add customer');
        return response.json();
      } catch (error) {
        await syncService.enqueue('create', 'customers', customer);
        return { ...customer, id: Date.now() };
      }
    },
    delete: async (id: number) => {
      try {
        const response = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete customer');
        return true;
      } catch (error) {
        await syncService.enqueue('delete', 'customers', { id });
        return true;
      }
    },
    pay: async (id: number, amount: number) => {
      try {
        const response = await fetch(`${API_URL}/customers/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });
        if (!response.ok) throw new Error('Failed to process payment');
        return response.json();
      } catch (error) {
        await syncService.enqueue('update', 'customers', { id, amount, action: 'pay' });
        return { success: true };
      }
    },
    getHistory: async (id: number) => {
      const response = await fetch(`${API_URL}/customers/${id}/history`);
      if (!response.ok) throw new Error('Failed to fetch customer history');
      return response.json();
    },
  },
  sales: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/sales`);
      if (!response.ok) throw new Error('Failed to fetch sales');
      return response.json();
    },
    add: async (sale: any) => {
      try {
        const response = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale),
        });
        if (!response.ok) throw new Error('Failed to add sale');
        return response.json();
      } catch (error) {
        await syncService.enqueue('create', 'sales', sale);
        return { ...sale, id: Date.now() };
      }
    },
    delete: async (id: number) => {
      try {
        const response = await fetch(`${API_URL}/sales/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete sale');
        return true;
      } catch (error) {
        await syncService.enqueue('delete', 'sales', { id });
        return true;
      }
    },
  },
  reports: {
    getSummary: async () => {
      const response = await fetch(`${API_URL}/reports/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    getDailySales: async () => {
      const response = await fetch(`${API_URL}/reports/daily-sales`);
      if (!response.ok) throw new Error('Failed to fetch daily sales');
      return response.json();
    },
  }
};
