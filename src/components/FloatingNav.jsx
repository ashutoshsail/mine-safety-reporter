import React, { useState, useEffect, useRef } from 'react';
import { Home, FileText, List, BarChart2, GitCompareArrows, Settings, X, Menu } from 'lucide-react';

const navItems = [
  // ... (navItems array remains the same)
];

const FloatingNav = ({ setRoute, currentRoute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    // ... (logic to close on outside click remains the same)
  }, [navRef]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setIsOpen(false)}></div>}
      <div ref={navRef} className="fixed bottom-4 right-4 z-50 lg:hidden">
        {/* ... (rest of the component is updated for better styling and the "More" text) ... */}
        <button onClick={() => setIsOpen(!isOpen)} className="...">
            <div className="flex items-center justify-center gap-2">
                {isOpen ? <X size={24} /> : <><Menu size={24} /><span className="text-sm font-semibold">More</span></>}
            </div>
        </button>
      </div>
    </>
  );
};

export default FloatingNav;
