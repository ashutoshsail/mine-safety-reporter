import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowUp } from 'lucide-react';

const BackToTopButton = ({ scrollContainerRef }) => {
    const [isVisible, setIsVisible] = useState(false);
    const { navPreference } = useContext(AppContext);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const toggleVisibility = () => {
            if (container.scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        container.addEventListener('scroll', toggleVisibility);
        return () => {
            container.removeEventListener('scroll', toggleVisibility);
        };
    }, [scrollContainerRef]);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const positionClass = navPreference === 'bottom' ? 'bottom-20' : 'bottom-4';

    return (
        <div className={`fixed ${positionClass} right-36 z-40 lg:hidden`}>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="bg-light-primary/80 hover:bg-light-primary text-white w-auto h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 backdrop-blur-sm px-4"
                >
                    <div className="flex items-center justify-center gap-2">
                        <ArrowUp size={20} />
                        <span className="text-sm font-semibold">Top</span>
                    </div>
                </button>
            )}
        </div>
    );
};

export default BackToTopButton;
