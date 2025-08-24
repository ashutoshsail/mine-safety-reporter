import React, { useState, useEffect, useRef, useContext, memo } from 'react';
import { AuthContext } from '../context/AuthContext';  // ✅ Import AuthContext
import { Home, FileText, List, X, Menu } from 'lucide-react';

const baseNavItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'report', icon: FileText, label: 'Report Incident' },
  { id: 'log', icon: List, label: 'Incident Log' },
];

const FloatingNav = memo(({ setRoute, currentRoute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useContext(AuthContext); // ✅ Use AuthContext here
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

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 dark:bg-gradient-to-t dark:from-white/20 dark:to-transparent z-40 lg:hidden" onClick={() => setIsOpen(false)}></div>}
      <div ref={navRef} className="fixed bottom-4 right-4 z-50 lg:hidden">
        <div className="relative h-16">
          <div className={`absolute bottom-20 right-0 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col items-end gap-3">
              {baseNavItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick(item.id)}>
                  <span className="bg-light-card dark:bg-dark-card px-3 py-1 rounded-md text-sm font-medium shadow-md whitespace-nowrap">{item.label}</span>
                  <button className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${currentRoute === item.id ? 'bg-light-accent text-white' : 'bg-light-card dark:bg-dark-card'}`}>
                    <item.icon size={20} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="absolute bottom-0 right-0 w-auto h-16 bg-light-accent dark:bg-dark-accent text-white rounded-full flex items-center justify-center shadow-xl transform transition-transform duration-300 hover:scale-105 px-4"
          >
            <div className="flex items-center justify-center gap-2">
              {isOpen ? 
                <X size={24} strokeWidth={1.5} /> : 
                <>
                  <Menu size={24} strokeWidth={1.5} />
                  <span className="text-sm font-normal">More</span>
                </>
              }
            </div>
          </button>
        </div>
      </div>
    </>
  );
});

export default FloatingNav;
