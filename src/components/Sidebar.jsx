import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, ShieldCheck, LogOut, X } from 'lucide-react';
import { auth } from '../firebaseConfig';
import LogoIcon from './LogoIcon';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
];

const Sidebar = ({ currentRoute, setRoute, isOpen, setIsOpen }) => {
  const { user } = useContext(AppContext);
  const { companyProfile } = useContext(ConfigContext);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      auth.signOut();
    }
  };

  const finalNavItems = [...navItems];
  if (user.isAdmin) {
    finalNavItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin Panel' });
  }
  finalNavItems.push({ id: 'settings', icon: Settings, label: 'Settings' });
  finalNavItems.push({ id: 'logout', icon: LogOut, label: 'Log Out', action: handleLogout });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border
                   transform transition-transform duration-300 ease-in-out
                   lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
      >
        {/* Mobile close button sits in the top header */}
        <div className="lg:hidden flex justify-end p-2 flex-shrink-0 h-16 border-b border-light-border dark:border-dark-border">
            <button onClick={() => setIsOpen(false)}>
                <X size={24} />
            </button>
        </div>

        {/* This is the new, stable two-panel layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel 1: Navigation List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {finalNavItems.map(item => {
                const isActive = currentRoute === item.id;
                const isLogout = item.id === 'logout';
                return (
                  <li key={item.id}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if(item.action) {
                          item.action();
                        } else {
                          setRoute(item.id);
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                        ${isActive
                          ? 'bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary font-semibold text-base'
                          : isLogout
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium text-sm'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm'
                        }`
                      }
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Panel 2: Logo and App Name (Fixed position with high bottom padding) */}
          <div className="flex-shrink-0" style={{ paddingBottom: '15vh' }}>
             <div className="flex flex-col items-center text-center p-4 border-t border-light-border dark:border-dark-border">
                <LogoIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <p className="text-sm font-bold mt-2">{companyProfile?.name || "Mines Safety App"}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Version 1.0.0</p>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;