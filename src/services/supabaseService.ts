import { getSupabase } from './supabaseClient';

const getClient = () => {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
};

export const remoteApi = {
  products: {
    getAll: async () => {
      const { data, error } = await getClient().from('products').select('*');
      if (error) throw error;
      return data;
    },
    add: async (product: any) => {
      const { data, error } = await getClient().from('products').insert([product]).select();
      if (error) throw error;
      return data[0];
    },
    update: async (id: number, product: any) => {
      const { data, error } = await getClient().from('products').update(product).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (id: number) => {
      const { error } = await getClient().from('products').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    getHistory: async (id: number) => {
      const { data, error } = await getClient().from('inventory_logs').select('*').eq('product_id', id);
      if (error) throw error;
      return data;
    },
  },
  customers: {
    getAll: async () => {
      const { data, error } = await getClient().from('customers').select('*');
      if (error) throw error;
      return data;
    },
    add: async (customer: any) => {
      const { data, error } = await getClient().from('customers').insert([customer]).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (id: number) => {
      const { error } = await getClient().from('customers').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    pay: async (id: number, amount: number) => {
      const { data, error } = await getClient().rpc('process_payment', { customer_id: id, payment_amount: amount });
      if (error) throw error;
      return data;
    },
    getHistory: async (id: number) => {
      const { data: sales, error: salesError } = await getClient().from('sales').select('*').eq('customer_id', id);
      const { data: debts, error: debtsError } = await getClient().from('debts').select('*').eq('customer_id', id);
      if (salesError || debtsError) throw salesError || debtsError;
      return { sales, debts };
    },
  },
  sales: {
    getAll: async () => {
      const { data, error } = await getClient().from('sales').select('*');
      if (error) throw error;
      return data;
    },
    add: async (sale: any) => {
      const { data, error } = await getClient().from('sales').insert([sale]).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (id: number) => {
      const { error } = await getClient().from('sales').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  },
  reports: {
    getSummary: async () => {
      const { data, error } = await getClient().rpc('get_summary');
      if (error) throw error;
      return data;
    },
    getDailySales: async () => {
      const { data, error } = await getClient().rpc('get_daily_sales');
      if (error) throw error;
      return data;
    },
  }
};
