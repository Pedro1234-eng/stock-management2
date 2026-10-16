
import React, { useState, useEffect, useCallback } from 'react';
import { Product, BulkImportResult } from '../types';
import { listProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../services/api';
import Modal from '../components/Modal';
import BulkImportModal from '../components/BulkImportModal';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustData, setStockAdjustData] = useState<{ id: string; name: string; change: number }>({ id: '', name: '', change: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastImportBanner, setLastImportBanner] = useState<{ message: string; count: number } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProducts({
        searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };
  
  const handleOpenStockModal = (product: Product) => {
      setStockAdjustData({ id: product.product_id, name: product.name, change: 0 });
      setIsStockModalOpen(true);
  };

  const handleCloseStockModal = () => {
      setIsStockModalOpen(false);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'product_id' | 'last_updated'>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.product_id, productData);
    } else {
      await createProduct(productData);
    }
    fetchProducts();
    handleCloseModal();
  };
  
  const handleDeleteProduct = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this product?')) {
          await deleteProduct(id);
          fetchProducts();
      }
  };
  
  const handleAdjustStock = async () => {
      if (stockAdjustData.id && stockAdjustData.change !== 0) {
          await adjustStock(stockAdjustData.id, stockAdjustData.change);
          fetchProducts();
          handleCloseStockModal();
      }
  };

  const handleImportSuccess = (result: BulkImportResult) => {
    fetchProducts();
    setLastImportBanner({
      message: `Successfully processed ${result.totalProcessed} products (${result.createdCount} created, ${result.updatedCount} updated, ${result.totalUnitsAdded.toLocaleString()} stock units added).`,
      count: result.totalProcessed,
    });
    setTimeout(() => {
      setLastImportBanner(null);
    }, 8000);
  };

  // Get unique list of categories for quick filter
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Toast / Notification Banner */}
      {lastImportBanner && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </span>
            <span>{lastImportBanner.message}</span>
          </div>
          <button
            onClick={() => setLastImportBanner(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <input 
              type="text"
              placeholder="Search products by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono hidden sm:inline">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button 
            type="button"
            onClick={() => setIsBulkModalOpen(true)} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload CSV
          </button>
          
          <button 
            type="button"
            onClick={() => handleOpenModal()} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Reorder Level</th>
                    <th className="px-6 py-3">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
                ) : products.map(p => (
                    <tr key={p.product_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-mono text-xs">{p.product_id}</td>
                        <td className="px-6 py-4 font-semibold">{p.name}</td>
                        <td className="px-6 py-4">{p.category}</td>
                        <td className="px-6 py-4">${p.price.toFixed(2)}</td>
                        <td className={`px-6 py-4 font-bold ${p.quantity_in_stock <= p.reorder_level ? 'text-red-500' : 'text-green-500'}`}>{p.quantity_in_stock}</td>
                        <td className="px-6 py-4">{p.reorder_level}</td>
                        <td className="px-6 py-4 space-x-2">
                           <button onClick={() => handleOpenStockModal(p)} className="font-medium text-green-600 dark:text-green-500 hover:underline">Adjust</button>
                           <button onClick={() => handleOpenModal(p)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                           <button onClick={() => handleDeleteProduct(p.product_id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      
      {isModalOpen && <ProductFormModal product={editingProduct} onSave={handleSaveProduct} onClose={handleCloseModal} />}
      
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <Modal isOpen={isStockModalOpen} onClose={handleCloseStockModal} title={`Adjust Stock for ${stockAdjustData.name}`}>
          <div className="space-y-4">
              <label className="block">
                  <span className="text-gray-700 dark:text-gray-300">Quantity Change</span>
                  <input type="number" value={stockAdjustData.change} onChange={e => setStockAdjustData({...stockAdjustData, change: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600" />
                  <p className="text-sm text-gray-500 mt-1">Use a positive number to add stock, negative to remove.</p>
              </label>
              <div className="flex justify-end pt-4">
                 <button onClick={handleCloseStockModal} className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                 <button onClick={handleAdjustStock} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirm Adjustment</button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

// Sub-component for the form modal to keep things clean
const ProductFormModal: React.FC<{
    product: Product | null;
    onSave: (productData: Omit<Product, 'product_id' | 'last_updated'>) => void;
    onClose: () => void;
}> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        category: product?.category || '',
        supplier_id: product?.supplier_id || '',
        quantity_in_stock: product?.quantity_in_stock || 0,
        reorder_level: product?.reorder_level || 0,
        price: product?.price || 0,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            quantity_in_stock: Number(formData.quantity_in_stock),
            reorder_level: Number(formData.reorder_level),
            price: Number(formData.price),
        });
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="supplier_id" value={formData.supplier_id} onChange={handleChange} placeholder="Supplier ID" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="quantity_in_stock" type="number" value={formData.quantity_in_stock} onChange={handleChange} placeholder="Quantity" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="reorder_level" type="number" value={formData.reorder_level} onChange={handleChange} placeholder="Reorder Level" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={3}></textarea>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Product</button>
                </div>
            </form>
        </Modal>
    );
};

export default Products;
