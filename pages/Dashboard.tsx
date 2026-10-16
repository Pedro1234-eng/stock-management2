
import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../services/api';
import { Transaction, CategoryStock } from '../types';
import DashboardCard from '../components/DashboardCard';
import CategoryStockChart from '../components/CategoryStockChart';
import { ProductsIcon, AlertsIcon, TransactionsIcon, ProductBoxIcon } from '../components/icons/Icons';

const Dashboard: React.FC = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categoryStocks, setCategoryStocks] = useState<CategoryStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardData();
        setTotalProducts(data.totalProducts);
        setLowStockCount(data.lowStockCount);
        setRecentTransactions(data.recentTransactions);
        setCategoryStocks(data.categoryStocks || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Total Products" value={totalProducts} icon={<ProductBoxIcon />} color="bg-blue-500" />
        <DashboardCard title="Low Stock Items" value={lowStockCount} icon={<AlertsIcon />} color="bg-red-500" />
        <DashboardCard title="Recent Transactions" value={recentTransactions.length > 0 ? 'Live' : 'None'} icon={<TransactionsIcon />} color="bg-green-500" />
      </div>

      {/* Stock Levels by Category Chart */}
      <CategoryStockChart data={categoryStocks} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Transaction ID</th>
                <th scope="col" className="px-6 py-3">Product ID</th>
                <th scope="col" className="px-6 py-3">Action</th>
                <th scope="col" className="px-6 py-3">Quantity Change</th>
                <th scope="col" className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.transaction_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-mono text-xs">{tx.transaction_id}</td>
                  <td className="px-6 py-4 font-mono text-xs">{tx.product_id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      tx.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      tx.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      tx.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {tx.action}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-semibold ${tx.quantity_change > 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.quantity_change}</td>
                  <td className="px-6 py-4">{new Date(tx.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
