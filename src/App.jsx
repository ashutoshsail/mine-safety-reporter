import React, { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext'; // Import AuthContext
import HomePage from './pages/HomePage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import IncidentLogPage from './pages/IncidentLogPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import FloatingNav from './components/FloatingNav';
import LoginPage from './pages/LoginPage'; // Import LoginPage

// A simple router component
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
  const { theme } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext); // Get the current user

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  // If there's no user, show the login page. Otherwise, show the app.
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className={`min-h-screen font-light text-light-text dark:text-dark-text transition-colors duration-300`}>
      <main className="p-4 sm:p-6 lg:p-8">
        <Router route={route} />
      </main>
      <FloatingNav setRoute={setRoute} currentRoute={route} />
    </div>
  );
}

export default App;
