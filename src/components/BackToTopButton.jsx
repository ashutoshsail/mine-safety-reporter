import React, { useContext } from 'react';
import { ArrowUp } from 'lucide-react';
import { UIContext } from '../context/UIContext';


const BackToTopButton = ({ isVisible, scrollContainerRef }) => {
  const { navPreference } = useContext(UIContext);
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`fixed ${navPreference === 'bottom' ? 'bottom-20' : 'bottom-4'} left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <button 
        onClick={scrollToTop}
        className="bg-light-secondary hover:bg-light-secondary/90 dark:bg-dark-secondary dark:hover:bg-dark-secondary/90 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default BackToTopButton;