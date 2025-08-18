import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import { ConfigContext } from './context/ConfigContext';
import Sidebar from './components/Sidebar';
import FloatingNav from './components/FloatingNav';
import BackToTopButton from './components/BackToTopButton';
import HomePage from './pages/HomePage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentLogPage from './pages/IncidentLogPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import AdminPanel from './pages/AdminPanel';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { ArrowLeft } from 'lucide-react';
import LogoIcon from './components/LogoIcon';

const Header = ({ title, onMenuClick }) => (
  <header className="p-4 bg-light-card dark:bg-dark-card shadow-sm lg:hidden fixed top-0 left-0 w-full z-20 flex items-center gap-4">
    <button onClick={onMenuClick} className="flex-shrink-0 text-light-primary dark:text-dark-primary">
        <LogoIcon className="h-8 w-8" />
    </button>
    <h1 className="text-base font-semibold truncate">{title}</h1>
  </header>
);

const BackButton = ({ onBack, disabled }) => {
  return (
    <button
      onClick={onBack}
      disabled={disabled}
      className={`fixed top-5 right-5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300
        bg-light-card dark:bg-dark-card shadow-md
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }
      `}
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
};

function App() {
  const { theme, user } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { companyProfile } = useContext(ConfigContext);
  
  const [routeHistory, setRouteHistory] = useState(['home']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainContentRef = useRef(null);
  const currentRoute = routeHistory[routeHistory.length - 1];

  const setRoute = (newRoute) => {
    if (newRoute !== currentRoute) {
        setRouteHistory(prev => [...prev, newRoute]);
    }
    setIsSidebarOpen(false);
    // Scroll to top on new page navigation
    if (mainContentRef.current) {
        mainContentRef.current.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (routeHistory.length > 1) {
      setRouteHistory(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  // Effect for scroll tracking for the BackToTopButton
  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
        if (mainEl.scrollTop > 300) {
            setShowBackToTop(true);
        } else {
            setShowBackToTop(false);
        }
    };
    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  if (!currentUser) {
    return <LoginPage />;
  }

  const pageTitles = {
    home: 'Home',
    report: 'Report Incident',
    log: 'Incident Log',
    analytics: 'Executive Dashboard',
    comparison: 'Performance Comparison',
    admin: 'Admin Panel',
    settings: 'Settings'
  };

  const currentPageTitle = pageTitles[currentRoute] || 'Mines Safety';

  const renderPage = () => {
    switch (currentRoute) {
      case 'home': return <HomePage setRoute={setRoute} />;
      case 'report': return <ReportIncidentPage setRoute={setRoute} />;
      case 'log': return <IncidentLogPage />;
      case 'analytics': return <ExecutiveDashboardPage />;
      case 'comparison': return <ComparisonPage />;
      case 'admin': return user.isAdmin ? <AdminPanel /> : <HomePage setRoute={setRoute} />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage setRoute={setRoute} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
      <Sidebar 
        currentRoute={currentRoute} 
        setRoute={setRoute} 
        pageTitle={currentPageTitle}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main ref={mainContentRef} className="flex-1 lg:ml-64 relative overflow-y-auto pt-16 lg:pt-0">
        <Header 
            title={currentPageTitle} 
            onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        {/* --- Mobile Header Fade Effect --- */}
        <div className="lg:hidden fixed top-16 left-0 w-full h-6 bg-gradient-to-b from-light-background from-40% dark:from-dark-background to-transparent pointer-events-none z-10" />

        <BackButton onBack={handleBack} disabled={routeHistory.length <= 1} />
        <div className="p-4 sm:p-6 pb-12 sm:pb-20">
          {/* --- DESKTOP-ONLY HEADER --- */}
          <div className="hidden lg:block mb-6">
            <h1 className="inline-block rounded-lg border border-slate-200 bg-slate-100 px-4 py-1 text-2xl font-bold dark:border-slate-700 dark:bg-slate-800">
              {currentPageTitle}
            </h1>
          </div>
          {/* --- END DESKTOP-ONLY HEADER --- */}
          
          {renderPage()}
        </div>
        <BackToTopButton isVisible={showBackToTop} scrollContainerRef={mainContentRef} />
      </main>

      <FloatingNav currentRoute={currentRoute} setRoute={setRoute} />
    </div>
  );
}

export default App;