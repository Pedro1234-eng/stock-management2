
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction } from '../types';
import { listTransactions } from '../services/api';

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        product_id: '',
        startDate: '',
        endDate: '',
    });

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listTransactions(filters);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions();
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product ID</label>
                    <input type="text" name="product_id" value={filters.product_id} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 h-10">Apply Filters</button>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Product ID</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Qty Change</th>
                            <th className="px-6 py-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan={5} className="text-center py-4">Loading transactions...</td></tr>
                        ) : transactions.map(tx => (
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
                                <td className={`px-6 py-4 font-semibold ${tx.quantity_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                                </td>
                                <td className="px-6 py-4">{new Date(tx.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;
