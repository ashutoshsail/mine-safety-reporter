import React, { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentLogPage from './pages/IncidentLogPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import FloatingNav from './components/FloatingNav';
import LoginPage from './pages/LoginPage';
import { Settings } from 'lucide-react';

const Router = ({ route, setRoute }) => {
  switch (route) {
    case 'home': return <HomePage setRoute={setRoute} />;
    case 'report': return <ReportIncidentPage />;
    case 'log': return <IncidentLogPage />;
    case 'analytics': return <ExecutiveDashboardPage />;
    case 'comparison': return <ComparisonPage />;
    case 'settings': return <SettingsPage />;
    default: return <HomePage setRoute={setRoute} />;
  }
};

function App() {
  const [route, setRoute] = useState('home');
  const { theme } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className={`min-h-screen font-light text-light-text dark:text-dark-text transition-colors duration-300`}>
      <header className="fixed top-0 right-0 p-2 z-20">
        <button onClick={() => setRoute('settings')} className="bg-light-card dark:bg-dark-card p-2 rounded-full shadow-md text-light-subtle-text dark:text-dark-subtle-text hover:text-light-accent dark:hover:text-dark-accent transition-colors">
          <Settings size={20} />
        </button>
      </header>
      <main className="p-2 sm:p-4">
        <Router route={route} setRoute={setRoute} />
      </main>
      <FloatingNav setRoute={setRoute} currentRoute={route} />
    </div>
  );
}

export default App;
