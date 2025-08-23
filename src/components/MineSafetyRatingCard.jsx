import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import { ConfigContext } from '../context/ConfigContext';
import { format, parseISO, differenceInDays, subMonths, isEqual, startOfMonth, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Award, AlertCircle, Info, Edit, Save, X } from 'lucide-react';

const INCIDENT_TYPE_ORDER = [
  'Near Miss',
  'High Potential Incident',
  'Non-Serious LTI (Non-Reportable)',
  'Non-Serious LTI (Reportable, >48h absence)',
  'Serious Bodily Injury',
  'Fatal Injury'
];

const getIncidentPoints = (type) => {
    switch (type) {
        case 'Near Miss': return 5;
        case 'High Potential Incident': return -5;
        case 'Non-Serious LTI (Non-Reportable)': return -5;
        case 'Non-Serious LTI (Reportable, >48h absence)': return -10;
        case 'Serious Bodily Injury': return -20;
        case 'Fatal Injury': return -100;
        default: return 0;
    }
};

const getClosurePoints = (type, closureDays) => {
    const benchmarks = {
        'Near Miss': { time: 7, bonus: 2, penalty: -5 },
        'High Potential Incident': { time: 14, bonus: 5, penalty: -7 },
        'Non-Serious LTI (Non-Reportable)': { time: 14, bonus: 5, penalty: -7 },
        'Non-Serious LTI (Reportable, >48h absence)': { time: 21, bonus: 10, penalty: -10 },
        'Serious Bodily Injury': { time: 30, bonus: 15, penalty: -15 },
        'Fatal Injury': { time: 45, bonus: 20, penalty: -20 },
    };
    const benchmark = benchmarks[type];
    if (!benchmark) return 0;
    return closureDays <= benchmark.time ? benchmark.bonus : benchmark.penalty;
};

// Detailed modal component - now a dedicated UI element
const MineDetailPanel = ({ mineData, onClose, manDays, user, handleManDaysChange, handleSaveManDays, editingManDays, setEditingManDays }) => {
    if (!mineData) return null;
    const currentMonthFormatted = format(new Date(), 'MMMM');

    const totalManDays = manDays[mineData.mine] || 0;
    const ltifr = totalManDays > 0 ? (mineData.totalDaysLost / totalManDays) * 1000000 : 0;
    
    return (
        <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto h-full">
            <div className="p-4 border-b dark:border-dark-border flex justify-between items-center">
                <h4 className="text-sm font-semibold">{mineData.mine}: Score for {currentMonthFormatted}</h4>
                <h4 className="text-lg font-bold">{mineData.rawScore.toFixed(0)}</h4>
                <button onClick={onClose}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-2">
                <ul className="text-sm space-y-1 pr-2 text-left w-full">
                    {Object.entries(mineData.breakdown).map(([type, score]) => (
                        <li key={type} className="flex justify-between items-center border-b border-light-border dark:border-dark-border last:border-b-0 py-1">
                            <span>{type}:</span>
                            <span className={`font-semibold ${score >= 0 ? 'text-green-500' : 'text-red-500'}`}>{score} pts</span>
                        </li>
                    ))}
                </ul>
                 <hr className="border-slate-200 dark:border-slate-700 my-2" />
                <div className="flex justify-between items-center text-sm font-semibold">
                    <span>Total Man-days Lost:</span>
                    <span>{mineData.totalDaysLost}</span>
                </div>
                 <hr className="border-slate-200 dark:border-slate-700 my-2" />
                <div className="flex justify-between items-center text-sm font-semibold">
                    <span>LTIFR:</span>
                    <span>{ltifr.toFixed(2)}</span>
                </div>
                 <hr className="border-slate-200 dark:border-slate-700 my-2" />
                <div className="flex justify-between items-center text-sm font-semibold">
                         <div className="flex items-center gap-2">
                             <span>Total Man-days:</span>
                             {user.isAdmin && (
                                 <button onClick={() => setEditingManDays(mineData.mine)} className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-400">
                                     <Edit size={14} />
                                 </button>
                             )}
                         </div>
                         {editingManDays === mineData.mine ? (
                             <div className="flex items-center gap-2">
                                 <input
                                     type="number"
                                     value={manDays[mineData.mine] || ''}
                                     onChange={(e) => handleManDaysChange(mineData.mine, e.target.value)}
                                     className="w-24 p-1 text-xs border rounded-md dark:bg-dark-card dark:border-slate-600"
                                 />
                                 <button onClick={() => handleSaveManDays(mineData.mine)} className="p-1 rounded-md bg-light-primary text-white">
                                     <Save size={14} />
                                 </button>
                             </div>
                         ) : (
                             <span>{totalManDays}</span>
                         )}
                     </div>
            </div>
        </div>
    );
};

const MineSafetyRatingCard = () => {
    const { incidents, currentDate, loading: appLoading, hoursWorked, user, updateManDays } = useContext(DataContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);

    const [selectedMineDetails, setSelectedMineDetails] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [manDays, setManDays] = useState({});
    const [editingManDays, setEditingManDays] = useState(null);
    const [visibleDate, setVisibleDate] = useState(subMonths(new Date(), 1));

    useEffect(() => {
        // Update local manDays state when hoursWorked from context changes
        if (hoursWorked) {
            setManDays(hoursWorked);
        }
    }, [hoursWorked]);

    const handleManDaysChange = (mine, value) => {
        setManDays(prev => ({ ...prev, [mine]: value }));
    };

    const handleSaveManDays = async (mine) => {
        const monthKey = format(currentDate, 'yyyy-MM');
        const value = parseInt(manDays[mine], 10);
        if (!isNaN(value) && user.isAdmin) {
            await updateManDays(mine, monthKey, value);
            setEditingManDays(null);
        }
    };
    
    const calculateScores = (date) => {
        if (!incidents || !MINES || MINES.length === 0 || !date) {
            return [];
        }

        const monthlyIncidents = incidents.filter(inc => {
            const incDate = parseISO(inc.date);
            return incDate.getMonth() === date.getMonth() && incDate.getFullYear() === date.getFullYear();
        });

        const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

        const incidentFreeDays = MINES.reduce((acc, mine) => {
            const mineIncidentDates = new Set(
                monthlyIncidents.filter(inc => inc.mine === mine).map(inc => inc.date)
            );
            acc[mine] = totalDays - mineIncidentDates.size;
            return acc;
        }, {});

        const rawScores = MINES.map(mine => {
            const mineIncidents = monthlyIncidents.filter(inc => inc.mine === mine);
            let score = incidentFreeDays[mine] * 2;
            let breakdown = {};
            let totalDaysLost = 0;
            INCIDENT_TYPE_ORDER.forEach(type => {
                breakdown[type] = 0;
            });
            breakdown['Incident-Free Days'] = incidentFreeDays[mine] * 2;
            breakdown['Closure Bonuses'] = 0;
            breakdown['Closure Penalties'] = 0;

            mineIncidents.forEach(inc => {
                if (breakdown[inc.type] === undefined) breakdown[inc.type] = 0;
                const incidentPoints = getIncidentPoints(inc.type);
                breakdown[inc.type] += incidentPoints;
                score += incidentPoints;
                totalDaysLost += (inc.daysLost || 0);

                if (inc.status === 'Closed' && inc.closureDate) {
                    const closureDays = differenceInDays(parseISO(inc.closureDate), parseISO(inc.date));
                    const closurePoints = getClosurePoints(inc.type, closureDays);
                    score += closurePoints;
                    if (closurePoints > 0) breakdown['Closure Bonuses'] += closurePoints;
                    else breakdown['Closure Penalties'] += closurePoints;
                }
            });

            return {
                mine,
                rawScore: score,
                incidentFreeDays: incidentFreeDays[mine],
                breakdown,
                totalDaysLost
            };
        });

        const highestScore = Math.max(...rawScores.map(m => m.rawScore), 1);
        const finalScores = rawScores.map(m => ({
            ...m,
            normalizedScore: highestScore > 0 ? (m.rawScore / highestScore) * 100 : 0
        })).sort((a, b) => b.normalizedScore - a.normalizedScore);

        return finalScores;
    }

    const mineSafetyScores = useMemo(() => {
        if (appLoading) return [];
        return calculateScores(visibleDate);
    }, [incidents, MINES, INCIDENT_TYPES, visibleDate, appLoading]);

    const prevMonthRankings = useMemo(() => {
        const prevMonthScores = calculateScores(subMonths(visibleDate, 1));
        return prevMonthScores.reduce((acc, score, index) => {
            acc[score.mine] = {
                rank: index + 1,
                score: score.normalizedScore
            };
            return acc;
        }, {});
    }, [incidents, MINES, INCIDENT_TYPES, visibleDate, appLoading]);

    const handleMineClick = (mineData) => {
        setSelectedMineDetails(mineData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedMineDetails(null);
        setIsModalOpen(false);
        setEditingManDays(null);
    };

    const handlePreviousMonth = () => {
        setVisibleDate(subMonths(visibleDate, 1));
    };

    const handleNextMonth = () => {
        setVisibleDate(addMonths(visibleDate, 1));
    };

    const isLatestMonth = isEqual(startOfMonth(visibleDate), startOfMonth(subMonths(new Date(), 1)));

    if (appLoading) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center justify-center h-64">
                <p className="text-lg font-semibold text-light-subtle-text animate-pulse">Loading safety ratings...</p>
            </div>
        );
    }

    if (!mineSafetyScores || mineSafetyScores.length === 0) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center justify-center h-64 flex-col text-center">
                <Info size={48} className="text-light-secondary mb-2" />
                <p className="font-semibold text-light-subtle-text">No safety ratings to display for this period.</p>
            </div>
        );
    }
    
    const isTopMine = (index) => index === 0;
    const isBottomMine = (index) => index === mineSafetyScores.length - 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <button onClick={handlePreviousMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronLeft size={24} />
                 </button>
                 <h2 className="text-base font-semibold">Mine Safety Performance Scoreboard for {format(visibleDate, 'MMMM yyyy')}</h2>
                 <button onClick={handleNextMonth} disabled={isLatestMonth} className={`p-2 rounded-full ${isLatestMonth ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                     <ChevronRight size={24} />
                 </button>
            </div>
            
            <div className="mt-6 flex flex-col lg:flex-row gap-6 h-[70vh]">
                <div className="flex-1 overflow-auto h-full">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card border-b-2 border-light-border dark:border-dark-border z-10">
                            <tr className="text-xs text-light-subtle-text dark:text-dark-subtle-text uppercase font-medium">
                                <th className="py-3 px-4">Rank</th>
                                <th className="py-3 px-4">Mine</th>
                                <th className="py-3 px-4">Emoji</th>
                                <th className="py-3 px-4 text-right">Safety Score</th>
                                <th className="py-3 px-4 text-right hidden lg:table-cell">Prev. Month</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mineSafetyScores.map((d, index) => (
                                <tr 
                                    key={d.mine} 
                                    onClick={() => handleMineClick(d)}
                                    className={`cursor-pointer transition-colors border-b border-light-border dark:border-dark-border
                                                ${isTopMine(index) ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50 font-bold text-green-700 dark:text-green-300' : ''}
                                                ${isBottomMine(index) ? 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 font-bold text-red-700 dark:text-red-300' : ''}
                                                ${!isTopMine(index) && !isBottomMine(index) ? 'hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
                                                ${selectedMineDetails?.mine === d.mine ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                                >
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4 font-medium">{d.mine}</td>
                                    <td className="py-3 px-4">
                                        {index === 0 && <span role="img" aria-label="trophy">🏆</span>}
                                        {index === 1 && <span role="img" aria-label="silver medal">🥈</span>}
                                        {index === 2 && <span role="img" aria-label="bronze medal">🥉</span>}
                                        {isBottomMine(index) && <span role="img" aria-label="thumbs down">👎</span>}
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold">{d.normalizedScore.toFixed(1)}</td>
                                    <td className="py-3 px-4 text-right hidden lg:table-cell">
                                        {prevMonthRankings[d.mine] ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs">{prevMonthRankings[d.mine].score.toFixed(1)}</span>
                                                <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">Rank: {prevMonthRankings[d.mine].rank}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className={`w-full lg:w-96 flex-shrink-0 transition-all duration-300 ${selectedMineDetails ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                    {selectedMineDetails && (
                        <MineDetailPanel 
                            mineData={selectedMineDetails} 
                            onClose={handleCloseModal} 
                            manDays={manDays} 
                            user={user} 
                            handleManDaysChange={handleManDaysChange} 
                            handleSaveManDays={handleSaveManDays} 
                            editingManDays={editingManDays} 
                            setEditingManDays={setEditingManDays} 
                        />
                    )}
                </div>
            </div>
            
            {isModalOpen && selectedMineDetails && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 lg:hidden">
                    <MineDetailPanel 
                        mineData={selectedMineDetails} 
                        onClose={handleCloseModal}
                        manDays={manDays} 
                        user={user} 
                        handleManDaysChange={handleManDaysChange} 
                        handleSaveManDays={handleSaveManDays} 
                        editingManDays={editingManDays} 
                        setEditingManDays={setEditingManDays} 
                    />
                </div>
            )}
        </div>
    );
};

export default MineSafetyRatingCard;
