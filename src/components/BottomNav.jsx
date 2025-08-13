import React, { useContext, memo } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, FileText, List, Settings } from 'lucide-react';

const baseNavItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report' },
  { id: 'log', icon: List, label: 'Log' },
];

const BottomNav = memo(({ setRoute, currentRoute }) => {
  const { user } = useContext(AppContext);

  const navItems = [...baseNavItems];
  // The Settings link is now the final item
  navItems.push({ id: 'settings', icon: Settings, label: 'Settings' });

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border flex justify-around items-center z-40 lg:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setRoute(item.id)}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentRoute === item.id ? 'text-light-primary dark:text-dark-primary' : 'text-light-subtle-text dark:text-dark-subtle-text'
          }`}
        >
          <item.icon size={20} />
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </div>
  );
});

export default BottomNav;
