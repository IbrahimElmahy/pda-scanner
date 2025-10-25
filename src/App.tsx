import React, { useState, useCallback, useEffect } from 'react';
import ScanPage from './components/ScanPage';
import StatsPage from './components/StatsPage';
import CompaniesPage from './components/CompaniesPage';
import ReportsPage from './components/ReportsPage';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginPage';
import { Page, User } from './types';
import NavBar from './components/NavBar';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(Page.SCAN);

  // Check for saved session on component mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('barcode-scanner-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('barcode-scanner-user');
    }
    setIsLoadingSession(false);
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('barcode-scanner-user', JSON.stringify(loggedInUser));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('barcode-scanner-user');
    setCurrentPage(Page.SCAN); // Reset to default page on logout
  }, []);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    // Make sure user is not null, even though this is inside the authenticated view
    if (!user) return null;

    switch (currentPage) {
      case Page.SCAN:
        return <ScanPage navigate={navigate} />;
      case Page.STATS:
        return <StatsPage />;
      case Page.REPORTS:
        return <ReportsPage />;
      case Page.COMPANIES:
        return <CompaniesPage />;
      case Page.PROFILE:
        return <ProfilePage user={user} onLogout={handleLogout} />;
      default:
        return <ScanPage navigate={navigate} />;
    }
  };
  
  // Render a loading indicator while checking session
  if (isLoadingSession) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-xl font-semibold text-gray-700">جاري تحميل التطبيق...</div>
        </div>
      );
  }

  // If no user, show login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is logged in, show the main app
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <main className="p-4 pb-20">
        {renderPage()}
      </main>
      <NavBar currentPage={currentPage} navigate={navigate} />
    </div>
  );
};

export default App;
