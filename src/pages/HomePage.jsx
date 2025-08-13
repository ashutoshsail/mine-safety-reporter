import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext, ACCIDENT_TYPES } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { CheckCircle, AlertTriangle, XCircle, Send, Lightbulb, X } from 'lucide-react';
import IncidentReportPDF from '../components/IncidentReportPDF';

const safetyTips = [
    "Always wear your Personal Protective Equipment (PPE) in designated areas.",
    "Report any unsafe conditions or acts to your supervisor immediately.",
    "Maintain three points of contact when climbing or descending ladders.",
    "Never operate machinery you are not trained and authorized to use.",
    "Stay hydrated, especially during hot weather, to avoid heat stress.",
    "Be aware of your surroundings, especially moving vehicles and equipment.",
    "Use lockout/tagout procedures before servicing any equipment.",
    "Keep your work area clean and free of clutter to prevent slips, trips, and falls.",
    "Never stand under a suspended load.",
    "Always use the correct tool for the job.",
    "Inspect your tools and equipment before each use.",
    "Understand the emergency procedures and the location of emergency exits.",
    "Don't take shortcuts. Follow all safety procedures, every time.",
    "Lift with your legs, not your back, to prevent injuries.",
    "Report all injuries, no matter how minor they seem.",
    "Ensure all machine guards are in place and functional before operating.",
    "Communicate clearly with your coworkers, especially during team tasks.",
    "Avoid distractions like using your mobile phone in work areas.",
    "Take regular breaks to stay alert and focused.",
    "Know the location and proper use of fire extinguishers.",
    "Never work on live electrical equipment unless you are qualified.",
    "Check for proper ventilation when working in confined spaces.",
    "Always wear fall protection when working at heights.",
    "Familiarize yourself with the Material Safety Data Sheets (MSDS) for chemicals you use.",
    "Do not wear loose clothing or jewelry that could get caught in machinery.",
    "Practice good posture to avoid ergonomic injuries.",
    "Ensure proper lighting in your work area.",
    "Never assume equipment is off. Always verify.",
    "Participate actively in all safety meetings and training.",
    "Your safety is your responsibility. Look out for yourself and your team."
];

const HomePage = () => {
    const { incidents, submitNoAccident, user } = useContext(AppContext);
    const { MINES, homePageNotice } = useContext(ConfigContext);
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [submissionsForDate, setSubmissionsForDate] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedMine, setSelectedMine] = useState('');
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [activeTab, setActiveTab] = useState('no-submission');
    const [dailyTip] = useState(safetyTips[new Date().getDate() % safetyTips.length]);
    const [submissionModalData, setSubmissionModalData] = useState(null);
    const [accidentModalData, setAccidentModalData] = useState({ isOpen: false, mine: '', incidents: [] });
    const [previewIncident, setPreviewIncident] = useState(null);

    useEffect(() => {
        if (MINES && MINES.length > 0 && !selectedMine) {
            setSelectedMine(MINES[0]);
        }
    }, [MINES, selectedMine]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoadingSubmissions(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const docRef = doc(db, 'dailySubmissions', dateStr);
            const docSnap = await getDoc(docRef);
            setSubmissionsForDate(docSnap.exists() ? docSnap.data() : {});
            setLoadingSubmissions(false);
        };
        fetchSubmissions();
    }, [selectedDate, incidents]); // Re-fetch when incidents change to update status

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const minesWithAccident = useMemo(() => {
        const mines = new Set();
        if (incidents) {
            incidents.forEach(inc => {
                if (inc.date === selectedDateStr && ACCIDENT_TYPES.includes(inc.type)) {
                    mines.add(inc.mine);
                }
            });
        }
        return Array.from(mines);
    }, [incidents, selectedDateStr]);

    const noAccidentMines = MINES.filter(mine => submissionsForDate[mine]?.status === 'No Accident' && !minesWithAccident.includes(mine));
    const accidentMines = MINES.filter(mine => minesWithAccident.includes(mine));
    const noSubmissionMines = MINES.filter(mine => !submissionsForDate[mine] && !minesWithAccident.includes(mine));

    const handleNoAccidentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMine) {
            alert("Please select a mine.");
            return;
        }
        if (minesWithAccident.includes(selectedMine)) {
            alert(`Cannot submit 'No Accident' for ${selectedMine} as an accident has already been reported for this date.`);
            return;
        }
        await submitNoAccident(selectedMine, selectedDate);
        setSubmissionMessage(`'No Accident' reported for ${selectedMine} on ${format(selectedDate, 'PPP')}.`);
        setSubmissionsForDate(prev => ({...prev, [selectedMine]: {status: 'No Accident', submittedBy: user.name, submittedAt: new Date().toISOString()}}));
        setTimeout(() => setSubmissionMessage(''), 3000);
    };

    const handleAccidentMineClick = (mineName) => {
        const dailyIncidents = incidents.filter(inc => inc.mine === mineName && inc.date === selectedDateStr && ACCIDENT_TYPES.includes(inc.type));
        setAccidentModalData({ isOpen: true, mine: mineName, incidents: dailyIncidents });
    };

    const TabButton = ({ tabName, label, count, colorClasses }) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors rounded-full ${
                activeTab === tabName 
                ? `${colorClasses.activeBg} text-white` 
                : `border ${colorClasses.border} ${colorClasses.text} hover:bg-slate-100 dark:hover:bg-slate-700`
            }`}
        >
            <span>{label}</span>
            <span className={`flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                activeTab === tabName 
                ? 'bg-white/30 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-light-text dark:text-dark-text'
            }`}>
                {count}
            </span>
        </button>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold leading-tight">Home</h1>
            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text -mt-2">Hello, <span className="font-semibold">{user.name || 'User'}</span></p>
            
            {homePageNotice && homePageNotice.isActive && (
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md border-l-4 border-light-accent">
                    <h2 className="font-bold text-lg mb-1">{homePageNotice.title}</h2>
                    {homePageNotice.imageUrl && <img src={homePageNotice.imageUrl} alt={homePageNotice.title} className="w-full h-auto max-h-48 object-cover rounded-md my-2" />}
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">{homePageNotice.message}</p>
                </div>
            )}

            <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                <h2 className="text-base font-semibold mb-2">Daily Submission Status</h2>
                <div className="mb-3">
                    <label htmlFor="status-date" className="block text-xs font-semibold mb-1">Select Date</label>
                    <input
                        type="date"
                        id="status-date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 w-full"
                    />
                </div>
                <div className="border-b border-slate-200 dark:border-slate-600 mb-3 overflow-x-auto">
                    <div className="flex w-max gap-2 p-1">
                        <TabButton tabName="no-submission" label="No Submission" count={noSubmissionMines.length} colorClasses={{border: 'border-red-500', text: 'text-red-500', activeBg: 'bg-red-500'}} />
                        <TabButton tabName="accident" label="Accident" count={accidentMines.length} colorClasses={{border: 'border-yellow-500', text: 'text-yellow-500', activeBg: 'bg-yellow-500'}} />
                        <TabButton tabName="no-accident" label="No Accident" count={noAccidentMines.length} colorClasses={{border: 'border-green-500', text: 'text-green-500', activeBg: 'bg-green-500'}} />
                    </div>
                </div>
                {loadingSubmissions ? <p className="text-sm text-center p-4">Loading...</p> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                        {activeTab === 'no-submission' && noSubmissionMines.map(mine => <div key={mine} className="flex items-center gap-2 p-1.5 rounded text-sm"><XCircle size={14} className="text-red-500 flex-shrink-0" /><span>{mine}</span></div>)}
                        {activeTab === 'no-accident' && noAccidentMines.map(mine => <div key={mine} onClick={() => setSubmissionModalData(submissionsForDate[mine])} className="flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"><CheckCircle size={14} className="text-green-500 flex-shrink-0" /><span>{mine}</span></div>)}
                        {activeTab === 'accident' && accidentMines.map(mine => <div key={mine} onClick={() => handleAccidentMineClick(mine)} className="flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"><AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" /><span>{mine}</span></div>)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <h2 className="text-base font-semibold mb-1">Report 'No Accident'</h2>
                    <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text mb-3">Submit a "No Accident" report for the date selected above.</p>
                    <form onSubmit={handleNoAccidentSubmit} className="flex gap-2">
                        <select 
                            value={selectedMine}
                            onChange={(e) => setSelectedMine(e.target.value)}
                            className="flex-grow bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm"
                        >
                            {MINES.map(mine => <option key={mine} value={mine}>{mine}</option>)}
                        </select>
                        <button type="submit" className="flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white dark:text-slate-900 font-semibold px-3 py-2 rounded-md text-sm">
                            <Send size={14} />
                            <span>Submit</span>
                        </button>
                    </form>
                    {submissionMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-2">{submissionMessage}</p>}
                </div>

                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex items-start gap-3">
                    <div>
                        <h2 className="text-base font-semibold mb-0.5">Safety Tip of the Day</h2>
                        <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">{dailyTip}</p>
                    </div>
                    <Lightbulb className="text-yellow-400 flex-shrink-0" size={32} />
                </div>
            </div>

            {submissionModalData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSubmissionModalData(null)}>
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Submission Details</h3>
                            <button onClick={() => setSubmissionModalData(null)}><X size={20} /></button>
                        </div>
                        <div>
                            <p className="text-sm"><span className="font-semibold">Submitted By:</span> {submissionModalData.submittedBy}</p>
                            <p className="text-sm"><span className="font-semibold">Date & Time:</span> {format(parseISO(submissionModalData.submittedAt), 'PPP p')}</p>
                        </div>
                    </div>
                </div>
            )}

            {accidentModalData.isOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAccidentModalData({isOpen: false, mine: '', incidents: []})}>
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Accidents at {accidentModalData.mine}</h3>
                            <button onClick={() => setAccidentModalData({isOpen: false, mine: '', incidents: []})}><X size={20} /></button>
                        </div>
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                            {accidentModalData.incidents.map(inc => (
                                <li key={inc.id} onClick={() => setPreviewIncident(inc)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                                    <p className="font-semibold text-sm">{inc.type}</p>
                                    <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">{inc.id}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {previewIncident && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setPreviewIncident(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 text-right">
                           <button onClick={() => setPreviewIncident(null)} className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
                        </div>
                        <IncidentReportPDF incident={previewIncident} isPreview={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
