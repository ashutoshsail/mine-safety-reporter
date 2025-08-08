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

const Router = ({ route }) => {
  switch (route) {
    case 'home': return <HomePage />;
    case 'report': return <ReportIncidentPage />;
    case 'log': return <IncidentLogPage />;
    case 'analytics': return <ExecutiveDashboardPage />;
    case 'comparison': return <ComparisonPage />;
    case 'settings': return <SettingsPage />;
    default: return <HomePage />;
  }
};

function App() {
  const [route, setRoute] = useState('home');
  const { theme, user } = useContext(AppContext);
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
      <header className="fixed top-0 right-0 p-4 z-10">
        <div className="bg-light-card dark:bg-dark-card px-4 py-2 rounded-lg shadow-md text-sm">
          Hello, <span className="font-semibold">{user.name || 'User'}</span>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8 pt-20">
        <Router route={route} />
      </main>
      <FloatingNav setRoute={setRoute} currentRoute={route} />
    </div>
  );
}

export default App;
