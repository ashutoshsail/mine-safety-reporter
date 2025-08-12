import React, { useState, useEffect, useRef, useContext, memo } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, X, Menu, ShieldCheck } from 'lucide-react';

const baseNavItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
  { id: 'analytics', icon: BarChart2, label: 'Dashboard' },
  { id: 'comparison', icon: GitCompareArrows, label: 'Comparison' },
];

const FloatingNav = memo(({ setRoute, currentRoute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useContext(AppContext);
  const navRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNavClick = (route) => {
    setRoute(route);
    setIsOpen(false);
  };

  const navItems = [...baseNavItems];
  if (user.isAdmin) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin Panel' });
  }
  navItems.push({ id: 'settings', icon: Settings, label: 'Settings' });


  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsOpen(false)}></div>}
      <div ref={navRef} className="fixed bottom-4 right-4 z-50 lg:hidden">
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
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="absolute bottom-0 right-0 w-auto h-16 bg-light-secondary dark:bg-dark-secondary text-white rounded-full flex items-center justify-center shadow-xl transform transition-transform duration-300 hover:scale-105 px-4"
          >
            <div className="flex items-center justify-center gap-2">
                {isOpen ? <X size={24} /> : <><Menu size={24} /><span className="text-sm font-semibold">More</span></>}
            </div>
          </button>
        </div>
      </div>
    </>
  );
});

export default FloatingNav;
