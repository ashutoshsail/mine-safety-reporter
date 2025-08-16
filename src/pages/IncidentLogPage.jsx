import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { ChevronDown, ChevronUp, Clock, Calendar, History, X, Send, ArrowDownUp, Filter, Paperclip, Upload, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, parseISO, startOfDay, addDays, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

const calculateDaysLost = (incident) => {
    const victimsCount = incident.victims?.length || 0;
    if (victimsCount === 0) return 0;
    const startDate = startOfDay(parseISO(incident.date));
    let endDate;
    if (incident.status === 'Closed') {
        const closeEvent = (incident.history || []).find(h => h.action.includes('Status to Closed'));
        endDate = closeEvent ? startOfDay(parseISO(closeEvent.timestamp)) : startOfDay(new Date());
    } else {
        endDate = startOfDay(new Date());
    }
    if (endDate < startDate) return 0;
    let workingDays = 0;
    let currentDate = startDate;
    while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0) { // Exclude Sundays (day 0)
            workingDays++;
        }
        currentDate = addDays(currentDate, 1);
    }
    return victimsCount * workingDays;
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
    const [editableDaysLost, setEditableDaysLost] = useState(0);
    const [isDaysLostDirty, setIsDaysLostDirty] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [photosToUpload, setPhotosToUpload] = useState([]);
    const fileInputRef = useRef(null);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const finalDaysLostRef = useRef(0);
    
    const isLTI = !['Near Miss', 'High Potential Incident'].includes(incident.type);

    const displayDaysLost = useMemo(() => {
        if (!isLTI) return 0;
        if (incident.status === 'Closed') return incident.daysLost ?? 0;
        return calculateDaysLost(incident);
    }, [incident, isLTI]);

    useEffect(() => {
        setEditableDaysLost(displayDaysLost);
        if (finalDaysLostRef.current) {
            finalDaysLostRef.current.value = displayDaysLost;
        }
        setIsDaysLostDirty(false);
    }, [isExpanded, displayDaysLost]);

    const handleDaysLostChange = (e) => {
        setEditableDaysLost(e.target.value);
        setIsDaysLostDirty(true);
    };

    const handleSaveDaysLost = () => {
        const value = parseInt(editableDaysLost, 10);
        if (!isNaN(value)) {
            updateIncident(incident.docId, { daysLost: value });
            setIsDaysLostDirty(false);
        }
    };

    const handleStatusToggle = () => {
        if (incident.status === 'Open') {
            if ((incident.comments || []).length === 0) {
                alert("Cannot close incident. Please add a closing comment first.");
                return;
            }
            if (isDaysLostDirty) {
                alert("Please save your changes to 'Days Lost' before closing.");
                return;
            }
            setIsCloseModalOpen(true);
        } else {
            if (!window.confirm(`Are you sure you want to re-open this incident?`)) return;
            updateIncident(incident.docId, { status: 'Open' });
        }
    };

    const handleConfirmClose = () => {
        const finalValue = parseInt(finalDaysLostRef.current.value, 10) || 0;
        const action = `Updated fields: Status to Closed`;
        updateIncident(incident.docId, { status: 'Closed', daysLost: finalValue }, action);
        setIsCloseModalOpen(false);
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [tag]);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            addComment(incident.docId, commentText, selectedTags);
            setCommentText('');
            setSelectedTags([]);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        let newPhotos = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                newPhotos.push({ name: file.name, dataUrl: reader.result, uploadedAt: new Date().toISOString() });
                if (newPhotos.length === files.length) {
                    setPhotosToUpload(prev => [...prev, ...newPhotos]);
                }
            };
            reader.readAsDataURL(file);
        });
    };
    
    const handleUploadPhotos = async () => {
        if (photosToUpload.length === 0 || !window.confirm(`Are you sure you want to upload ${photosToUpload.length} photo(s)?`)) return;
        const existingPhotos = incident.photos || [];
        const updatedPhotos = [...existingPhotos, ...photosToUpload];
        await updateIncident(incident.docId, { photos: updatedPhotos });
        setPhotosToUpload([]);
    };

    const removePhotoToUpload = (index) => {
        setPhotosToUpload(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={`bg-light-card dark:bg-dark-card rounded-lg shadow-md border-l-4 ${mineColors[incident.mine] || 'border-slate-500'}`}>
            <div 
                className="p-4 grid gap-4 items-center grid-cols-[1fr,auto,auto,auto] md:grid-cols-[1fr,8rem,auto,auto,auto] lg:grid-cols-[minmax(0,1fr)_18rem_10rem_6rem_8rem_auto] cursor-pointer" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="truncate">
                    <p className="font-semibold text-light-text dark:text-dark-text truncate">{incident.type}</p>
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text truncate">{incident.id}</p>
                </div>

                <div className="hidden lg:block truncate text-sm text-light-subtle-text dark:text-dark-subtle-text">
                    {incident.description}
                </div>
                
                <div className="hidden md:flex justify-center">
                    {!isExpanded && displayDaysLost > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                            <ShieldAlert size={14} />
                            <span className="text-xs font-bold">{displayDaysLost} Days</span>
                        </div>
                    )}
                </div>

                <div className="w-20 flex justify-center">
                    <span className={`text-xs px-2 py-1 rounded-full bg-light-status-${incident.status === 'Open' ? 'danger' : 'success'}/10 text-light-status-${incident.status === 'Open' ? 'danger' : 'success'}`}>{incident.status}</span>
                </div>

                <div className="hidden sm:block text-right text-sm text-light-subtle-text dark:text-dark-subtle-text">
                    {format(parseISO(incident.date), 'PPP')}
                </div>

                <div className="flex justify-end">
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
                        <div className="flex items-center gap-2"><Calendar size={14} /> {format(parseISO(incident.date), 'PPP')}</div>
                        <div className="flex items-center gap-2"><Clock size={14} /> {incident.time}</div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 text-sm">Description</h4>
                        <p className="text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded-md">{incident.description}</p>
                    </div>
                    
                    {incident.victims && incident.victims.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-1 text-sm">Involved Person(s)</h4>
                            <div className="space-y-2">
                                {incident.victims.map((victim, index) => (
                                    <div key={index} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm">
                                        <p className="font-semibold">{victim.name}</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                            <p><strong>Age:</strong> {victim.age || 'N/A'}</p>
                                            <p><strong>Category:</strong> {victim.category}</p>
                                            <p><strong>Form B No:</strong> {victim.formB || 'N/A'}</p>
                                            {victim.category === 'Contractual' && (
                                                <>
                                                    <p><strong>Contractor:</strong> {victim.contractorName}</p>
                                                    <p><strong>PO No:</strong> {victim.poNumber}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                    value={editableDaysLost} 
                                    onChange={handleDaysLostChange}
                                    className="w-20 bg-white dark:bg-slate-700 p-1 rounded-md border border-yellow-300 dark:border-yellow-700 text-sm font-semibold"
                                    disabled={incident.status === 'Closed'}
                                />
                                {isDaysLostDirty && (
                                    <button onClick={handleSaveDaysLost} className="text-xs bg-green-200 hover:bg-green-300 dark:bg-green-800 text-green-800 dark:text-green-100 font-bold p-1 rounded-full">
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                     <div>
                         <h4 className="font-semibold mb-1 text-sm">Comments</h4>
                         <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-2">
                             {(incident.comments || []).map((comment, index) => (
                                 <div key={index} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-sm">
                                     <p>{comment.text}</p>
                                     <div className="flex justify-between items-center mt-1">
                                         <div className="flex flex-wrap gap-1">
                                             {comment.tags && comment.tags.map(tag => (
                                                 <span key={tag} className="text-xs bg-light-primary/20 text-light-primary dark:bg-dark-primary/30 dark:text-dark-primary px-1.5 py-0.5 rounded-full">{tag}</span>
                                             ))}
                                         </div>
                                         <p className="text-xs text-slate-400 dark:text-slate-500">- {comment.user} on {format(parseISO(comment.timestamp), 'MMM d, h:mm a')}</p>
                                     </div>
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
                                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedTags.includes(tag) ? 'bg-light-primary text-white border-light-primary' : 'bg-slate-200 dark:bg-slate-700 border-transparent'}`}
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
                                defaultValue={editableDaysLost}
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
    
    const clearFilters = () => {
        const initial = { status: [], type: [], mine: [], dateRange: { start: null, end: null }, period: 'All Time' };
        setTempFilters(initial);
    };

    const periodFilters = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Last Year'];
    const hasActiveFilters = Object.values(tempFilters).some(f => Array.isArray(f) ? f.length > 0 : f.start);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md my-8 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Filter</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm">Date Range</h3>
                            <button onClick={() => setShowAllPeriods(prev => !prev)} className="text-xs font-semibold text-light-primary">
                                {showAllPeriods ? '<< Less' : 'More >>'}
                            </button>
                        </div>
                        {!showAllPeriods ? (
                            <div className="overflow-x-auto pb-2">
                                <div className="flex items-center gap-2 w-max">
                                    {periodFilters.slice(0, 4).map(p => (
                                        <button key={p} onClick={() => handleDateRange(p)} className={`text-xs px-2 py-1 rounded-full ${tempFilters.period === p ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {periodFilters.map(p => (
                                        <button key={p} onClick={() => handleDateRange(p)} className={`text-xs px-2 py-1 rounded-full ${tempFilters.period === p ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{p}</button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="date" placeholder="From" value={tempFilters.dateRange.start ? format(tempFilters.dateRange.start, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('start', e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                    <input type="date" placeholder="To" value={tempFilters.dateRange.end ? format(tempFilters.dateRange.end, 'yyyy-MM-dd') : ''} onChange={e => handleCustomDateChange('end', e.target.value)} className="w-full p-2 text-sm rounded-md border dark:bg-dark-card dark:border-dark-border" />
                                </div>
                            </>
                        )}
                    </div>
                    <MultiSelectFilter title="Status" options={['Open', 'Closed']} selected={tempFilters.status} onSelect={v => handleMultiSelect('status', v)} columns="2" />
                    <MultiSelectFilter title="Mine" options={MINES} selected={tempFilters.mine} onSelect={v => handleMultiSelect('mine', v)} onSelectAll={() => handleSelectAll('mine', MINES)} columns="2 sm:grid-cols-2" />
                    <MultiSelectFilter title="Incident Type" options={INCIDENT_TYPES} selected={tempFilters.type} onSelect={v => handleMultiSelect('type', v)} onSelectAll={() => handleSelectAll('type', INCIDENT_TYPES)} />
                </div>
                <div className="p-4 border-t mt-auto flex justify-between">
                    <button onClick={clearFilters} disabled={!hasActiveFilters} className="text-sm font-semibold text-slate-500 disabled:opacity-50">Clear</button>
                    <button onClick={applyChanges} className="text-sm font-semibold bg-light-primary text-white px-4 py-2 rounded-md">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

const MultiSelectFilter = ({ title, options, selected, onSelect, onSelectAll, columns = "1" }) => {
    const areAllSelected = options && options.length > 0 && selected.length === options.length;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">{title}</h3>
                {onSelectAll && <button onClick={onSelectAll} className="text-xs font-semibold text-light-primary">{areAllSelected ? 'Clear All' : 'Select All'}</button>}
            </div>
            <div className={`max-h-32 overflow-y-auto space-y-1 p-2 border rounded-md dark:border-dark-border grid grid-cols-${columns}`}>
                {options && options.map(option => (
                    <label key={option} className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${selected.includes(option) ? 'bg-light-primary/10' : ''}`}>
                        <input type="checkbox" checked={selected.includes(option)} onChange={() => onSelect(option)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary" />
                        <span className="text-sm">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default IncidentLogPage;