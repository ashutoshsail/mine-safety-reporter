import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { ChevronDown, ChevronUp, Clock, Calendar, History, X, Send, ArrowDownUp, Filter } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

const mineColors = {
    "DMM": "border-blue-500", "JMM": "border-green-500", "RMM": "border-red-500", 
    "DIOM": "border-yellow-500", "Mahamaya": "border-purple-500", "Kalwar": "border-pink-500",
    "Rowghat": "border-indigo-500", "Nandini": "border-teal-500", "Hirri": "border-orange-500", 
    "Koteshwar": "border-cyan-500"
};

const COMMENT_TAGS = ["Enquiry Report", "Measures Suggested", "Action Taken"];

const IncidentCard = ({ incident }) => {
    const { updateIncident, addComment } = useContext(AppContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [mandays, setMandays] = useState(incident.mandaysLost || '');
    const [showHistory, setShowHistory] = useState(false);

    const handleStatusToggle = () => {
        if (!window.confirm(`Are you sure you want to change the status to "${incident.status === 'Open' ? 'Closed' : 'Open'}"?`)) return;
        const newStatus = incident.status === 'Open' ? 'Closed' : 'Open';
        updateIncident(incident.docId, { status: newStatus });
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            addComment(incident.docId, commentText, selectedTags);
            setCommentText('');
            setSelectedTags([]);
        }
    };

    const handleMandaysBlur = () => {
        const value = parseInt(mandays, 10);
        if (!isNaN(value) && value !== incident.mandaysLost) {
            updateIncident(incident.docId, { mandaysLost: value });
        }
    };
    
    return (
        <div className={`bg-light-card dark:bg-dark-card rounded-lg shadow-md border-l-4 ${mineColors[incident.mine] || 'border-slate-500'}`}>
            <div className="p-4 flex items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex-grow">
                    <p className="font-semibold text-light-text dark:text-dark-text">{incident.type}</p>
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">{incident.id}</p>
                </div>
                <div className="hidden lg:block w-96 mx-4 flex-shrink-0">
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text line-clamp-2">{incident.description}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="w-20 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full bg-light-status-${incident.status === 'Open' ? 'danger' : 'success'}/10 text-light-status-${incident.status === 'Open' ? 'danger' : 'success'}`}>{incident.status}</span>
                    </div>
                    <span className="text-sm hidden sm:block w-28 text-right text-light-subtle-text dark:text-dark-subtle-text">{format(new Date(incident.date), 'PPP')}</span>
                    <ChevronDown size={20} className={`transition-transform text-light-subtle-text dark:text-dark-subtle-text ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-light-border dark:border-dark-border space-y-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <p><strong>Reporter:</strong> {incident.reporterName}</p>
                        <p><strong>Mine:</strong> {incident.mine}</p>
                        <p><strong>Section:</strong> {incident.sectionName}</p>
                        <p><strong>Location:</strong> {incident.location}</p>
                        <div className="flex items-center gap-2"><Calendar size={14} /> {format(new Date(incident.date), 'PPP')}</div>
                        <div className="flex items-center gap-2"><Clock size={14} /> {incident.time}</div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 text-sm">Description</h4>
                        <p className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md">{incident.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleStatusToggle} className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold px-3 py-1 rounded-md">Mark as {incident.status === 'Open' ? 'Closed' : 'Open'}</button>
                        <button onClick={() => setShowHistory(true)} className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 font-semibold px-3 py-1 rounded-md flex items-center gap-1"><History size={14} /> History</button>
                        {incident.type === 'Lost Time Injury (LTI)' && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold">Mandays Lost:</label>
                                <input type="number" value={mandays} onChange={(e) => setMandays(e.target.value)} onBlur={handleMandaysBlur} className="w-16 bg-slate-100 dark:bg-slate-700 p-1 rounded-md border border-light-border dark:border-dark-border text-sm" />
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold mb-1 text-sm">Comments</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-2">
                            {(incident.comments || []).map((comment, index) => (
                                <div key={index} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-sm">
                                    {comment.tags && comment.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {comment.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-light-accent/20 text-light-accent dark:bg-dark-accent/30 dark:text-dark-accent px-1.5 py-0.5 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <p>{comment.text}</p>
                                    <p className="text-xs text-right text-slate-400 dark:text-slate-500 mt-1">- {comment.user} on {format(parseISO(comment.timestamp), 'MMM d, h:mm a')}</p>
                                </div>
                            ))}
                            {(incident.comments || []).length === 0 && <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">No comments yet.</p>}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="space-y-2">
                             <div className="flex flex-wrap gap-2">
                                {COMMENT_TAGS.map(tag => (
                                    <button
                                        type="button"
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedTags.includes(tag) ? 'bg-light-accent text-white border-light-accent' : 'bg-slate-200 dark:bg-slate-700 border-transparent'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-grow bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-light-border dark:border-dark-border text-sm" />
                                <button type="submit" className="bg-light-primary hover:bg-light-primary/90 text-white font-semibold px-3 py-2 rounded-md text-sm"><Send size={16} /></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl max-w-lg w-full">
                        <div className="p-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold">Incident History</h3><button onClick={() => setShowHistory(false)}><X size={24} /></button></div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto"><ul className="space-y-3">{incident.history.map((item, index) => (<li key={index} className="text-sm border-l-2 pl-3 border-slate-300 dark:border-slate-600"><p className="font-semibold">{item.action}</p><p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">by {item.user} on {format(parseISO(item.timestamp), 'PPP p')}</p></li>))}</ul></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const IncidentLogPage = () => {
    const { incidents } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: [],
        type: [],
        mine: [],
        dateRange: { start: null, end: null },
        period: 'All Time'
    });

    const filteredAndSortedIncidents = useMemo(() => {
        let filtered = [...incidents];

        if (filters.status.length > 0) filtered = filtered.filter(inc => filters.status.includes(inc.status));
        if (filters.type.length > 0) filtered = filtered.filter(inc => filters.type.includes(inc.type));
        if (filters.mine.length > 0) filtered = filtered.filter(inc => filters.mine.includes(inc.mine));
        if (filters.dateRange.start && filters.dateRange.end) {
            filtered = filtered.filter(inc => {
                const incDate = new Date(inc.date);
                return incDate >= filters.dateRange.start && incDate <= filters.dateRange.end;
            });
        }

        filtered.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [incidents, filters, sortConfig]);
    
    const activeFilterCount = Object.values(filters).filter(f => Array.isArray(f) ? f.length > 0 : f.start).length;
    const sortOptions = [{key: 'date', label: 'Date'}, {key: 'type', label: 'Incident Type'}, {key: 'mine', label: 'Mine'}];
    
    return (
        <div className="space-y-4">
            <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="w-full flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md"
                    >
                        <Filter size={16} className="text-light-accent" />
                        <span className="font-semibold text-sm">Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-light-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                        )}
                    </button>
                    <div className="flex gap-2">
                         <select value={sortConfig.key} onChange={e => setSortConfig({...sortConfig, key: e.target.value})} className="flex-grow p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border bg-slate-100">
                            {sortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                        <button onClick={() => setSortConfig({...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})} className="p-2 rounded-md border dark:border-dark-border bg-slate-100 dark:bg-slate-700">
                            <ArrowDownUp size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredAndSortedIncidents.map(incident => (
                    <IncidentCard key={incident.docId} incident={incident} />
                ))}
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

    const handleMultiSelect = (filterKey, value) => {
        setTempFilters(prev => ({
            ...prev,
            [filterKey]: prev[filterKey].includes(value)
                ? prev[filterKey].filter(item => item !== value)
                : [...prev[filterKey], value]
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
        setTempFilters(prev => ({
            ...prev,
            dateRange: {...prev.dateRange, [part]: new Date(value)},
            period: 'Custom'
        }));
    };

    const applyChanges = () => {
        setFilters(tempFilters);
        onClose();
    };
    
    const resetFilters = () => {
        const initial = { status: [], type: [], mine: [], dateRange: { start: null, end: null }, period: 'All Time' };
        setTempFilters(initial);
        setFilters(initial);
        onClose();
    };

    const periodFilters = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Last Year'];
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md my-8">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Filter Incidents</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Date Range</h3>
                        <div className="flex flex-wrap gap-2">
                            {periodFilters.map(p => (
                                <button key={p} onClick={() => handleDateRange(p)} className={`text-xs px-2 py-1 rounded-full ${tempFilters.period === p ? 'bg-light-accent text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{p}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="date" value={tempFilters.dateRange.start ? format(tempFilters.dateRange.start, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('start', e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                            <input type="date" value={tempFilters.dateRange.end ? format(tempFilters.dateRange.end, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('end', e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                        </div>
                    </div>
                    <MultiSelectFilter title="Status" options={['Open', 'Closed']} selected={tempFilters.status} onSelect={v => handleMultiSelect('status', v)} />
                    <MultiSelectFilter title="Mine" options={MINES} selected={tempFilters.mine} onSelect={v => handleMultiSelect('mine', v)} />
                    <MultiSelectFilter title="Incident Type" options={INCIDENT_TYPES} selected={tempFilters.type} onSelect={v => handleMultiSelect('type', v)} />
                </div>
                <div className="p-4 border-t flex justify-between">
                    <button onClick={resetFilters} className="text-sm font-semibold text-slate-500">Reset</button>
                    <button onClick={applyChanges} className="text-sm font-semibold bg-light-accent text-white px-4 py-2 rounded-md">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

const MultiSelectFilter = ({ title, options, selected, onSelect }) => (
    <div className="space-y-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <div className="max-h-32 overflow-y-auto space-y-1 p-2 border rounded-md dark:border-dark-border">
            {options.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(option)} onChange={() => onSelect(option)} className="h-4 w-4 rounded text-light-accent focus:ring-light-accent" />
                    <span className="text-sm">{option}</span>
                </label>
            ))}
        </div>
    </div>
);

export default IncidentLogPage;
