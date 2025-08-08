import React from 'react';
import { Home, FileText, List, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report' },
  { id: 'log', icon: List, label: 'Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const BottomNav = ({ setRoute, currentRoute }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-light-card dark:bg-dark-card border-t border-slate-200 dark:border-slate-700 flex justify-around items-center z-40 lg:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setRoute(item.id)}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentRoute === item.id ? 'text-light-accent dark:text-dark-accent' : 'text-light-subtle-text dark:text-dark-subtle-text'
          }`}
        >
          <item.icon size={20} />
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
