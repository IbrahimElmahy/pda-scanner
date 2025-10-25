import React from 'react';
import { Page } from '../types';

interface NavBarProps {
  currentPage: Page;
  navigate: (page: Page) => void;
}

const NavItem: React.FC<{
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
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
        isActive ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

const NavBar: React.FC<NavBarProps> = ({ currentPage, navigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-5 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] h-16 justify-around items-center z-50">
      <NavItem
        label="مسح"
        page={Page.SCAN}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10m16-10v10M8 7v10m4-10v10m4-10v10M4 7h16" /></svg>}
      />
      <NavItem
        label="الإحصائيات"
        page={Page.STATS}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
      <NavItem
        label="تقارير"
        page={Page.REPORTS}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
      />
      <NavItem
        label="الشركات"
        page={Page.COMPANIES}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
      />
       <NavItem
        label="ملفي"
        page={Page.PROFILE}
        currentPage={currentPage}
        navigate={navigate}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
      />
    </nav>
  );
};

export default NavBar;
