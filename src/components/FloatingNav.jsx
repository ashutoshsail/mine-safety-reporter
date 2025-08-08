import React, { useState, useEffect, useRef } from 'react';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, X, Menu } from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const FloatingNav = ({ setRoute, currentRoute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navRef]);

  const handleNavClick = (route) => {
    setRoute(route);
    setIsOpen(false);
  };

  return (
    <div ref={navRef} className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-end gap-3 mb-20">
            {navItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick(item.id)}>
                <span className="bg-light-card dark:bg-dark-card px-3 py-1 rounded-md text-sm shadow-md whitespace-nowrap">{item.label}</span>
                <button className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${currentRoute === item.id ? 'bg-light-accent text-white' : 'bg-light-card dark:bg-dark-card'}`}>
                  <item.icon size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="absolute bottom-0 right-0 w-16 h-16 bg-light-secondary dark:bg-dark-secondary text-white rounded-full flex items-center justify-center shadow-xl transform transition-transform duration-300 hover:scale-105">
          <div className="relative w-6 h-6">
              <Menu size={28} className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-45 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X size={28} className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-50'}`} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default FloatingNav;
