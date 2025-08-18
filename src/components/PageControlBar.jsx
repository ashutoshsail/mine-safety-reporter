import React from 'react';
import { ArrowDownUp, Filter as FilterIcon } from 'lucide-react';
import FloatingFilterBar from './FloatingFilterBar'; // We will reuse this component

const LogPageControls = ({ filters, setFilters, sortConfig, setSortConfig, onFilterOpen }) => {
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext); // Assuming ConfigContext is available
    const activeFilterCount = Object.values(filters).filter(f => Array.isArray(f) ? f.length > 0 : f.start).length;
    const sortOptions = [
        {key: 'date', label: 'Date'}, 
        {key: 'daysLost', label: 'Days Lost'},
        {key: 'type', label: 'Incident Type'}, 
        {key: 'mine', label: 'Mine'},
    ];

    return (
        <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
                <button onClick={onFilterOpen} className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <FilterIcon size={16} className="text-light-primary" />
                    <span className="font-semibold text-sm">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-light-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                    )}
                </button>
                <span className="text-sm font-semibold text-light-subtle-text flex-shrink-0">Sort by:</span>
                <select value={sortConfig.key} onChange={e => setSortConfig({...sortConfig, key: e.target.value})} className="flex-1 p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border bg-slate-100">
                    {sortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
                <button onClick={() => setSortConfig({...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="p-2 rounded-md border dark:border-dark-border bg-slate-100 dark:bg-slate-700">
                    <ArrowDownUp size={16} />
                </button>
            </div>
        </div>
    );
};


const PageControlBar = ({ currentRoute, pageState, pageHandlers }) => {
    if (!['log', 'analytics', 'comparison'].includes(currentRoute)) {
        return null; // Don't render anything on other pages
    }

    let content = null;

    if (currentRoute === 'log') {
        content = <LogPageControls {...pageState} {...pageHandlers} />;
    }
    
    if (currentRoute === 'analytics' || currentRoute === 'comparison') {
        content = <FloatingFilterBar filters={pageState.filters} />;
    }

    return (
        <div className="sticky top-4 lg:top-5 z-20 mb-4">
            {content}
        </div>
    );
};

export default PageControlBar;