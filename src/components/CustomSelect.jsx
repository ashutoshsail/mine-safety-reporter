import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", disabled = false }) => {
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
        onChange({ target: { name: selectRef.current.name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div ref={selectRef} className="relative w-full" name={name}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between text-left bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span>{value || placeholder}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-light-card dark:bg-dark-card border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-10" style={{ maxHeight: '66.66vh', maxWidth: '80vw' }}>
                    <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {options.map((option) => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="px-3 py-1.5 text-xs sm:text-sm rounded-md cursor-pointer hover:bg-light-accent/10 hover:text-light-accent dark:hover:bg-dark-accent/20 dark:hover:text-dark-accent"
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
