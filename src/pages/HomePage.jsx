import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { CheckCircle, AlertTriangle, XCircle, Send, Lightbulb, X } from 'lucide-react';

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
    const { incidents, submitNoAccident, MINES, currentDate, user } = useContext(AppContext);
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [submissionsForDate, setSubmissionsForDate] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedMine, setSelectedMine] = useState(MINES[0]);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [activeTab, setActiveTab] = useState('no-submission');
    const [dailyTip] = useState(safetyTips[new Date().getDate() % safetyTips.length]);
    const [modalData, setModalData] = useState(null); // For the pop-up

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
    }, [selectedDate]);

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const minesWithAccident = new Set(
        incidents
            .filter(inc => inc.date === selectedDateStr && inc.type === 'Lost Time Injury (LTI)')
            .map(inc => inc.mine)
    );

    const noAccidentMines = MINES.filter(mine => submissionsForDate[mine]?.status === 'No Accident' && !minesWithAccident.has(mine));
    const accidentMines = MINES.filter(mine => minesWithAccident.has(mine));
    const noSubmissionMines = MINES.filter(mine => !submissionsForDate[mine] && !minesWithAccident.has(mine));

    const handleNoAccidentSubmit = async (e) => {
        e.preventDefault();
        await submitNoAccident(selectedMine, selectedDate);
        setSubmissionMessage(`'No Accident' reported for ${selectedMine} on ${format(selectedDate, 'PPP')}.`);
        setSubmissionsForDate(prev => ({...prev, [selectedMine]: {status: 'No Accident', submittedBy: user.name, submittedAt: new Date().toISOString()}}));
        setTimeout(() => setSubmissionMessage(''), 3000);
    };

    const TabButton = ({ tabName, label, count, color }) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tabName ? `border-b-2 ${color} ${color.replace('border', 'text')}` : 'text-light-subtle-text dark:text-dark-subtle-text'}`}
        >
            <span>{label}</span>
            <span className={`flex items-center justify-center w-5 h-5 text-xs rounded-full text-light-text dark:text-dark-text ${activeTab === tabName ? `${color.replace('border', 'bg')}/30` : 'bg-slate-200 dark:bg-slate-700'}`}>
                {count}
            </span>
        </button>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold leading-tight">Home</h1>
            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text -mt-2">Hello, <span className="font-semibold">{user.name || 'User'}</span></p>
            
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
                    <div className="flex w-max">
                        <TabButton tabName="no-submission" label="No Submission" count={noSubmissionMines.length} color="border-red-500" />
                        <TabButton tabName="no-accident" label="No Accident" count={noAccidentMines.length} color="border-green-500" />
                        <TabButton tabName="accident" label="Accident" count={accidentMines.length} color="border-yellow-500" />
                    </div>
                </div>
                {loadingSubmissions ? <p className="text-sm text-center p-4">Loading...</p> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                        {activeTab === 'no-submission' && noSubmissionMines.map(mine => <div key={mine} className="flex items-center gap-2 p-1.5 rounded text-sm"><XCircle size={14} className="text-red-500 flex-shrink-0" /><span>{mine}</span></div>)}
                        {activeTab === 'no-accident' && noAccidentMines.map(mine => <div key={mine} onClick={() => setModalData(submissionsForDate[mine])} className="flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"><CheckCircle size={14} className="text-green-500 flex-shrink-0" /><span>{mine}</span></div>)}
                        {activeTab === 'accident' && accidentMines.map(mine => <div key={mine} className="flex items-center gap-2 p-1.5 rounded text-sm"><AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" /><span>{mine}</span></div>)}
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

            {/* Submission Details Modal */}
            {modalData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalData(null)}>
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Submission Details</h3>
                            <button onClick={() => setModalData(null)}><X size={20} /></button>
                        </div>
                        <div>
                            <p className="text-sm"><span className="font-semibold">Submitted By:</span> {modalData.submittedBy}</p>
                            <p className="text-sm"><span className="font-semibold">Date & Time:</span> {format(parseISO(modalData.submittedAt), 'PPP p')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
