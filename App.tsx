import React, { useState, useCallback } from 'react';
import ScanPage from './components/ScanPage';
import StatsPage from './components/StatsPage';
import CompaniesPage from './components/CompaniesPage';
import ReportsPage from './components/ReportsPage';
import { Page } from './types';
import NavBar from './components/NavBar';

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
      case Page.REPORTS:
        return <ReportsPage />;
      case Page.COMPANIES:
        return <CompaniesPage />;
      default:
        return <ScanPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <main className="pb-20 p-4">
        {renderPage()}
      </main>
      <NavBar currentPage={currentPage} navigate={navigate} />
    </div>
  );
};

export default App;
