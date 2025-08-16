import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { ChevronDown, ChevronUp, Clock, Calendar, History, X, Send, ArrowDownUp, Filter, Paperclip, Upload, ShieldAlert, AlertTriangle } from 'lucide-react';
import { format, parseISO, startOfDay, addDays, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

// NEW: Helper function now accepts an optional end date
const calculateDaysLost = (incidentDateStr, endDateStr = null) => {
    const startDate = startOfDay(parseISO(incidentDateStr));
    // Use the provided end date, or default to today
    const endDate = endDateStr ? startOfDay(parseISO(endDateStr)) : startOfDay(new Date());

    if (endDate < startDate) return 0;

    let count = 0;
    let currentDate = startDate;

    while (currentDate <= endDate) {
        // getDay() returns 0 for Sunday
        if (currentDate.getDay() !== 0) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }
    return count;
};

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
    const [daysLost, setDaysLost] = useState(incident.daysLost ?? 0);
    const [showHistory, setShowHistory] = useState(false);
    const [photosToUpload, setPhotosToUpload] = useState([]);
    const fileInputRef = useRef(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const finalDaysLostRef = useRef(daysLost);

    const isLTI = !['Near Miss', 'High Potential Incident'].includes(incident.type);

    useEffect(() => {
        if (isLTI) {
            if (incident.status === 'Open') {
                const calculatedDays = calculateDaysLost(incident.date);
                setDaysLost(calculatedDays);
                finalDaysLostRef.current = calculatedDays;
            } else { // Status is 'Closed'
                const closeEvent = (incident.history || []).find(h => h.action.includes('Status to Closed'));
                if (closeEvent && closeEvent.timestamp) {
                    const calculatedDays = calculateDaysLost(incident.date, closeEvent.timestamp);
                    setDaysLost(calculatedDays);
                    finalDaysLostRef.current = calculatedDays;
                } else {
                    setDaysLost(incident.daysLost ?? 0);
                    finalDaysLostRef.current = incident.daysLost ?? 0;
                }
            }
        }
    }, [incident.status, incident.date, incident.daysLost, incident.history, isLTI]);


    const handleDaysLostBlur = () => {
        const value = parseInt(daysLost, 10);
        if (!isNaN(value) && value !== incident.daysLost) {
            updateIncident(incident.docId, { daysLost: value });
        }
    };

    const handleStatusToggle = () => {
        if (incident.status === 'Open') {
            setIsCloseModalOpen(true);
        } else {
            if (!window.confirm(`Are you sure you want to re-open this incident?`)) return;
            updateIncident(incident.docId, { status: 'Open' });
        }
    };

    const handleConfirmClose = () => {
        const finalValue = parseInt(finalDaysLostRef.current.value, 10) || 0;
        updateIncident(incident.docId, { status: 'Closed', daysLost: finalValue });
        setIsCloseModalOpen(false);
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? [] : [tag]);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            addComment(incident.docId, commentText, selectedTags);
            setCommentText('');
            setSelectedTags([]);
        }
    };

    const handleFileSelect = (e) => { /* ... function code ... */ };
    const handleUploadPhotos = async () => { /* ... function code ... */ };
    const removePhotoToUpload = (index) => { /* ... function code ... */ };

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
                    {(incident.daysLost ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                            <ShieldAlert size={14} />
                            <span className="text-xs font-bold">{incident.daysLost} Days Lost</span>
                        </div>
                    )}
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

                    <div className="flex flex-wrap items-center gap-4">
                        <button onClick={handleStatusToggle} className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold px-3 py-1 rounded-md">Mark as {incident.status === 'Open' ? 'Closed' : 'Open'}</button>
                        <button onClick={() => setShowHistory(true)} className="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 font-semibold px-3 py-1 rounded-md flex items-center gap-1"><History size={14} /> History</button>
                        <button onClick={() => fileInputRef.current.click()} className="text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 font-semibold px-3 py-1 rounded-md flex items-center gap-1"><Paperclip size={14} /> Attach Photo</button>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                        
                        {isLTI && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                                <label className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">Days Lost:</label>
                                <input 
                                    type="number" 
                                    value={daysLost} 
                                    onChange={(e) => setDaysLost(e.target.value)} 
                                    onBlur={handleDaysLostBlur} 
                                    className="w-20 bg-white dark:bg-slate-700 p-1 rounded-md border border-yellow-300 dark:border-yellow-700 text-sm font-semibold"
                                    disabled={incident.status === 'Closed'}
                                />
                            </div>
                        )}
                    </div>
                    {/* ... photos and comments sections ... */}
                </div>
            )}

            {isCloseModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-4 text-center">
                            <AlertTriangle className="mx-auto text-yellow-500 mb-3" size={40} />
                            <h3 className="text-lg font-bold mb-2">Confirm Final Days Lost</h3>
                            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mb-4">
                                Please review and confirm the total number of days lost before closing this incident.
                            </p>
                            <input 
                                type="number"
                                ref={finalDaysLostRef}
                                defaultValue={daysLost}
                                className="w-1/2 mx-auto text-center text-2xl font-bold p-2 rounded-md border border-light-border dark:border-dark-border bg-slate-100 dark:bg-slate-700"
                            />
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button onClick={() => setIsCloseModalOpen(false)} className="flex-1 bg-slate-200 dark:bg-slate-600 font-semibold py-2 rounded-md text-sm">Cancel</button>
                            <button onClick={handleConfirmClose} className="flex-1 bg-light-status-danger text-white font-semibold py-2 rounded-md text-sm">Confirm & Close Incident</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showHistory && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
                     <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                         <div className="p-4 border-b flex justify-between items-center">
                             <h3 className="text-lg font-semibold">Incident History</h3>
                             <button onClick={() => setShowHistory(false)}><X size={24} /></button>
                         </div>
                         <div className="p-4 overflow-y-auto">
                             <ul className="space-y-3">
                                 {incident.history && incident.history.map((item, index) => (
                                     <li key={index} className="text-sm border-l-2 pl-3 border-slate-300 dark:border-slate-600">
                                         <p className="font-semibold">{item.action}</p>
                                         <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">by {item.user} on {format(parseISO(item.timestamp), 'PPP p')}</p>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

const IncidentLogPage = () => {
    const { incidents } = useContext(AppContext);
    
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: [], type: [], mine: [], dateRange: { start: null, end: null }, period: 'All Time'
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredAndSortedIncidents = useMemo(() => {
        let filtered = [...(incidents || [])];

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
            if (sortConfig.key === 'daysLost') {
                const valA = a.daysLost || 0;
                const valB = b.daysLost || 0;
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
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
    const sortOptions = [
        {key: 'date', label: 'Date'}, 
        {key: 'daysLost', label: 'Days Lost'},
        {key: 'type', label: 'Incident Type'}, 
        {key: 'mine', label: 'Mine'},
    ];
    
    return (
        <div className="space-y-4">
            <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFilterOpen(true)} className="flex-1 flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                        <Filter size={16} className="text-light-primary" />
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

    const handleMultiSelect = (filterKey, value) => { /* ... existing code ... */ };
    const handleSelectAll = (filterKey, allValues) => { /* ... existing code ... */ };
    const handleDateRange = (period) => { /* ... existing code ... */ };
    const handleCustomDateChange = (part, value) => { /* ... existing code ... */ };
    const applyChanges = () => { /* ... existing code ... */ };
    const clearFilters = () => { /* ... existing code ... */ };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md my-8 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* ... The full JSX for the FilterPanel ... */}
            </div>
        </div>
    );
};

const MultiSelectFilter = ({ title, options, selected, onSelect, onSelectAll, columns = "1" }) => {
    // ... The full JSX for the MultiSelectFilter ...
};

export default IncidentLogPage;