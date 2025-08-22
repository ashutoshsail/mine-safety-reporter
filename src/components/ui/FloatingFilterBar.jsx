// File: src/components/ui/FloatingFilterBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * A memoized reusable dropdown "pill" component for filtering.
 * It handles its own open/close state and outside clicks.
 * @param {object} props - The component props.
 * @param {string} props.label - The label of the filter (e.g., "Mines", "Types").
 * @param {Array<string>} props.options - The list of options to display.
 * @param {Array<string>|string} props.selected - The currently selected option(s).
 * @param {Function} props.onSelect - The function to call when an option is selected.
 * @param {Function} [props.onSelectAll] - Optional function to select/deselect all.
 * @param {boolean} [props.isAllSelected=false] - Whether all options are currently selected.
 * @param {boolean} [props.isSingleSelect=false] - If true, treats the filter as a single-select dropdown.
 * @returns {JSX.Element} The rendered filter pill.
 */
const FilterPill = React.memo(({ label, options, selected, onSelect, onSelectAll, isAllSelected, isSingleSelect = false }) => {
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
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 text-sm font-medium bg-light-card dark:bg-dark-card px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
                <span>{getDisplayText()}</span>
                <ChevronDown size={16} className="text-light-subtle-text" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 bg-light-card dark:bg-dark-card border dark:border-dark-border rounded-lg shadow-xl w-56 z-20">
                    <ul className="max-h-60 overflow-y-auto text-sm p-1">
                        {!isSingleSelect && (
                            <li 
                                className="px-2 py-1.5 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" 
                                onClick={onSelectAll}
                            >
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </li>
                        )}
                        {(options || []).map(option => (
                            <li 
                                key={option} 
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" 
                                onClick={() => onSelect(option)}
                            >
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
});

export default FilterPill;
