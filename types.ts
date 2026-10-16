
export interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  supplier_id: string;
  quantity_in_stock: number;
  reorder_level: number;
  price: number;
  last_updated: string;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
}

export enum TransactionAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STOCK_ADJUST = 'STOCK_ADJUST',
}

export interface Transaction {
  transaction_id: string;
  product_id: string;
  action: TransactionAction;
  quantity_change: number;
  timestamp: string;
}

export interface CategoryStock {
  category: string;
  totalStock: number;
  productCount: number;
  lowStockCount: number;
}

export interface BulkImportItem {
  product_id?: string;
  name: string;
  description?: string;
  category: string;
  supplier_id?: string;
  quantity_in_stock: number;
  reorder_level?: number;
  price: number;
}

export interface BulkImportResult {
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  totalUnitsAdded: number;
  errors: string[];
  importedProducts: Product[];
}

export type Page = 'dashboard' | 'products' | 'suppliers' | 'alerts' | 'transactions';

