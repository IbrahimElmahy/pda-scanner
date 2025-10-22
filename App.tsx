
import React, { useState, useCallback } from 'react';
import ScanPage from './components/ScanPage';
import StatsPage from './components/StatsPage';
import CompaniesPage from './components/CompaniesPage';
import { Page } from './types';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.SCAN);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case Page.SCAN:
        return <ScanPage navigate={navigate} />;
      case Page.STATS:
        return <StatsPage />;
      case Page.COMPANIES:
        return <CompaniesPage />;
      default:
        return <ScanPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header currentPage={currentPage} navigate={navigate} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
      <footer className="bg-white shadow-inner mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; 2024 ماسح الباركود. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
};

export default App;