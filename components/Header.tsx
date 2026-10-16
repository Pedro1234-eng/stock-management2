
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
    currentPage: Page;
}

const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard Overview',
    products: 'Product Management',
    suppliers: 'Supplier Directory',
    alerts: 'Low Stock Alerts',
    transactions: 'Transaction History'
};

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md h-20 flex items-center justify-between px-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {pageTitles[currentPage]}
            </h1>
        </header>
    );
};

export default Header;
