import React, { useState, useContext, useCallback, useRef } from 'react';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import FloatingNav from './components/FloatingNav';
import BottomNav from './components/BottomNav';
import BackToTopButton from './components/BackToTopButton';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentLogPage from './pages/IncidentLogPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanel from './pages/AdminPanel';
import { Menu, Settings } from 'lucide-react';

const useWindowSize = () => {
    const [width, setWidth] = useState(window.innerWidth);
    React.useLayoutEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};

const Router = ({ route }) => {
  switch (route) {
    case 'home': return <HomePage />;
    case 'report': return <ReportIncidentPage />;
    case 'log': return <IncidentLogPage />;
    case 'analytics': return <ExecutiveDashboardPage />;
    case 'comparison': return <ComparisonPage />;
    case 'settings': return <SettingsPage />;
    case 'admin': return <AdminPanel />;
    default: return <HomePage />;
  }
};

function App() {
  const [route, setRoute] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, navPreference } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const width = useWindowSize();
  const isLargeScreen = width >= 1024;
  const mainContentRef = useRef(null);

  const handleSetRoute = useCallback((newRoute) => {
    setRoute(newRoute);
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen font-light text-light-text dark:text-dark-text bg-light-background dark:bg-dark-background">
      <Sidebar 
        setRoute={handleSetRoute} 
        currentRoute={route} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {!isLargeScreen && (
        navPreference === 'fab' ? (
          <FloatingNav setRoute={handleSetRoute} currentRoute={route} />
        ) : (
          <BottomNav setRoute={handleSetRoute} currentRoute={route} />
        )
      )}
      
      <div ref={mainContentRef} className="transition-all duration-300 lg:ml-64 h-screen overflow-y-auto">
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-light-card dark:bg-dark-card border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu size={24} />
          </button>
          <button onClick={() => handleSetRoute('settings')} className="p-2">
            <Settings size={20} />
          </button>
        </header>

        <main className={`p-3 sm:p-4 ${!isLargeScreen && navPreference === 'bottom' ? 'pb-20' : 'pb-24'}`}>
          <Router route={route} />
        </main>
      </div>

      <BackToTopButton scrollContainerRef={mainContentRef} />
    </div>
  );
}

export default App;
