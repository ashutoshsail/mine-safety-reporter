import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, X as XIcon, Smile, Info, TrendingUp, TrendingDown, ChevronDown, Check } from 'lucide-react';
import { subMonths, startOfMonth, format, eachMonthOfInterval, subDays } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

// --- Configuration and Setup ---
const fullConfig = resolveConfig(tailwindConfig);
const chartColors = fullConfig.theme.chart; 

// --- Reusable UI Components ---
const KpiCard = ({ title, value, change, changeType }) => (
    <div className="bg-light-background dark:bg-dark-background p-4 rounded-lg shadow-md flex-1 text-center flex-shrink-0 w-2/3 sm:w-1/3 md:w-auto">
        <h4 className="text-sm font-medium text-light-subtle-text dark:text-dark-subtle-text">{title}</h4>
        <p className="text-3xl font-bold my-1">{value}</p>
        <div className={`flex items-center justify-center text-sm ${changeType === 'good' ? 'text-green-500' : 'text-red-500'}`}>
            {changeType === 'good' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            <span className="ml-1">{change}% vs previous period</span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-light-card dark:bg-dark-card p-2 border border-light-border dark:border-dark-border rounded shadow-lg text-sm">
                <p className="font-semibold text-light-text dark:text-dark-text">{`${label}`}</p>
                {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>)}
            </div>
        );
    }
    return null;
};

const FilterPill = ({ label, options, selected, onSelect, onSelectAll, isAllSelected, isSingleSelect = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const getDisplayText = () => {
        if (isSingleSelect) return selected;
        if (isAllSelected) return `All ${label}`;
        if (selected.length === 1) return selected[0];
        return `${selected.length} ${label}`;
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-sm font-semibold bg-light-card dark:bg-dark-card px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                <span>{getDisplayText()}</span>
                <ChevronDown size={16} className="text-light-subtle-text" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 bg-light-card dark:bg-dark-card border dark:border-dark-border rounded-lg shadow-xl w-56 z-20">
                    <ul className="max-h-60 overflow-y-auto text-sm p-1">
                        {!isSingleSelect && (
                            <li className="px-2 py-1.5 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={onSelectAll}>
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </li>
                        )}
                        {options.map(option => (
                            <li key={option} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={() => onSelect(option)}>
                                {!isSingleSelect && (
                                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${selected.includes(option) ? 'bg-light-primary border-light-primary' : 'border-slate-300'}`}>
                                        {selected.includes(option) && <Check size={12} className="text-white" />}
                                    </div>
                                )}
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---
const ExecutiveDashboardPage = () => {
    const { incidents, hoursWorked, currentDate } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    
    const [period, setPeriod] = useState('Last 3 Months');
    const [selectedMines, setSelectedMines] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [pieChartMineIndex, setPieChartMineIndex] = useState(0);

    useEffect(() => {
        if (MINES) setSelectedMines(MINES);
        if (INCIDENT_TYPES) setSelectedTypes(INCIDENT_TYPES);
    }, [MINES, INCIDENT_TYPES]);
    
    useEffect(() => {
        if (pieChartMineIndex >= selectedMines.length && selectedMines.length > 0) {
            setPieChartMineIndex(0);
        }
    }, [selectedMines, pieChartMineIndex]);

    const areAllMinesSelected = MINES && selectedMines.length === MINES.length;
    const areAllTypesSelected = INCIDENT_TYPES && selectedTypes.length === INCIDENT_TYPES.length;

    const incidentTypeColorMap = useMemo(() => {
        const colorKeys = Object.keys(chartColors);
        return (INCIDENT_TYPES || []).reduce((acc, type, index) => {
            acc[type] = chartColors[colorKeys[index % colorKeys.length]];
            return acc;
        }, {});
    }, [INCIDENT_TYPES]);

    const getPeriodDates = (p, base) => {
        let dateFrom = new Date(base);
        if (p === 'Last 30 Days') dateFrom = subDays(dateFrom, 30);
        if (p === 'Last 3 Months') dateFrom = subMonths(dateFrom, 3);
        if (p === 'Last 6 Months') dateFrom = subMonths(dateFrom, 6);
        if (p === 'Last 12 Months') dateFrom = subMonths(dateFrom, 12);
        return { dateFrom };
    };

    const filteredIncidents = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom } = getPeriodDates(period, baseDate);
        
        return (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            const mineMatch = selectedMines.length === 0 ? false : selectedMines.includes(inc.mine);
            const typeMatch = selectedTypes.length === 0 ? false : selectedTypes.includes(inc.type);
            return incDate >= dateFrom && incDate <= baseDate && mineMatch && typeMatch;
        });
    }, [incidents, period, selectedMines, selectedTypes, currentDate]);

    const kpiData = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom: currentPeriodFrom } = getPeriodDates(period, baseDate);
        const periodDurationMonths = { 'Last 30 Days': 1, 'Last 3 Months': 3, 'Last 6 Months': 6, 'Last 12 Months': 12 }[period] || 3;
        const prevPeriodTo = subDays(currentPeriodFrom, 1);
        const prevPeriodFrom = subMonths(prevPeriodTo, periodDurationMonths);
        const getTotalHours = (start, end) => {
            if (!hoursWorked || selectedMines.length === 0) return 0;
            let total = 0;
            const months = eachMonthOfInterval({ start, end });
            for (const mine of selectedMines) {
                if (hoursWorked[mine]) {
                    for (const month of months) {
                        const monthKey = format(month, 'yyyy-MM');
                        total += hoursWorked[mine][monthKey] || 0;
                    }
                }
            }
            return total;
        };
        const currentHours = getTotalHours(currentPeriodFrom, baseDate);
        const prevHours = getTotalHours(prevPeriodFrom, prevPeriodTo);
        const allIncidentsInScope = (incidents || []).filter(inc => selectedMines.includes(inc.mine) && selectedTypes.includes(inc.type));
        const currentPeriodIncidents = allIncidentsInScope.filter(inc => new Date(inc.date) >= currentPeriodFrom && new Date(inc.date) <= baseDate);
        const prevPeriodIncidents = allIncidentsInScope.filter(inc => new Date(inc.date) >= prevPeriodFrom && new Date(inc.date) < currentPeriodFrom);
        const calcLTI = (arr) => arr.filter(i => !['Near Miss', 'High Potential Incident'].includes(i.type)).length;
        const calcNearMiss = (arr) => arr.filter(i => i.type === 'Near Miss').length;
        const currentLTI = calcLTI(currentPeriodIncidents);
        const prevLTI = calcLTI(prevPeriodIncidents);
        const currentLtifr = currentHours > 0 ? (currentLTI * 1000000) / currentHours : 0;
        const prevLtifr = prevHours > 0 ? (prevLTI * 1000000) / prevHours : 0;
        const nearMisses = calcNearMiss(currentPeriodIncidents);
        const reportableIncidents = currentPeriodIncidents.length - nearMisses;
        const nearMissRatio = reportableIncidents > 0 ? (nearMisses / reportableIncidents).toFixed(1) : 0;
        const getChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };
        return {
            totalIncidents: { value: currentPeriodIncidents.length, change: getChange(currentPeriodIncidents.length, prevPeriodIncidents.length) },
            ltifr: { value: currentLtifr.toFixed(2), change: getChange(currentLtifr, prevLtifr) },
            nearMissRatio: { value: `${nearMissRatio}:1`, change: 0 }
        };
    }, [period, incidents, hoursWorked, selectedMines, selectedTypes, currentDate]);
    
    const individualMineData = useMemo(() => {
        if (!selectedMines || selectedMines.length === 0 || !filteredIncidents) return { chartData: [], totalIncidents: 0 };
        const mine = selectedMines[pieChartMineIndex];
        if (!mine) return { chartData: [], totalIncidents: 0 };
        const mineIncidents = filteredIncidents.filter(inc => inc.mine === mine);
        const data = (INCIDENT_TYPES || []).map(type => ({
            name: type, value: mineIncidents.filter(inc => inc.type === type).length
        })).filter(item => item.value > 0);
        return { chartData: data, totalIncidents: data.reduce((sum, item) => sum + item.value, 0) };
    }, [filteredIncidents, pieChartMineIndex, selectedMines, INCIDENT_TYPES]);

    const minePerformanceData = useMemo(() => {
        const data = (MINES || []).map(mine => {
            const mineData = { name: mine };
            let total = 0;
            (INCIDENT_TYPES || []).forEach(type => {
                const count = (filteredIncidents || []).filter(inc => inc.mine === mine && inc.type === type).length;
                mineData[type] = count;
                total += count;
            });
            mineData.total = total;
            return mineData;
        });
        return data.sort((a, b) => b.total - a.total);
    }, [filteredIncidents, MINES, INCIDENT_TYPES]);

    const categoryTrendData = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom } = getPeriodDates(period, baseDate);
        const months = eachMonthOfInterval({ start: dateFrom, end: baseDate });

        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const monthData = { name: format(month, 'MMM') };
            const monthIncidents = filteredIncidents.filter(inc => format(new Date(inc.date), 'MMM yyyy') === monthStr);
            
            (INCIDENT_TYPES || []).forEach(type => {
                monthData[type] = monthIncidents.filter(inc => inc.type === type).length;
            });
            return monthData;
        });
    }, [filteredIncidents, period, INCIDENT_TYPES, currentDate]);

    const hotspotData = useMemo(() => {
        const sectionCounts = {};
        (filteredIncidents || []).forEach(inc => { sectionCounts[inc.sectionName] = (sectionCounts[inc.sectionName] || 0) + 1; });
        return Object.entries(sectionCounts).map(([name, Incidents]) => ({ name, Incidents })).sort((a, b) => b.Incidents - a.Incidents);
    }, [filteredIncidents]);

    const handleMineSelect = (mine) => setSelectedMines(prev => prev.includes(mine) ? prev.filter(m => m !== mine) : [...prev, mine]);
    const handleSelectAllMines = () => setSelectedMines(areAllMinesSelected ? [] : MINES);
    const handleTypeSelect = (type) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const handleSelectAllTypes = () => setSelectedTypes(areAllTypesSelected ? [] : INCIDENT_TYPES);
    const handlePeriodSelect = (p) => setPeriod(p);
    
    const nextMine = () => setPieChartMineIndex(prev => (prev + 1) % selectedMines.length);
    const prevMine = () => setPieChartMineIndex(prev => (prev - 1 + selectedMines.length) % selectedMines.length);
    
    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months'];

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
            
            <div className="sticky top-2 z-30">
                <div className="flex items-center justify-center gap-2 md:gap-4 p-2 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-full shadow-lg max-w-lg mx-auto">
                    <FilterPill label="Period" options={periodOptions} selected={period} onSelect={handlePeriodSelect} isSingleSelect={true} />
                    <FilterPill label="Mines" options={MINES} selected={selectedMines} onSelect={handleMineSelect} onSelectAll={handleSelectAllMines} isAllSelected={areAllMinesSelected} />
                    <FilterPill label="Types" options={INCIDENT_TYPES} selected={selectedTypes} onSelect={handleTypeSelect} onSelectAll={handleSelectAllTypes} isAllSelected={areAllTypesSelected} />
                </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-3 -mb-3">
                <KpiCard title="Total Incidents" value={kpiData.totalIncidents.value} change={kpiData.totalIncidents.change} changeType={kpiData.totalIncidents.change > 0 ? 'bad' : 'good'} />
                <KpiCard title="LTIFR" value={kpiData.ltifr.value} change={kpiData.ltifr.change} changeType={kpiData.ltifr.change > 0 ? 'bad' : 'good'} />
                <KpiCard title="Near Miss Ratio" value={kpiData.nearMissRatio.value} change={0} changeType={'good'} />
            </div>

            {selectedMines.length === 0 || selectedTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-light-subtle-text dark:text-dark-subtle-text bg-light-card dark:bg-dark-card rounded-lg">
                    <Info size={48} className="text-light-secondary mb-2" /><p className="font-semibold">Please select at least one mine and one incident type to view the dashboard.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold text-base mb-2">Mine Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                             <BarChart data={minePerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{fontSize: "12px"}}/>
                                {(INCIDENT_TYPES || []).map(type => (<Bar key={type} dataKey={type} stackId="a" fill={incidentTypeColorMap[type]} />))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {selectedMines.length > 0 && (
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-base">Individual Mine Analysis</h3>
                                <div className="flex items-center gap-1">
                                    <button onClick={prevMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft size={16} /></button>
                                    <span className="text-sm font-semibold w-20 text-center">{selectedMines[pieChartMineIndex] || 'N/A'}</span>
                                    <button onClick={nextMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                {individualMineData.totalIncidents > 0 ? (
                                    <PieChart>
                                        <Pie data={individualMineData.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {individualMineData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={incidentTypeColorMap[entry.name]} />)}
                                        </Pie><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{fontSize: "12px"}}/>
                                    </PieChart>
                                ) : ( <div className="flex flex-col items-center justify-center h-full text-center text-light-subtle-text dark:text-dark-subtle-text"><Smile size={48} className="text-green-500 mb-2" /><p className="font-semibold">Nice! Zero incidents at this mine.</p></div> )}
                            </ResponsiveContainer>
                        </div>
                    )}
                    
                    <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold text-base mb-2">Category-wise Monthly Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                {(INCIDENT_TYPES || []).map(type => (
                                    <Bar key={type} dataKey={type} stackId="a" fill={incidentTypeColorMap[type]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                         <h3 className="font-semibold text-base mb-2">Incident Hotspots</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hotspotData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" fontSize={10} />
                                <YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="Incidents" fill={chartColors.orange} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboardPage;