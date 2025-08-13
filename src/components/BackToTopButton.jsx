import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTopButton = ({ scrollContainerRef }) => {
    const [isVisible, setIsVisible] = useState(false);

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

    return (
        // CRITICAL FIX: Increased right margin for better spacing
        <div className="fixed bottom-4 right-36 z-40 lg:hidden">
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
