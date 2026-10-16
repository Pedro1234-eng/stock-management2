
import React from 'react';
import { Page } from '../types';
import { DashboardIcon, ProductsIcon, SuppliersIcon, AlertsIcon, TransactionsIcon, LogoutIcon } from './icons/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center px-4 py-3 text-gray-200 hover:bg-gray-700 rounded-lg transition-colors duration-200 ${isActive ? 'bg-indigo-600 font-semibold' : ''}`}
    >
      {icon}
      <span className="mx-4">{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
  const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { page: 'products', label: 'Products', icon: <ProductsIcon /> },
    { page: 'suppliers', label: 'Suppliers', icon: <SuppliersIcon /> },
    { page: 'alerts', label: 'Low Stock Alerts', icon: <AlertsIcon /> },
    { page: 'transactions', label: 'Transactions', icon: <TransactionsIcon /> },
  ];
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-gray-100">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Inv-Sys</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map(item => (
            <NavLink
              key={item.page}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.page}
              onClick={() => setCurrentPage(item.page)}
            />
        ))}
      </nav>
      <div className="px-2 py-4">
        <NavLink icon={<LogoutIcon />} label="Logout" isActive={false} onClick={onLogout} />
      </div>
    </aside>
  );
};

export default Sidebar;
