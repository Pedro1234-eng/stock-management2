
import { Product, Supplier, Transaction, TransactionAction, CategoryStock, BulkImportItem, BulkImportResult } from '../types';

// --- MOCK DATABASE ---
let products: Product[] = [
  { product_id: 'prod-001', name: 'Quantum Laptop', description: 'Next-gen laptop with quantum processor.', category: 'Electronics', supplier_id: 'sup-101', quantity_in_stock: 50, reorder_level: 20, price: 2500.00, last_updated: new Date().toISOString() },
  { product_id: 'prod-002', name: 'Smart Coffee Mug', description: 'Keeps your coffee at the perfect temperature.', category: 'Home Goods', supplier_id: 'sup-102', quantity_in_stock: 15, reorder_level: 25, price: 89.99, last_updated: new Date().toISOString() },
  { product_id: 'prod-003', name: 'Ergonomic Office Chair', description: 'Supports your back during long work hours.', category: 'Furniture', supplier_id: 'sup-103', quantity_in_stock: 120, reorder_level: 30, price: 350.50, last_updated: new Date().toISOString() },
  { product_id: 'prod-004', name: 'Wireless Noise-Cancelling Headphones', description: 'Immersive sound experience.', category: 'Electronics', supplier_id: 'sup-101', quantity_in_stock: 80, reorder_level: 25, price: 299.99, last_updated: new Date().toISOString() },
  { product_id: 'prod-005', name: 'Organic Green Tea', description: '25 premium tea bags.', category: 'Groceries', supplier_id: 'sup-102', quantity_in_stock: 5, reorder_level: 10, price: 12.00, last_updated: new Date().toISOString() },
];

let suppliers: Supplier[] = [
  { supplier_id: 'sup-101', name: 'Global Tech Inc.', contact_name: 'Jane Doe', phone: '123-456-7890', email: 'jane.doe@globaltech.com', address: '1 Tech Road, Silicon Valley, CA' },
  { supplier_id: 'sup-102', name: 'Lifestyle Goods Co.', contact_name: 'John Smith', phone: '098-765-4321', email: 'john.smith@lifestyle.com', address: '25 Market St, New York, NY' },
  { supplier_id: 'sup-103', name: 'Comfort Furnishings', contact_name: 'Emily White', phone: '555-123-4567', email: 'emily@comfortfurnish.com', address: '100 Furniture Ave, High Point, NC' },
];

let transactions: Transaction[] = [
  { transaction_id: 'txn-001', product_id: 'prod-001', action: TransactionAction.CREATE, quantity_change: 50, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { transaction_id: 'txn-002', product_id: 'prod-002', action: TransactionAction.CREATE, quantity_change: 20, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { transaction_id: 'txn-003', product_id: 'prod-002', action: TransactionAction.STOCK_ADJUST, quantity_change: -5, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
];

const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 500));
};

// --- API FUNCTIONS ---

// Products
export const listProducts = (filters: { category?: string; lowStock?: boolean; supplier_id?: string; searchQuery?: string }) => {
    let filteredProducts = [...products];
    if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
    }
    if (filters.lowStock) {
        filteredProducts = filteredProducts.filter(p => p.quantity_in_stock <= p.reorder_level);
    }
    if (filters.supplier_id) {
        filteredProducts = filteredProducts.filter(p => p.supplier_id === filters.supplier_id);
    }
    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(query) || p.product_id.toLowerCase().includes(query));
    }
    return simulateDelay(filteredProducts);
};

export const getProduct = (id: string) => {
    const product = products.find(p => p.product_id === id);
    return simulateDelay(product);
};

export const createProduct = (productData: Omit<Product, 'product_id' | 'last_updated'>) => {
    const newProduct: Product = {
        ...productData,
        product_id: `prod-${Date.now()}`,
        last_updated: new Date().toISOString(),
    };
    products.push(newProduct);
    logTransaction(newProduct.product_id, TransactionAction.CREATE, newProduct.quantity_in_stock);
    return simulateDelay(newProduct);
};

export const bulkImportProducts = async (
    items: BulkImportItem[],
    options: { updateExisting?: boolean; stockMode?: 'replace' | 'add' } = { updateExisting: true, stockMode: 'replace' }
): Promise<BulkImportResult> => {
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    let totalUnitsAdded = 0;
    const errors: string[] = [];
    const importedProducts: Product[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
            if (!item.name || !item.name.trim()) {
                failedCount++;
                errors.push(`Row ${i + 1}: Missing product name`);
                continue;
            }

            // Check if existing product by ID or matching Name
            const existingIndex = products.findIndex(p => 
                (item.product_id && p.product_id.toLowerCase() === item.product_id.toLowerCase()) ||
                (p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );

            if (existingIndex > -1 && options.updateExisting) {
                const prev = products[existingIndex];
                const newStock = options.stockMode === 'add' 
                    ? prev.quantity_in_stock + (item.quantity_in_stock || 0)
                    : (item.quantity_in_stock !== undefined ? item.quantity_in_stock : prev.quantity_in_stock);
                const stockDiff = newStock - prev.quantity_in_stock;

                const updated: Product = {
                    ...prev,
                    name: item.name.trim(),
                    description: item.description || prev.description,
                    category: item.category || prev.category,
                    supplier_id: item.supplier_id || prev.supplier_id,
                    price: item.price !== undefined ? item.price : prev.price,
                    reorder_level: item.reorder_level !== undefined ? item.reorder_level : prev.reorder_level,
                    quantity_in_stock: Math.max(0, newStock),
                    last_updated: now,
                };
                products[existingIndex] = updated;
                importedProducts.push(updated);
                updatedCount++;
                totalUnitsAdded += Math.max(0, stockDiff);
                if (stockDiff !== 0) {
                    logTransaction(updated.product_id, TransactionAction.STOCK_ADJUST, stockDiff);
                } else {
                    logTransaction(updated.product_id, TransactionAction.UPDATE, 0);
                }
            } else {
                // Generate a unique ID if not provided or collision
                let uniqueId = item.product_id;
                if (!uniqueId || products.some(p => p.product_id === uniqueId)) {
                    uniqueId = `prod-${Date.now().toString().slice(-6)}-${(i + 1).toString().padStart(3, '0')}`;
                }

                const newProd: Product = {
                    product_id: uniqueId,
                    name: item.name.trim(),
                    description: item.description || `${item.name.trim()} (${item.category || 'General'})`,
                    category: item.category || 'General',
                    supplier_id: item.supplier_id || 'sup-101',
                    price: item.price || 0,
                    quantity_in_stock: Math.max(0, item.quantity_in_stock || 0),
                    reorder_level: item.reorder_level !== undefined ? item.reorder_level : 10,
                    last_updated: now,
                };

                products.push(newProd);
                importedProducts.push(newProd);
                createdCount++;
                totalUnitsAdded += newProd.quantity_in_stock;
                logTransaction(newProd.product_id, TransactionAction.CREATE, newProd.quantity_in_stock);
            }
        } catch (err: any) {
            failedCount++;
            errors.push(`Row ${i + 1}: ${err.message || 'Unknown error'}`);
        }
    }

    return simulateDelay({
        totalProcessed: items.length,
        createdCount,
        updatedCount,
        failedCount,
        totalUnitsAdded,
        errors,
        importedProducts,
    });
};

export const updateProduct = (id: string, updates: Partial<Product>) => {
    const productIndex = products.findIndex(p => p.product_id === id);
    if (productIndex > -1) {
        products[productIndex] = { ...products[productIndex], ...updates, last_updated: new Date().toISOString() };
        logTransaction(id, TransactionAction.UPDATE, 0);
        return simulateDelay(products[productIndex]);
    }
    return simulateDelay(null);
};

export const deleteProduct = (id: string) => {
    const productIndex = products.findIndex(p => p.product_id === id);
    if (productIndex > -1) {
        const deletedProduct = products.splice(productIndex, 1)[0];
        logTransaction(id, TransactionAction.DELETE, -deletedProduct.quantity_in_stock);
        return simulateDelay(true);
    }
    return simulateDelay(false);
};

export const adjustStock = (id: string, quantityChange: number) => {
    const productIndex = products.findIndex(p => p.product_id === id);
    if (productIndex > -1) {
        products[productIndex].quantity_in_stock += quantityChange;
        products[productIndex].last_updated = new Date().toISOString();
        logTransaction(id, TransactionAction.STOCK_ADJUST, quantityChange);
        return simulateDelay(products[productIndex]);
    }
    return simulateDelay(null);
};

// Suppliers
export const listSuppliers = (searchQuery?: string) => {
    let filteredSuppliers = [...suppliers];
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredSuppliers = filteredSuppliers.filter(s => s.name.toLowerCase().includes(query) || s.contact_name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query));
    }
    return simulateDelay(filteredSuppliers);
};

export const getSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.supplier_id === id);
    return simulateDelay(supplier);
};

export const createSupplier = (supplierData: Omit<Supplier, 'supplier_id'>) => {
    const newSupplier: Supplier = {
        ...supplierData,
        supplier_id: `sup-${Date.now()}`,
    };
    suppliers.push(newSupplier);
    return simulateDelay(newSupplier);
};

export const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const supplierIndex = suppliers.findIndex(s => s.supplier_id === id);
    if (supplierIndex > -1) {
        suppliers[supplierIndex] = { ...suppliers[supplierIndex], ...updates };
        return simulateDelay(suppliers[supplierIndex]);
    }
    return simulateDelay(null);
};

export const deleteSupplier = (id: string) => {
    const supplierIndex = suppliers.findIndex(s => s.supplier_id === id);
    if (supplierIndex > -1) {
        suppliers.splice(supplierIndex, 1);
        // Also update products that used this supplier
        products = products.map(p => p.supplier_id === id ? { ...p, supplier_id: 'N/A' } : p);
        return simulateDelay(true);
    }
    return simulateDelay(false);
};

// Transactions
const logTransaction = (productId: string, action: TransactionAction, quantityChange: number) => {
    const newTransaction: Transaction = {
        transaction_id: `txn-${Date.now()}`,
        product_id: productId,
        action: action,
        quantity_change: quantityChange,
        timestamp: new Date().toISOString(),
    };
    transactions.unshift(newTransaction);
};

export const listTransactions = (filters: { product_id?: string; startDate?: string; endDate?: string }) => {
    let filteredTransactions = [...transactions];
    if (filters.product_id) {
        filteredTransactions = filteredTransactions.filter(t => t.product_id === filters.product_id);
    }
    if (filters.startDate) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the whole day
        filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) <= endDate);
    }
    return simulateDelay(filteredTransactions);
};

export const getCategoryStockData = (): Promise<CategoryStock[]> => {
    const categoryMap: { [cat: string]: { totalStock: number; productCount: number; lowStockCount: number } } = {};
    for (const p of products) {
        const cat = p.category || 'Uncategorized';
        if (!categoryMap[cat]) {
            categoryMap[cat] = { totalStock: 0, productCount: 0, lowStockCount: 0 };
        }
        categoryMap[cat].totalStock += p.quantity_in_stock;
        categoryMap[cat].productCount += 1;
        if (p.quantity_in_stock <= p.reorder_level) {
            categoryMap[cat].lowStockCount += 1;
        }
    }
    const categoryStocks: CategoryStock[] = Object.entries(categoryMap).map(([category, stats]) => ({
        category,
        totalStock: stats.totalStock,
        productCount: stats.productCount,
        lowStockCount: stats.lowStockCount,
    })).sort((a, b) => b.totalStock - a.totalStock);

    return simulateDelay(categoryStocks);
};

export const getDashboardData = async () => {
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.quantity_in_stock <= p.reorder_level).length;
    const recentTransactions = transactions.slice(0, 5);
    const categoryStocks = await getCategoryStockData();
    return simulateDelay({ totalProducts, lowStockCount, recentTransactions, categoryStocks });
};
