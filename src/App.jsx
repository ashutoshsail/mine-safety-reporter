import React, { useState, useContext, useCallback } from 'react'; // Import useCallback
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import FloatingNav from './components/FloatingNav';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentLogPage from './pages/IncidentLogPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanel from './pages/AdminPanel';

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
  const { theme, navPreference } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const width = useWindowSize();
  const isLargeScreen = width >= 1024;

  // CRITICAL FIX: Memoize the setRoute function so it doesn't cause re-renders
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
    <div className={`min-h-screen font-light text-light-text dark:text-dark-text bg-light-background dark:bg-dark-background`}>
      <Sidebar setRoute={handleSetRoute} currentRoute={route} />
      
      {!isLargeScreen && (
        navPreference === 'fab' ? (
          <FloatingNav setRoute={handleSetRoute} currentRoute={route} />
        ) : (
          <BottomNav setRoute={handleSetRoute} currentRoute={route} />
        )
      )}

      <main className={`p-3 sm:p-4 transition-all duration-300 ${isLargeScreen ? 'lg:ml-64' : (navPreference === 'bottom' ? 'pb-20' : 'pb-24')}`}>
        <Router route={route} />
      </main>
    </div>
  );
}

export default App;
