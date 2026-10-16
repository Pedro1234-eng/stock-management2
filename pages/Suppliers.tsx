
import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from '../types';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import Modal from '../components/Modal';

const Suppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listSuppliers(searchQuery);
            setSuppliers(data);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'supplier_id'>) => {
        if (editingSupplier) {
            await updateSupplier(editingSupplier.supplier_id, supplierData);
        } else {
            await createSupplier(supplierData);
        }
        fetchSuppliers();
        handleCloseModal();
    };

    const handleDeleteSupplier = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this supplier? This may affect existing products.')) {
            await deleteSupplier(id);
            fetchSuppliers();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Supplier</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Contact Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                        ) : suppliers.map(s => (
                            <tr key={s.supplier_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-mono text-xs">{s.supplier_id}</td>
                                <td className="px-6 py-4 font-semibold">{s.name}</td>
                                <td className="px-6 py-4">{s.contact_name}</td>
                                <td className="px-6 py-4">{s.email}</td>
                                <td className="px-6 py-4">{s.phone}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleOpenModal(s)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteSupplier(s.supplier_id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <SupplierFormModal supplier={editingSupplier} onSave={handleSaveSupplier} onClose={handleCloseModal} />}
        </div>
    );
};

// Sub-component for the Supplier form modal
const SupplierFormModal: React.FC<{
    supplier: Supplier | null;
    onSave: (supplierData: Omit<Supplier, 'supplier_id'>) => void;
    onClose: () => void;
}> = ({ supplier, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        contact_name: supplier?.contact_name || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
        address: supplier?.address || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={supplier ? 'Edit Supplier' : 'Add New Supplier'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Supplier Name" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="contact_name" value={formData.contact_name} onChange={handleChange} placeholder="Contact Name" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={3}></textarea>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Supplier</button>
                </div>
            </form>
        </Modal>
    );
};

export default Suppliers;
