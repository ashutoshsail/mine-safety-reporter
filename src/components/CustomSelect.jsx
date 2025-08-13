import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ name, options, value, onChange, placeholder = "Select...", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div ref={selectRef} className="relative w-full">
            <button
                type="button"
                name={name}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between text-left bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-light-border dark:border-dark-border text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="truncate">{value || placeholder}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-lg z-10" style={{ maxHeight: 'calc(66.66vh - 80px)', maxWidth: '80vw' }}>
                    <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {options.map((option) => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="px-3 py-1.5 text-xs sm:text-sm rounded-md cursor-pointer hover:bg-light-primary/10 hover:text-light-primary dark:hover:bg-dark-primary/20 dark:hover:text-dark-primary"
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
