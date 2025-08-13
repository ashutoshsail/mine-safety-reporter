import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, Shield, ShieldCheck, X } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
];

const Sidebar = ({ setRoute, currentRoute, isOpen, setIsOpen }) => {
  const { user } = useContext(AppContext);
  const { companyProfile } = useContext(ConfigContext);

  const handleNavClick = (route) => {
    setRoute(route);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)}></div>}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col p-4 z-40 transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            {companyProfile?.logoUrl && (
                <img src={companyProfile.logoUrl} alt="Company Logo" className="h-8 w-auto object-contain" />
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-light-subtle-text dark:text-dark-subtle-text">
            <X size={24} />
          </button>
        </div>

        {/* Container 1: Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left text-light-text dark:text-dark-text ${
                currentRoute === item.id
                  ? 'bg-light-primary/10 text-light-primary font-semibold text-base'
                  : 'font-normal hover:bg-light-text/5 dark:hover:bg-dark-text/5'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          {user.isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left text-light-text dark:text-dark-text ${
                currentRoute === 'admin'
                  ? 'bg-light-primary/10 text-light-primary font-semibold text-base'
                  : 'font-normal hover:bg-light-text/5 dark:hover:bg-dark-text/5'
              }`}
            >
              <ShieldCheck size={18} />
              <span>Admin Panel</span>
            </button>
          )}
           <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left text-light-text dark:text-dark-text ${
              currentRoute === 'settings'
                ? 'bg-light-text/10 dark:bg-dark-text/10 font-semibold text-base'
                : 'font-normal hover:bg-light-text/5 dark:hover:bg-dark-text/5'
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Container 2: Branding Footer */}
        <div className="mt-8">
           <div className="flex flex-col items-center text-center gap-2">
                <Shield size={24} className="text-light-primary dark:text-dark-primary" />
                <div>
                    <p className="text-sm font-normal text-light-primary dark:text-dark-primary leading-tight">Mine Safety Reporter</p>
                    <p className="text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text">Made by Ashutosh Tripathi</p>
                </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
