
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  currentPage: Page;
  navigate: (page: Page) => void;
}

const NavButton: React.FC<{
  label: string;
  page: Page;
  currentPage: Page;
  navigate: (page: Page) => void;
  icon: React.ReactNode;
}> = ({ label, page, currentPage, navigate, icon }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => navigate(page)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, navigate }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10m16-10v10M8 7v10m4-10v10m4-10v10M4 7h16" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800 ms-2">ماسح الباركود</h1>
          </div>
          <nav className="flex space-x-2">
            <NavButton
              label="مسح"
              page={Page.SCAN}
              currentPage={currentPage}
              navigate={navigate}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>}
            />
            <NavButton
              label="الإحصائيات"
              page={Page.STATS}
              currentPage={currentPage}
              navigate={navigate}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 110 2H3a1 1 0 01-1-1zm5 0a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm5 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM2 5a1 1 0 011-1h2a1 1 0 110 2H3a1 1 0 01-1-1zm5 0a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm5 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" /></svg>}
            />
            <NavButton
              label="الشركات"
              page={Page.COMPANIES}
              currentPage={currentPage}
              navigate={navigate}
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" /></svg>}
            />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;