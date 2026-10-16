
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { listProducts } from '../services/api';

const Alerts: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      setLoading(true);
      try {
        const data = await listProducts({ lowStock: true });
        setLowStockProducts(data);
      } catch (error) {
        console.error("Failed to fetch low stock products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStockProducts();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Low Stock Items</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        These items have a stock quantity at or below their reorder level.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th className="px-6 py-3">Product ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Quantity In Stock</th>
                    <th className="px-6 py-3">Reorder Level</th>
                    <th className="px-6 py-3">Deficit</th>
                    <th className="px-6 py-3">Suggested Action</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={6} className="text-center py-4">Loading alerts...</td></tr>
                ) : lowStockProducts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">No low stock items. Great job!</td></tr>
                ) : lowStockProducts.map(p => (
                    <tr key={p.product_id} className="bg-red-50 border-b dark:bg-red-900/20 dark:border-gray-700 hover:bg-red-100 dark:hover:bg-red-900/40">
                        <td className="px-6 py-4 font-mono text-xs">{p.product_id}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">{p.quantity_in_stock}</td>
                        <td className="px-6 py-4">{p.reorder_level}</td>
                        <td className="px-6 py-4 font-bold">{p.reorder_level - p.quantity_in_stock}</td>
                        <td className="px-6 py-4">
                            <button className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full hover:bg-yellow-600">
                                Reorder Now
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;
