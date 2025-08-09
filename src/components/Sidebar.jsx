import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, Shield, ShieldCheck } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
];

const Sidebar = ({ setRoute, currentRoute }) => {
  const { user } = useContext(AppContext);

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-light-card dark:bg-dark-card border-r border-slate-200 dark:border-slate-700 flex-col p-4 hidden lg:flex z-30">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield size={28} className="text-light-accent" />
        <h1 className="text-xl font-bold">Mine Safety</h1>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setRoute(item.id)}
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
        {/* Conditionally render Admin Panel link */}
        {user.isAdmin && (
          <button
            onClick={() => setRoute('admin')}
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
          onClick={() => setRoute('settings')}
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
  );
};

export default Sidebar;
