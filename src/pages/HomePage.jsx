import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { differenceInDays, format } from 'date-fns';
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
    const { incidents, dailySubmissions, submitNoAccident, MINES, currentDate } = useContext(AppContext);
    const [selectedMine, setSelectedMine] = useState(MINES[0]);
    const [submissionMessage, setSubmissionMessage] = useState('');

    // Calculate Days Since Last LTI
    const lastLTI = incidents
        .filter(inc => inc.type === 'Lost Time Injury (LTI)')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const daysSinceLTI = lastLTI ? differenceInDays(currentDate, new Date(lastLTI.date)) : 'N/A';

    // Categorize mines for daily submission status
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const minesWithAccidentToday = new Set(
        incidents
            .filter(inc => inc.date === todayStr && inc.type === 'Lost Time Injury (LTI)')
            .map(inc => inc.mine)
    );

    const noAccidentMines = MINES.filter(mine => dailySubmissions[mine]?.status === 'No Accident' && !minesWithAccidentToday.has(mine));
    const accidentMines = MINES.filter(mine => minesWithAccidentToday.has(mine));
    const noSubmissionMines = MINES.filter(mine => !dailySubmissions[mine] && !minesWithAccidentToday.has(mine));
    
    const [activeTab, setActiveTab] = useState('no-accident');

    const handleNoAccidentSubmit = (e) => {
        e.preventDefault();
        submitNoAccident(selectedMine);
        setSubmissionMessage(`'No Accident' reported for ${selectedMine}.`);
        setTimeout(() => setSubmissionMessage(''), 3000);
    };

    const tabContent = {
        'no-accident': { mines: noAccidentMines, icon: CheckCircle, color: 'text-green-500' },
        'accident': { mines: accidentMines, icon: AlertTriangle, color: 'text-yellow-500' },
        'no-submission': { mines: noSubmissionMines, icon: XCircle, color: 'text-red-500' }
    };

    const CurrentTabIcon = tabContent[activeTab].icon;


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text">Home</h1>
            
            {/* Days Since Last LTI Card */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center justify-center text-center bg-gradient-to-r from-light-primary to-light-secondary dark:from-dark-primary dark:to-dark-secondary text-white">
                <div>
                    <p className="text-lg font-normal">Days Since Last Lost Time Injury</p>
                    <p className="text-7xl font-bold">{daysSinceLTI}</p>
                    <p className="text-sm opacity-80">Across All Mines</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Submission Status Card */}
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Daily Submission Status ({format(currentDate, 'PPP')})</h2>
                    <div className="flex border-b border-slate-200 dark:border-slate-600 mb-4">
                        <button onClick={() => setActiveTab('no-accident')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'no-accident' ? 'border-b-2 border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>No Accident</button>
                        <button onClick={() => setActiveTab('accident')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'accident' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>Accident</button>
                        <button onClick={() => setActiveTab('no-submission')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'no-submission' ? 'border-b-2 border-red-500 text-red-500' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>No Submission</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {tabContent[activeTab].mines.length > 0 ? (
                            tabContent[activeTab].mines.map(mine => (
                                <div key={mine} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                    <CurrentTabIcon className={`${tabContent[activeTab].color}`} size={16} />
                                    <span className="text-sm">{mine}</span>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-light-subtle-text dark:text-dark-subtle-text text-sm">No mines in this category for today.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Report No Accident Form */}
                    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Report No Accident</h2>
                        <form onSubmit={handleNoAccidentSubmit} className="flex flex-col sm:flex-row gap-4">
                            <select 
                                value={selectedMine}
                                onChange={(e) => setSelectedMine(e.target.value)}
                                className="flex-grow bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary outline-none"
                            >
                                {MINES.map(mine => <option key={mine} value={mine}>{mine}</option>)}
                            </select>
                            <button type="submit" className="flex items-center justify-center gap-2 bg-light-primary hover:bg-light-primary/90 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white dark:text-slate-900 font-semibold px-4 py-2 rounded-md transition-colors">
                                <Send size={16} />
                                <span>Submit</span>
                            </button>
                        </form>
                        {submissionMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-2">{submissionMessage}</p>}
                    </div>

                    {/* Safety Tip Card */}
                    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md flex items-start gap-4">
                        <ShieldCheck className="text-light-secondary dark:text-dark-secondary mt-1" size={24} />
                        <div>
                            <h2 className="text-xl font-semibold mb-1">Safety Tip</h2>
                            <p className="text-light-subtle-text dark:text-dark-subtle-text">{safetyTips[Math.floor(Math.random() * safetyTips.length)]}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
