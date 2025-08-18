import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { ArrowDownUp, Filter, X } from 'lucide-react';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns';
import IncidentCard from '../components/IncidentCard';

const IncidentLogPage = () => {
    const { incidents } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: [], type: [], mine: [], dateRange: { start: null, end: null }, period: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Effect to set the default filters once config data is loaded
    useEffect(() => {
        if (MINES && MINES.length > 0 && INCIDENT_TYPES && INCIDENT_TYPES.length > 0 && filters.period === '') {
            const today = new Date();
            setFilters({
                status: ['Open', 'Closed'],
                mine: MINES,
                type: INCIDENT_TYPES,
                dateRange: { start: startOfMonth(today), end: endOfDay(today) },
                period: 'This Month'
            });
        }
    }, [MINES, INCIDENT_TYPES, filters.period]);

    const filteredAndSortedIncidents = useMemo(() => {
        // If any filter category is empty, show no results.
        if (filters.status.length === 0 || filters.type.length === 0 || filters.mine.length === 0) {
            return [];
        }

        let filtered = [...(incidents || [])].filter(inc => {
            if (!filters.status.includes(inc.status)) return false;
            if (!filters.type.includes(inc.type)) return false;
            if (!filters.mine.includes(inc.mine)) return false;
            if (filters.dateRange.start && filters.dateRange.end) {
                const incDate = new Date(inc.date);
                if (incDate < filters.dateRange.start || incDate > filters.dateRange.end) {
                    return false;
                }
            }
            return true;
        });

        filtered.sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            switch(sortConfig.key) {
                case 'status':
                    const statusOrder = { 'Open': 1, 'Closed': 2 };
                    return (statusOrder[a.status] - statusOrder[b.status]) * (sortConfig.direction === 'asc' ? 1 : -1);
                case 'daysLost':
                    return ((a.daysLost || 0) - (b.daysLost || 0)) * dir;
                case 'date':
                    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                    return (dateA.getTime() - dateB.getTime()) * (sortConfig.direction === 'asc' ? 1 : -1);
                default:
                    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * dir;
                    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * dir;
                    return 0;
            }
        });
        return filtered;
    }, [incidents, filters, sortConfig]);
    
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if(MINES && INCIDENT_TYPES) {
            if (filters.status.length > 0 && filters.status.length < 2) count++;
            if (filters.mine.length > 0 && filters.mine.length < MINES.length) count++;
            if (filters.type.length > 0 && filters.type.length < INCIDENT_TYPES.length) count++;
            if (filters.period !== 'This Month' && filters.period !== 'All Time' && filters.period !== '') count++;
             if (filters.period === 'All Time') count = 0; 
        }
        return count;
    }, [filters, MINES, INCIDENT_TYPES]);
    
    const sortOptions = [
        {key: 'status', label: 'Status'},
        {key: 'date', label: 'Date'}, 
        {key: 'daysLost', label: 'Days Lost'},
        {key: 'type', label: 'Incident Type'}, 
        {key: 'mine', label: 'Mine'},
    ];
    
    return (
        <div className="space-y-4">
            <div className="sticky top-4 z-20">
                <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md overflow-x-auto">
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setIsFilterOpen(true)} className="w-16 flex-shrink-0 flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                            <Filter size={16} className="text-light-primary" />
                            <span className="text-sm">Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-light-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                            )}
                        </button>
                        <span className="flex-shrink-0 whitespace-nowrap text-sm text-light-subtle-text">Sort by:</span>
                        <select value={sortConfig.key} onChange={e => setSortConfig({...sortConfig, key: e.target.value})} className="w-24 flex-shrink-0 p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border bg-slate-100">
                            {sortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                        <button onClick={() => setSortConfig({...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="flex-shrink-0 p-2 rounded-md border dark:border-dark-border bg-slate-100 dark:bg-slate-700">
                            <ArrowDownUp size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {filteredAndSortedIncidents.map(incident => (
                    <IncidentCard key={incident.docId || incident.id} incident={incident} />
                ))}
                 {filteredAndSortedIncidents.length === 0 && (
                    <div className="text-center py-10 text-light-subtle-text dark:text-dark-subtle-text">
                        <p>No incidents match the current filters.</p>
                    </div>
                )}
            </div>
            
            {isFilterOpen && 
                <FilterPanel 
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                />
            }
        </div>
    );
};

const FilterPanel = ({ onClose, filters, setFilters }) => {
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    const [tempFilters, setTempFilters] = useState(filters);
    const [showAllPeriods, setShowAllPeriods] = useState(false);
    const handleMultiSelect = (filterKey, value) => {
      setTempFilters(prev => ({
        ...prev,
        [filterKey]: prev[filterKey].includes(value)
          ? prev[filterKey].filter(item => item !== value)
          : [...prev[filterKey], value]
      }));
    };
    const handleSelectAll = (filterKey, allValues) => {
      setTempFilters(prev => ({
        ...prev,
        [filterKey]: prev[filterKey].length === allValues.length ? [] : allValues
      }));
    };
    const handleDateRange = (period) => {
        const today = new Date();
        let start = null, end = null;
        switch(period) {
            case 'Today': start = startOfDay(today); end = endOfDay(today); break;
            case 'Yesterday': start = startOfDay(subDays(today, 1)); end = endOfDay(subDays(today, 1)); break;
            case 'Last 7 Days': start = startOfDay(subDays(today, 6)); end = endOfDay(today); break;
            case 'This Month': start = startOfMonth(today); end = endOfDay(today); break;
            case 'Last Month': start = startOfMonth(subMonths(today, 1)); end = endOfMonth(subMonths(today, 1)); break;
            case 'Last 3 Months': start = startOfMonth(subMonths(today, 2)); end = endOfDay(today); break;
            case 'Last 6 Months': start = startOfMonth(subMonths(today, 5)); end = endOfDay(today); break;
            case 'This Year': start = startOfYear(today); end = endOfDay(today); break;
            case 'Last Year': start = startOfYear(subMonths(today, 12)); end = endOfYear(subMonths(today, 12)); break;
            default: start = null; end = null;
        }
        setTempFilters(prev => ({...prev, dateRange: {start, end}, period}));
    };
    const handleCustomDateChange = (part, value) => {
        setTempFilters(prev => ({ ...prev, dateRange: {...prev.dateRange, [part]: new Date(value)}, period: 'Custom' }));
    };
    const applyChanges = () => {
        setFilters(tempFilters);
        onClose();
    };
    const clearFilters = () => {
        const initial = { status: [], type: [], mine: [], dateRange: { start: null, end: null }, period: 'All Time' };
        setTempFilters(initial);
    };
    const periodFilters = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Last Year'];
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md my-8 max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b dark:border-dark-border flex justify-between items-center">
                    <h2 className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="p-3 overflow-y-auto flex flex-col gap-3">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs text-slate-500 dark:text-slate-400">Date Range</h3>
                            <button onClick={() => setShowAllPeriods(prev => !prev)} className="text-xs text-light-primary">{showAllPeriods ? '<< Less' : 'More >>'}</button>
                        </div>
                        {!showAllPeriods ? (
                            <div className="overflow-x-auto pb-2"><div className="flex items-center gap-2 w-max">{periodFilters.slice(0, 4).map(p => (<button key={p} onClick={() => handleDateRange(p)} className={`text-xs px-2 py-1 rounded-full ${tempFilters.period === p ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{p}</button>))}</div></div>
                        ) : (
                            <><div className="flex flex-wrap gap-2 pt-2">{periodFilters.map(p => (<button key={p} onClick={() => handleDateRange(p)} className={`text-xs px-2 py-1 rounded-full ${tempFilters.period === p ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{p}</button>))}</div><div className="flex gap-2"><input type="date" placeholder="From" value={tempFilters.dateRange.start ? format(tempFilters.dateRange.start, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('start', e.target.value)} className="text-xs w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" /><input type="date" placeholder="To" value={tempFilters.dateRange.end ? format(tempFilters.dateRange.end, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('end', e.target.value)} className="text-xs w-full p-2 rounded-md border dark:bg-dark-card dark:border-dark-border" /></div></>
                        )}
                    </div>
                    
                    <hr className="border-slate-200 dark:border-slate-700" />
                    
                    <MultiSelectFilter title="Status" options={['Open', 'Closed']} selected={tempFilters.status} onSelect={v => handleMultiSelect('status', v)} columns="2" />

                    <hr className="border-slate-200 dark:border-slate-700" />

                    <MultiSelectFilter title="Mine" options={MINES || []} selected={tempFilters.mine} onSelect={v => handleMultiSelect('mine', v)} onSelectAll={() => handleSelectAll('mine', MINES)} columns="2 sm:grid-cols-2" />

                    <hr className="border-slate-200 dark:border-slate-700" />

                    <MultiSelectFilter title="Incident Type" options={INCIDENT_TYPES || []} selected={tempFilters.type} onSelect={v => handleMultiSelect('type', v)} onSelectAll={() => handleSelectAll('type', INCIDENT_TYPES)} />
                </div>
                <div className="p-3 border-t dark:border-dark-border mt-auto flex justify-between">
                    <button onClick={clearFilters} className="text-xs text-slate-500">Clear</button>
                    <button onClick={applyChanges} className="text-xs bg-light-primary text-white px-4 py-2 rounded-md">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

const MultiSelectFilter = ({ title, options, selected, onSelect, onSelectAll, columns = "1" }) => {
    const areAllSelected = options && options.length > 0 && selected.length === options.length;
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <h3 className="text-xs text-slate-500 dark:text-slate-400">{title}</h3>
                {onSelectAll && <button onClick={onSelectAll} className="text-xs text-light-primary">{areAllSelected ? 'Clear All' : 'Select All'}</button>}
            </div>
            <div className={`max-h-24 overflow-y-auto space-y-1 p-1 -m-1 grid grid-cols-${columns}`}>
                {options && options.map(option => (
                    <label key={option} className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${selected.includes(option) ? 'bg-light-primary/10' : ''}`}>
                        <input type="checkbox" checked={selected.includes(option)} onChange={() => onSelect(option)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary" />
                        <span className="text-xs">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default IncidentLogPage;