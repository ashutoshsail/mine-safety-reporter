import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// This is the reusable dropdown "pill" component
const FilterPill = ({ label, options, selected, onSelect, onSelectAll, isAllSelected, isSingleSelect = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const getDisplayText = () => {
        if (isSingleSelect) return selected;
        if (isAllSelected) return `All ${label}`;
        if (selected.length === 1) return selected[0];
        return `${selected.length} ${label}`;
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-sm font-medium bg-light-card dark:bg-dark-card px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                <span>{getDisplayText()}</span>
                <ChevronDown size={16} className="text-light-subtle-text" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 bg-light-card dark:bg-dark-card border dark:border-dark-border rounded-lg shadow-xl w-56 z-20">
                    {!isSingleSelect && (
                        <div className="flex justify-between items-center p-2 border-b dark:border-dark-border">
                             <span className="text-sm font-semibold px-1">{label}</span>
                             <button onClick={onSelectAll} className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    )}
                    <ul className="max-h-60 overflow-y-auto text-sm p-1">
                        {options.map(option => (
                            <li key={option} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={() => onSelect(option)}>
                                {!isSingleSelect && (
                                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${selected.includes(option) ? 'bg-light-primary border-light-primary' : 'border-slate-300'}`}>
                                        {selected.includes(option) && <Check size={12} className="text-white" />}
                                    </div>
                                )}
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// This is the main floating bar that holds the pills
const FloatingFilterBar = ({ filters }) => {
    return (
        <div className="sticky top-4 z-30">
            <div className="flex items-center justify-center gap-2 md:gap-4 p-2 bg-light-card dark:bg-dark-card rounded-full shadow-lg max-w-lg mx-auto">
                {filters.map(filter => (
                    <FilterPill key={filter.label} {...filter} />
                ))}
            </div>
        </div>
    );
};

export default FloatingFilterBar;