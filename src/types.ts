export type { Supplier, Product, Customer, Sale } from './db';

export type ActiveTab = 
  | 'pos' 
  | 'products' 
  | 'customers' 
  | 'suppliers' 
  | 'history' 
  | 'notes' 
  | 'dashboard' 
  | 'settings';

export interface CartItem {
  product: {
    id: number;
    name: string;
    sale_price: number;
    cost_price: number;
    stock_quantity: number;
    category: string;
    barcode?: string;
    unit?: string;
  };
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
