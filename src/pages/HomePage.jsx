import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle, Send } from 'lucide-react';

const safetyTips = [
    "Always wear your PPE in designated areas.",
    "Report any unsafe conditions immediately.",
    "Maintain 3 points of contact when climbing ladders.",
    "Never operate machinery you are not trained for.",
    "Stay hydrated, especially during hot weather.",
    "Be aware of your surroundings and moving equipment."
];

const HomePage = () => {
    const { incidents, submitNoAccident, MINES, currentDate } = useContext(AppContext);
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [submissionsForDate, setSubmissionsForDate] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedMine, setSelectedMine] = useState(MINES[0]);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [activeTab, setActiveTab] = useState('no-submission');

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

    const handleNoAccidentSubmit = (e) => {
        e.preventDefault();
        submitNoAccident(selectedMine, selectedDate);
        setSubmissionMessage(`'No Accident' reported for ${selectedMine}.`);
        // Manually update local state for immediate feedback
        setSubmissionsForDate(prev => ({...prev, [selectedMine]: {status: 'No Accident'}}));
        setTimeout(() => setSubmissionMessage(''), 3000);
    };

    const TabButton = ({ tabName, label, count, color }) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tabName ? `border-b-2 ${color} ${color.replace('border', 'text')}` : 'text-light-subtle-text dark:text-dark-subtle-text'}`}
        >
            <span>{label}</span>
            <span className={`flex items-center justify-center w-5 h-5 text-xs rounded-full ${activeTab === tabName ? `${color.replace('border', 'bg')}/20` : 'bg-slate-200 dark:bg-slate-700'}`}>
                {count}
            </span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Daily Submission Status</h2>
                <div className="mb-4">
                    <label htmlFor="status-date" className="block text-sm font-semibold mb-1">Select Date</label>
                    <input
                        type="date"
                        id="status-date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
                    />
                </div>
                <div className="flex border-b border-slate-200 dark:border-slate-600 mb-4">
                    <TabButton tabName="no-submission" label="No Submission" count={noSubmissionMines.length} color="border-red-500" />
                    <TabButton tabName="no-accident" label="No Accident" count={noAccidentMines.length} color="border-green-500" />
                    <TabButton tabName="accident" label="Accident" count={accidentMines.length} color="border-yellow-500" />
                </div>
                {loadingSubmissions ? <p>Loading...</p> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeTab === 'no-submission' && noSubmissionMines.map(mine => <div key={mine} className="flex items-center gap-2 p-2 rounded"><XCircle size={16} className="text-red-500" /><span>{mine}</span></div>)}
                        {activeTab === 'no-accident' && noAccidentMines.map(mine => <div key={mine} className="flex items-center gap-2 p-2 rounded"><CheckCircle size={16} className="text-green-500" /><span>{mine}</span></div>)}
                        {activeTab === 'accident' && accidentMines.map(mine => <div key={mine} className="flex items-center gap-2 p-2 rounded"><AlertTriangle size={16} className="text-yellow-500" /><span>{mine}</span></div>)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Report 'No Accident'</h2>
                    <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mb-4">Select a mine to submit a "No Accident" report for the date selected above.</p>
                    <form onSubmit={handleNoAccidentSubmit} className="flex gap-4">
                        <select 
                            value={selectedMine}
                            onChange={(e) => setSelectedMine(e.target.value)}
                            className="flex-grow bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-2"
                        >
                            {MINES.map(mine => <option key={mine} value={mine}>{mine}</option>)}
                        </select>
                        <button type="submit" className="flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md">
                            <Send size={16} />
                            <span>Submit</span>
                        </button>
                    </form>
                    {submissionMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-2">{submissionMessage}</p>}
                </div>

                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md flex items-start gap-4">
                    <ShieldCheck className="text-light-secondary dark:text-dark-secondary mt-1 flex-shrink-0" size={24} />
                    <div>
                        <h2 className="text-xl font-semibold mb-1">Safety Tip</h2>
                        <p className="text-light-subtle-text dark:text-dark-subtle-text">{safetyTips[Math.floor(Math.random() * safetyTips.length)]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
