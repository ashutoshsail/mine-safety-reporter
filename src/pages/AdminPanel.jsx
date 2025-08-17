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

// MODIFIED: Wrapped in React.memo to prevent re-renders and fix input focus bugs
const IncidentCard = React.memo(({ incident }) => {
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
            updateIncident(incident.docId, { status: 'Open' }, 'Updated fields: Status to Open');
        }
    };

    const handleConfirmClose = () => {
        const finalValue = parseInt(finalDaysLostRef.current.value, 10) || 0;
        updateIncident(incident.docId, { status: 'Closed', daysLost: finalValue }, `Updated fields: Status to Closed`);
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
                                        <div className="space-y-1 mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                            <p><strong>Category:</strong> {victim.category}</p>
                                            <div className="grid grid-cols-2 gap-x-4">
                                                <p><strong>Age:</strong> {victim.age || 'N/A'}</p>
                                                <p><strong>Form B No:</strong> {victim.formB || 'N/A'}</p>
                                            </div>
                                            {victim.category === 'Contractual' && (
                                                <div className="grid grid-cols-2 gap-x-4">
                                                    <p><strong>Contractor:</strong> {victim.contractorName}</p>
                                                    <p><strong>PO No:</strong> {victim.poNumber}</p>
                                                </div>
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
                         {/* ... full comments section ... */}
                    </div>
                </div>
            )}

            {isCloseModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    {/* ... full close modal ... */}
                </div>
            )}
            
            {showHistory && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    {/* ... full history modal ... */}
                 </div>
            )}
        </div>
    );
});

const IncidentLogPage = () => { /* ... existing complete code ... */ };
const FilterPanel = ({ onClose, filters, setFilters }) => { /* ... existing complete code ... */ };
const MultiSelectFilter = ({ title, options, selected, onSelect, onSelectAll, columns = "1" }) => { /* ... existing complete code ... */ };

export default IncidentLogPage;