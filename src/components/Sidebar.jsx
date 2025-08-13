import React from 'react';
import { AppContext } from '../context/AppContext';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, Shield, ShieldCheck, X } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
];

const Sidebar = ({ setRoute, currentRoute, isOpen, setIsOpen }) => {
  const { user } = React.useContext(AppContext);

  const handleNavClick = (route) => {
    setRoute(route);
    setIsOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-light-card dark:bg-dark-card border-r border-slate-200 dark:border-slate-700 flex flex-col p-4 z-40 transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <Shield size={28} className="text-light-accent" />
            <h1 className="text-xl font-bold">Mine Safety</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                currentRoute === item.id
                  ? 'bg-light-accent/10 text-light-accent dark:bg-dark-accent/20 dark:text-dark-accent'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          {user.isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
                currentRoute === 'admin'
                  ? 'bg-light-accent/10 text-light-accent dark:bg-dark-accent/20 dark:text-dark-accent'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck size={20} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>
        <div>
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left ${
              currentRoute === 'settings'
                ? 'bg-slate-200 dark:bg-slate-700'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
