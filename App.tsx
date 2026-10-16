
import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Alerts from './pages/Alerts';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import { Page } from './types';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  }, []);
  
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'suppliers':
        return <Suppliers />;
      case 'alerts':
        return <Alerts />;
      case 'transactions':
        return <Transactions />;
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
