import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronDown, ChevronUp, History, X, Send, ShieldAlert, AlertTriangle, CheckCircle, FilePlus2, FileText, Download } from 'lucide-react';
import { format, parseISO, startOfDay, addDays } from 'date-fns';
import { formatDate } from '../utils/formatters';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import IncidentReportPDF from './IncidentReportPDF';
import { createRoot } from 'react-dom/client';

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
        if (currentDate.getDay() !== 0) { // Exclude Sundays
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

const UpdateModal = ({ incident, onClose }) => {
    const { updateIncident, addComment } = useContext(AppContext);
    const [commentText, setCommentText] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [editableDaysLost, setEditableDaysLost] = useState(0);
    const [isDaysLostDirty, setIsDaysLostDirty] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const isLTI = !['Near Miss', 'High Potential Incident'].includes(incident.type);
    
    const statusChangeTag = `Mark as ${incident.status === 'Open' ? 'Closed' : 'Re-opened'}`;

    useEffect(() => {
        const initialDays = incident.status === 'Open' ? calculateDaysLost(incident) : (incident.daysLost ?? 0);
        setEditableDaysLost(initialDays);
    }, [incident]);
    
    const showFeedback = (message) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(''), 2000);
    };

    const handleSaveDaysLost = () => {
        const value = parseInt(editableDaysLost, 10);
        if (!isNaN(value)) {
            updateIncident(incident.docId, { daysLost: value });
            setIsDaysLostDirty(false);
            showFeedback('Days Lost updated successfully!');
        }
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            addComment(incident.docId, commentText, selectedTags);
            setCommentText('');
            setSelectedTags([]);
            showFeedback('Comment added successfully!');
        }
    };
    
    const handleTagToggle = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [tag]);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Update Report: {incident.id}</h3>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    {feedbackMessage && (
                        <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-sm font-semibold p-2 rounded-md text-center">
                            {feedbackMessage}
                        </div>
                    )}
                    {isLTI && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Update Days Lost</h4>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                                <label className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Days Lost:</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    onFocus={(e) => e.target.select()}
                                    value={editableDaysLost} 
                                    onChange={(e) => { setEditableDaysLost(e.target.value); setIsDaysLostDirty(true); }}
                                    className="w-24 bg-white dark:bg-slate-700 p-1 rounded-md border border-yellow-300 dark:border-yellow-700 text-sm font-semibold"
                                    disabled={incident.status === 'Closed'}
                                />
                                {isDaysLostDirty && (
                                    <button onClick={handleSaveDaysLost} className="text-xs bg-green-200 hover:bg-green-300 dark:bg-green-800 text-green-800 dark:text-green-100 font-bold p-2 rounded-md">
                                        Save
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div>
                         <h4 className="font-semibold mb-2 text-sm">Add Comment</h4>
                         <form onSubmit={handleCommentSubmit} className="space-y-2">
                             <div className="bg-slate-100 dark:bg-slate-700 rounded-md border border-light-border dark:border-dark-border">
                                <div className="p-2 border-b border-light-border dark:border-dark-border">
                                     <div className="flex flex-wrap gap-2">
                                         {COMMENT_TAGS.map(tag => (
                                             <button type="button" key={tag} onClick={() => handleTagToggle(tag)} className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${selectedTags.includes(tag) ? 'bg-light-primary text-white' : 'bg-white dark:bg-slate-600'}`}>
                                                 {tag}
                                             </button>
                                         ))}
                                         <button type="button" onClick={() => handleTagToggle(statusChangeTag)} className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${selectedTags.includes(statusChangeTag) ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-600'}`}>
                                             {statusChangeTag}
                                         </button>
                                     </div>
                                </div>
                                <div className="flex gap-2 p-2">
                                     <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-grow bg-transparent p-0 focus:outline-none text-sm" />
                                     <button type="submit" className="bg-light-primary text-white font-semibold px-3 py-1 rounded-md text-sm"><Send size={16} /></button>
                                </div>
                             </div>
                         </form>
                    </div>
                </div>
                <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 font-semibold py-2 px-4 rounded-md text-sm">Close</button>
                </div>
            </div>
        </div>
    );
};

const IncidentCard = ({ incident }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const pdfRef = useRef();
    
    const isLTI = !['Near Miss', 'High Potential Incident'].includes(incident.type);

    const displayDaysLost = useMemo(() => {
        if (!isLTI) return 0;
        if (incident.status === 'Closed') return incident.daysLost ?? 0;
        return calculateDaysLost(incident);
    }, [incident, isLTI]);
    
    const handleViewPdf = async (includeHistory = false) => {
        const { createRoot } = await import('react-dom/client');
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        document.body.appendChild(tempDiv);
        
        const root = createRoot(tempDiv);
        root.render(<IncidentReportPDF incident={incident} includeHistory={includeHistory} />);

        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(tempDiv, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = canvas.width / canvas.height;
        const pdfHeight = pdfWidth / ratio;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Incident_Report_${incident.id}${includeHistory ? '_With_History' : ''}.pdf`);
        
        root.unmount();
        document.body.removeChild(tempDiv);
    };

    const mainDetailsOrder = ['type', 'mine', 'sectionName', 'date', 'time', 'location', 'reason'];
    const otherDetailsToExclude = ['id', 'docId', 'createdAt', 'history', 'comments', 'photos', 'victims', 'daysLost', 'isDemo', 'status', ...mainDetailsOrder];

    const mainDetails = mainDetailsOrder
        .filter(key => incident[key])
        .map(key => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            let value = incident[key];
            if (key === 'date' && value) value = formatDate(value);
            return { label, value };
        });

    const otherDetails = Object.entries(incident).filter(([key, value]) => 
        !otherDetailsToExclude.includes(key) && value
    ).map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        return { label, value };
    });

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
                    {incident.date ? formatDate(incident.date) : 'Invalid Date'}
                </div>
                <div className="flex justify-end">
                    <ChevronDown size={20} className={`transition-transform text-light-subtle-text dark:text-dark-subtle-text ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-light-border dark:border-dark-border space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                        <h4 className="font-semibold text-sm mb-1">Incident Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                           {mainDetails.map(({ label, value }) => (
                                <p key={label}><strong className="font-medium text-light-subtle-text">{label}:</strong> {value}</p>
                           ))}
                           <p className="col-span-2"><strong className="font-medium text-light-subtle-text">Description:</strong> {incident.description}</p>
                           {otherDetails.map(({ label, value }) => (
                                <p key={label} className="col-span-2"><strong className="font-medium text-light-subtle-text">{label}:</strong> {value}</p>
                           ))}
                        </div>
                    </div>
                    
                    {incident.victims && incident.victims.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm">Involved Person(s)</h4>
                            {incident.victims.map((victim, index) => (
                                <div key={index} className="text-sm">
                                    <p><strong className="font-medium text-light-subtle-text">Name:</strong> {victim.name}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
                                        <span><strong className="font-medium text-light-subtle-text">Category:</strong> {victim.category}</span>
                                        <span><strong className="font-medium text-light-subtle-text">Age:</strong> {victim.age || 'N/A'}</span>
                                        <span><strong className="font-medium text-light-subtle-text">Form B No:</strong> {victim.formB || 'N/A'}</span>
                                        {victim.category === 'Contractual' && (
                                            <>
                                                <span><strong className="font-medium text-light-subtle-text">Contractor:</strong> {victim.contractorName}</span>
                                                <span><strong className="font-medium text-light-subtle-text">PO No:</strong> {victim.poNumber}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Comments</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                             {(incident.comments || []).map((comment, index) => (
                                 <div key={index} className="bg-light-card dark:bg-dark-card p-2 rounded-md text-sm">
                                     <p>{comment.text}</p>
                                     <div className="flex justify-between items-center flex-wrap gap-x-2 mt-1">
                                        <div className="flex flex-wrap gap-1">
                                            {comment.tags && comment.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-light-primary/20 text-light-primary dark:bg-dark-primary/30 dark:text-dark-primary px-1.5 py-0.5 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                         <p className="text-xs text-slate-400 dark:text-slate-500 text-right flex-shrink-0">
                                            <span className="truncate">- {comment.user} on </span>
                                            <span>{format(parseISO(comment.timestamp), 'MMM d, h:mm a')}</span>
                                         </p>
                                     </div>
                                 </div>
                             ))}
                             {(incident.comments || []).length === 0 && <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">No comments yet.</p>}
                         </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setIsUpdateModalOpen(true)} className="text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">Update Report</button>
                        <button onClick={() => setShowHistory(true)} className="text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500">History</button>
                        <button onClick={() => handleViewPdf(false)} className="text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300"><FileText size={14} /> View PDF</button>
                    </div>
                </div>
            )}

            <div ref={pdfRef} className="fixed -left-[9999px] top-0"></div>
            
            {isUpdateModalOpen && <UpdateModal incident={incident} onClose={() => setIsUpdateModalOpen(false)} />}
            
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
                         <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                             <button onClick={() => handleViewPdf(true)} className="bg-light-primary text-white font-semibold py-2 px-4 rounded-md text-sm flex items-center gap-2"><Download size={16} /> Export with History</button>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default IncidentCard;