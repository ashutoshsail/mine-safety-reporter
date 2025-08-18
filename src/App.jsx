import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import { ConfigContext } from './context/ConfigContext';
import Sidebar from './components/Sidebar';
import FloatingNav from './components/FloatingNav';
import BottomNav from './components/BottomNav';
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
    <h1 className="text-lg font-medium text-slate-700 dark:text-slate-200">{title}</h1>
  </header>
);

const BackButton = ({ onBack, disabled }) => {
  return (
    <button
      onClick={onBack}
      disabled={disabled}
      className={`fixed top-5 right-5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300
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
  const { theme, user, navPreference } = useContext(AppContext);
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
        window.history.pushState({ route: newRoute }, '', `#${newRoute}`);
    }
    setIsSidebarOpen(false);
    if (mainContentRef.current) {
        mainContentRef.current.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    // On initial mount, sync the URL hash with the initial 'home' state.
    const initialRoute = window.location.hash.substring(1);
    if (initialRoute) {
        setRouteHistory(['home', initialRoute]);
    } else {
        window.history.replaceState({ route: 'home' }, '', '#home');
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
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

  // Listen for browser back button presses
  useEffect(() => {
    const handlePopState = (event) => {
        if (routeHistory.length > 1) {
            setRouteHistory(prev => prev.slice(0, -1));
        } else {
            const confirmExit = window.confirm("Are you sure you want to exit the app?");
            if (!confirmExit) {
                // If user cancels, push the state back to prevent exit.
                window.history.pushState({ route: 'home' }, '', '#home');
            }
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
  }, [routeHistory]);

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

  const mainContentPadding = navPreference === 'bottom'
    ? "p-4 sm:p-6 pb-28 sm:pb-36"
    : "p-4 sm:p-6 pb-12 sm:pb-20";

  return (
    <div className="flex h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
      <Sidebar 
        currentRoute={currentRoute} 
        setRoute={setRoute} 
        pageTitle={currentPageTitle}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        navPreference={navPreference}
      />
      
      <main ref={mainContentRef} className="flex-1 lg:ml-64 relative overflow-y-auto pt-16 lg:pt-0">
        <Header 
            title={currentPageTitle} 
            onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <div className="lg:hidden fixed top-16 left-0 w-full h-6 bg-gradient-to-b from-light-background from-40% dark:from-dark-background to-transparent pointer-events-none z-10" />

        <BackButton onBack={() => {
            window.history.back(); // Trigger popstate event
        }} disabled={routeHistory.length <= 1} />
        
        <div className={mainContentPadding}>
          <div className="hidden lg:block mb-6">
            <h1 className="text-lg font-medium text-slate-700 dark:text-slate-200">
              {currentPageTitle}
            </h1>
          </div>
          
          {renderPage()}
        </div>
        <BackToTopButton 
          isVisible={showBackToTop} 
          scrollContainerRef={mainContentRef} 
        />
      </main>

      {navPreference === 'fab' ? (
        <FloatingNav currentRoute={currentRoute} setRoute={setRoute} />
      ) : (
        <BottomNav currentRoute={currentRoute} setRoute={setRoute} />
      )}
    </div>
  );
}

export default App;