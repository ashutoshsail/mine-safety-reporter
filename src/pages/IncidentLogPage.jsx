import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronDown, ChevronUp, Clock, Calendar, Paperclip, Send, Download, History, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const mineColors = {
    "DMM": "border-blue-500", "JMM": "border-green-500", "RMM": "border-red-500", 
    "DIOM": "border-yellow-500", "Mahamaya": "border-purple-500", "Kalwar": "border-pink-500",
    "Rowghat": "border-indigo-500", "Nandini": "border-teal-500", "Hirri": "border-orange-500", 
    "Koteshwar": "border-cyan-500"
};

const IncidentCard = ({ incident }) => {
    const { updateIncident, addComment } = useContext(AppContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [mandays, setMandays] = useState(incident.mandaysLost || '');
    const [showHistory, setShowHistory] = useState(false);

    const handleStatusToggle = () => {
        const newStatus = incident.status === 'Open' ? 'Closed' : 'Open';
        updateIncident(incident.id, { status: newStatus });
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            addComment(incident.id, commentText);
            setCommentText('');
        }
    };

    const handleMandaysChange = (e) => {
        setMandays(e.target.value);
    };

    const handleMandaysBlur = () => {
        const value = parseInt(mandays, 10);
        if (!isNaN(value) && value !== incident.mandaysLost) {
            updateIncident(incident.id, { mandaysLost: value });
        }
    };
    
    // Dummy function for now
    const handleDownloadPDF = () => alert(`Downloading PDF for ${incident.id}`);
    const handleAttachPhoto = () => alert(`Attaching photo to ${incident.id}`);

    return (
        <div className={`bg-light-card dark:bg-dark-card rounded-lg shadow-md border-l-4 ${mineColors[incident.mine] || 'border-slate-500'} overflow-hidden`}>
            {/* Collapsed View */}
            <div className="p-4 flex items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex-grow">
                    <p className="font-semibold">{incident.type}</p>
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">{incident.id}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-sm px-2 py-1 rounded-full ${incident.status === 'Open' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>{incident.status}</span>
                    <span className="text-sm hidden sm:block">{format(new Date(incident.date), 'PPP')}</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <p><strong>Reporter:</strong> {incident.reporterName}</p>
                        <p><strong>Mine:</strong> {incident.mine}</p>
                        <p><strong>Section:</strong> {incident.sectionName}</p>
                        <p><strong>Location:</strong> {incident.location}</p>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} /> {format(new Date(incident.date), 'PPP')}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} /> {incident.time}
                        </div>
                    </div>
                    <div className="mb-4">
                        <h4 className="font-semibold mb-1">Description</h4>
                        <p className="text-light-subtle-text dark:text-dark-subtle-text text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded-md">{incident.description}</p>
                    </div>
                    {incident.victimDetails && (
                        <div className="mb-4">
                            <h4 className="font-semibold mb-1">Victim Details</h4>
                            <p className="text-light-subtle-text dark:text-dark-subtle-text text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded-md">{incident.victimDetails}</p>
                        </div>
                    )}

                    {/* Actions & LTI */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <button onClick={handleStatusToggle} className="text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80 text-blue-800 dark:text-blue-300 font-semibold px-3 py-1 rounded-md">
                            Mark as {incident.status === 'Open' ? 'Closed' : 'Open'}
                        </button>
                        <button onClick={handleAttachPhoto} className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-semibold px-3 py-1 rounded-md flex items-center gap-1">
                            <Paperclip size={14} /> Attach Photo
                        </button>
                        <button onClick={handleDownloadPDF} className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-semibold px-3 py-1 rounded-md flex items-center gap-1">
                            <Download size={14} /> Download PDF
                        </button>
                        <button onClick={() => setShowHistory(true)} className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 font-semibold px-3 py-1 rounded-md flex items-center gap-1">
                            <History size={14} /> History
                        </button>
                        {incident.type === 'Lost Time Injury (LTI)' && (
                            <div className="flex items-center gap-2">
                                <label htmlFor={`mandays-${incident.id}`} className="text-sm font-semibold">Mandays Lost:</label>
                                <input 
                                    id={`mandays-${incident.id}`}
                                    type="number"
                                    value={mandays}
                                    onChange={handleMandaysChange}
                                    onBlur={handleMandaysBlur}
                                    className="w-20 bg-slate-100 dark:bg-slate-700 p-1 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h4 className="font-semibold mb-2">Comments</h4>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 mb-3">
                            {incident.comments.map((comment, index) => (
                                <div key={index} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-sm">
                                    <p className="text-light-subtle-text dark:text-dark-subtle-text">{comment.text}</p>
                                    <p className="text-xs text-right text-slate-400 dark:text-slate-500 mt-1">
                                        - {comment.user} on {format(parseISO(comment.timestamp), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            ))}
                            {incident.comments.length === 0 && <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">No comments yet.</p>}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-grow bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                            />
                            <button type="submit" className="bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white dark:text-slate-900 p-2 rounded-md">
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl max-w-lg w-full">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Incident History</h3>
                            <button onClick={() => setShowHistory(false)}><X size={24} /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <ul className="space-y-3">
                                {incident.history.map((item, index) => (
                                    <li key={index} className="text-sm border-l-2 pl-3 border-slate-300 dark:border-slate-600">
                                        <p className="font-semibold">{item.action}</p>
                                        <p className="text-light-subtle-text dark:text-dark-subtle-text text-xs">by {item.user} on {format(parseISO(item.timestamp), 'PPP p')}</p>
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

    return (
        <div>
            <h1 className="text-3xl font-semibold mb-6 text-light-text dark:text-dark-text">Incident Log</h1>
            <div className="space-y-4">
                {incidents.map(incident => (
                    <IncidentCard key={incident.id} incident={incident} />
                ))}
            </div>
        </div>
    );
};

export default IncidentLogPage;
