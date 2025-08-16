import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertCircle, ChevronDown, Check, X as XIcon } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subQuarters, format, startOfYear, subYears, isValid } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

// --- Reusable Components ---

const KpiCard = ({ title, valueA, valueB, percentageChange }) => {
    const changeType = percentageChange > 0 ? 'bad' : percentageChange < 0 ? 'good' : 'same';
    const Icon = changeType === 'bad' ? TrendingUp : TrendingDown;

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex-shrink-0 w-3/5 sm:w-1/2 md:w-auto">
            <h4 className="font-semibold text-sm text-light-subtle-text dark:text-dark-subtle-text truncate">{title}</h4>
            <div className="flex items-baseline gap-4 mt-2">
                <p className="text-3xl font-bold">{valueA}</p>
                <div className={`flex items-center text-lg font-semibold ${changeType === 'good' ? 'text-green-500' : 'text-red-500'}`}>
                    {changeType !== 'same' && <Icon size={20} className="mr-1"/>}
                    <span>{percentageChange.toFixed(1)}%</span>
                </div>
            </div>
            <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text mt-1">vs. {valueB} in previous period</p>
        </div>
    );
};

const VarianceBar = ({ value }) => {
    const isPositive = value > 0;
    const width = Math.min(Math.abs(value), 100);
    return (
        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full ${isPositive ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${width}%` }}
            ></div>
        </div>
    );
};

const FilterPill = ({ label, options, selected, onSelect, onSelectAll, isAllSelected }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = React.useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);
    const getDisplayText = () => {
        if (isAllSelected) return `All ${label}`;
        if (selected.length === 1) return selected[0];
        return `${selected.length} ${label}`;
    };
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600">
                <span>{getDisplayText()}</span>
                <ChevronDown size={14} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 bg-light-card dark:bg-dark-card border dark:border-dark-border rounded-lg shadow-xl w-48 z-20">
                    <ul className="max-h-60 overflow-y-auto text-sm p-1">
                        <li className="px-2 py-1.5 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={onSelectAll}>
                            {isAllSelected ? 'Deselect All' : 'Select All'}
                        </li>
                        {options.map(option => (
                            <li key={option} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer" onClick={() => onSelect(option)}>
                                <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${selected.includes(option) ? 'bg-light-primary border-light-primary' : 'border-slate-300'}`}>
                                    {selected.includes(option) && <Check size={12} className="text-white" />}
                                </div>
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- Main Page Component ---
const ComparisonPage = () => {
    const { incidents, currentDate } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);

    const chartColors = useMemo(() => {
        const fullConfig = resolveConfig(tailwindConfig);
        return fullConfig.theme.chart || {};
    }, []);

    const [periodA, setPeriodA] = useState({ start: null, end: null });
    const [periodB, setPeriodB] = useState({ start: null, end: null });
    const [activePreset, setActivePreset] = useState('This Quarter vs Last Quarter');
    
    const [mineCompTypes, setMineCompTypes] = useState([]);
    const [typeCompMines, setTypeCompMines] = useState([]);
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [customDates, setCustomDates] = useState({ a_start: '', a_end: '', b_start: '', b_end: '' });

    useEffect(() => {
        setDateRanges('This Quarter vs Last Quarter');
        if (INCIDENT_TYPES) setMineCompTypes(INCIDENT_TYPES);
        if (MINES) setTypeCompMines(MINES);
    }, [INCIDENT_TYPES, MINES]);

    const setDateRanges = (preset) => {
        const base = currentDate ? new Date(currentDate) : new Date();
        let pA_start, pA_end, pB_start, pB_end;

        switch (preset) {
            case 'This Month vs Previous Month':
                pA_start = startOfMonth(base); pA_end = endOfMonth(base);
                pB_start = startOfMonth(subMonths(base, 1)); pB_end = endOfMonth(subMonths(base, 1));
                break;
            case 'This Quarter vs Last Quarter':
                pA_start = startOfQuarter(base); pA_end = endOfQuarter(base);
                pB_start = startOfQuarter(subQuarters(base, 1)); pB_end = endOfQuarter(subQuarters(base, 1));
                break;
            case 'This Month vs Same Month Last Year':
                pA_start = startOfMonth(base); pA_end = endOfMonth(base);
                pB_start = startOfMonth(subYears(base, 1)); pB_end = endOfMonth(subYears(base, 1));
                break;
            case 'Year to Date vs Previous Year to Date':
                pA_start = startOfYear(base); pA_end = base;
                pB_start = startOfYear(subYears(base, 1)); pB_end = subYears(base, 1);
                break;
        }
        setPeriodA({ start: pA_start, end: pA_end });
        setPeriodB({ start: pB_start, end: pB_end });
        setActivePreset(preset);
    };

    const handleCustomDateApply = () => {
        const a_start = new Date(customDates.a_start);
        const a_end = new Date(customDates.a_end);
        const b_start = new Date(customDates.b_start);
        const b_end = new Date(customDates.b_end);

        if(isValid(a_start) && isValid(a_end) && isValid(b_start) && isValid(b_end)) {
            setPeriodA({ start: a_start, end: a_end });
            setPeriodB({ start: b_start, end: b_end });
            setActivePreset('Custom');
            setIsCustomDateModalOpen(false);
        } else {
            alert('Please enter valid dates for all fields.');
        }
    };

    const incidentsA = useMemo(() => {
        if (!periodA.start || !periodA.end) return [];
        return (incidents || []).filter(inc => new Date(inc.date) >= periodA.start && new Date(inc.date) <= periodA.end);
    }, [incidents, periodA]);

    const incidentsB = useMemo(() => {
        if (!periodB.start || !periodB.end) return [];
        return (incidents || []).filter(inc => new Date(inc.date) >= periodB.start && new Date(inc.date) <= periodB.end);
    }, [incidents, periodB]);

    const calculatePercentageChange = (valA, valB) => {
        if (valB === 0) return valA > 0 ? 100.0 : 0.0;
        return ((valA - valB) / valB) * 100;
    };

    const kpiData = useMemo(() => {
        const totalA = incidentsA.length;
        const totalB = incidentsB.length;
        const ltiA = incidentsA.filter(i => !['Near Miss', 'High Potential Incident'].includes(i.type)).length;
        const ltiB = incidentsB.filter(i => !['Near Miss', 'High Potential Incident'].includes(i.type)).length;
        const daysLostA = incidentsA.reduce((sum, i) => sum + (i.daysLost || 0), 0);
        const daysLostB = incidentsB.reduce((sum, i) => sum + (i.daysLost || 0), 0);
        
        return [
            { title: 'Total Incidents', valueA: totalA, valueB: totalB, percentageChange: calculatePercentageChange(totalA, totalB) },
            { title: 'LTI Incidents', valueA: ltiA, valueB: ltiB, percentageChange: calculatePercentageChange(ltiA, ltiB) },
            { title: 'Total Days Lost', valueA: daysLostA, valueB: daysLostB, percentageChange: calculatePercentageChange(daysLostA, daysLostB) },
        ];
    }, [incidentsA, incidentsB]);

    const minePerformanceData = useMemo(() => {
        const relevantIncidentsA = incidentsA.filter(i => mineCompTypes.includes(i.type));
        const relevantIncidentsB = incidentsB.filter(i => mineCompTypes.includes(i.type));
        
        return (MINES || []).map(mine => {
            const countA = relevantIncidentsA.filter(i => i.mine === mine).length;
            const countB = relevantIncidentsB.filter(i => i.mine === mine).length;
            return { mine, countA, countB, percentageChange: calculatePercentageChange(countA, countB) };
        }).sort((a,b) => a.percentageChange - b.percentageChange);
    }, [incidentsA, incidentsB, MINES, mineCompTypes]);

    const typeComparisonData = useMemo(() => {
        const relevantIncidentsA = incidentsA.filter(i => typeCompMines.includes(i.mine));
        const relevantIncidentsB = incidentsB.filter(i => typeCompMines.includes(i.mine));

        return (INCIDENT_TYPES || []).map(type => ({
            name: type,
            'Period A': relevantIncidentsA.filter(i => i.type === type).length,
            'Period B': relevantIncidentsB.filter(i => i.type === type).length,
        }));
    }, [incidentsA, incidentsB, INCIDENT_TYPES, typeCompMines]);
    
    const rankings = useMemo(() => {
        const sorted = [...minePerformanceData];
        return {
            mostImproved: sorted.filter(m => m.percentageChange < 0).slice(0, 3),
            needsAttention: sorted.filter(m => m.percentageChange > 0).reverse().slice(0, 3)
        };
    }, [minePerformanceData]);

    const presets = ['This Month vs Previous Month', 'This Quarter vs Last Quarter', 'This Month vs Same Month Last Year', 'Year to Date vs Previous Year to Date'];
    
    const handleMineCompTypeSelect = (type) => setMineCompTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const handleMineCompTypeSelectAll = () => setMineCompTypes(mineCompTypes.length === INCIDENT_TYPES.length ? [] : INCIDENT_TYPES);
    const handleTypeCompMineSelect = (mine) => setTypeCompMines(prev => prev.includes(mine) ? prev.filter(m => m !== mine) : [...prev, mine]);
    const handleTypeCompMineSelectAll = () => setTypeCompMines(typeCompMines.length === MINES.length ? [] : MINES);

    return (
        <div className="space-y-6">
            <div className="sticky top-4 z-30">
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-lg">
                    <div className="flex overflow-x-auto pb-2 -mb-2 space-x-2 flex-nowrap">
                        {presets.map(preset => (
                            <button key={preset} onClick={() => setDateRanges(preset)} className={`flex-shrink-0 text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium ${activePreset === preset ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`}>
                                {preset}
                            </button>
                        ))}
                    </div>
                    <div className="text-center mt-4">
                        <div className="grid grid-cols-3 items-center">
                             <div onClick={() => setIsCustomDateModalOpen(true)} className="cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                <p className="text-sm font-semibold text-light-text dark:text-dark-text">Period A</p>
                                <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">{periodA.start && format(periodA.start, 'd MMM yyyy')} - {periodA.end && format(periodA.end, 'd MMM yyyy')}</p>
                            </div>
                            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">vs</p>
                            <div onClick={() => setIsCustomDateModalOpen(true)} className="cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                <p className="text-sm font-semibold text-light-text dark:text-dark-text">Period B</p>
                                <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">{periodB.start && format(periodB.start, 'd MMM yyyy')} - {periodB.end && format(periodB.end, 'd MMM yyyy')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 md:grid md:grid-cols-3">
                {kpiData.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-base">Mine-by-Mine Performance</h3>
                        <FilterPill label="Types" options={INCIDENT_TYPES} selected={mineCompTypes} onSelect={handleMineCompTypeSelect} onSelectAll={handleMineCompTypeSelectAll} isAllSelected={mineCompTypes.length === INCIDENT_TYPES.length} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-light-subtle-text dark:text-dark-subtle-text uppercase font-medium">
                                <tr>
                                    <th className="py-2 px-2">Mine</th>
                                    <th className="py-2 px-2 text-center">Period A</th>
                                    <th className="py-2 px-2 text-center">Period B</th>
                                    <th className="py-2 px-2 text-center">% Change</th>
                                    <th className="py-2 px-2">Variance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minePerformanceData.map(d => (
                                    <tr key={d.mine} className="border-b border-light-border dark:border-dark-border">
                                        <td className="py-2 px-2 font-medium">{d.mine}</td>
                                        <td className="py-2 px-2 text-center">{d.countA}</td>
                                        <td className="py-2 px-2 text-center">{d.countB}</td>
                                        <td className={`py-2 px-2 text-center font-semibold ${d.percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>{d.percentageChange.toFixed(1)}%</td>
                                        <td className="py-2 px-2"><VarianceBar value={d.percentageChange} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-base">Incident Type Comparison</h3>
                        <FilterPill label="Mines" options={MINES} selected={typeCompMines} onSelect={handleTypeCompMineSelect} onSelectAll={handleTypeCompMineSelectAll} isAllSelected={typeCompMines.length === MINES.length} />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={typeComparisonData} margin={{ top: 20, right: 5, left: -25, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Legend verticalAlign="top" wrapperStyle={{fontSize: "12px", marginBottom: "10px"}}/>
                            <Bar dataKey="Period A" fill={chartColors.orange} />
                            <Bar dataKey="Period B" fill={chartColors.blue} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 -mb-4 md:grid md:grid-cols-2">
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex-shrink-0 w-5/6 sm:w-2/3 md:w-auto">
                     <h3 className="font-semibold text-base mb-3 flex items-center gap-2"><Award size={18} className="text-green-500" /> Most Improved Mines</h3>
                     <ul className="space-y-2">
                        {rankings.mostImproved.map(d => (
                            <li key={d.mine} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{d.mine}</span>
                                <span className="font-semibold text-green-500">{d.percentageChange.toFixed(1)}%</span>
                            </li>
                        ))}
                         {rankings.mostImproved.length === 0 && <p className="text-sm text-light-subtle-text">No mines showed improvement in this period.</p>}
                     </ul>
                </div>
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex-shrink-0 w-5/6 sm:w-2/3 md:w-auto">
                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2"><AlertCircle size={18} className="text-red-500" /> Mines Needing Attention</h3>
                     <ul className="space-y-2">
                        {rankings.needsAttention.map(d => (
                            <li key={d.mine} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{d.mine}</span>
                                <span className="font-semibold text-red-500">+{d.percentageChange.toFixed(1)}%</span>
                            </li>
                        ))}
                        {rankings.needsAttention.length === 0 && <p className="text-sm text-light-subtle-text">No mines showed a negative trend in this period.</p>}
                     </ul>
                </div>
            </div>

            {isCustomDateModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                     <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Select Custom Date Range</h3>
                            <button onClick={() => setIsCustomDateModalOpen(false)}><XIcon size={20} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="font-semibold text-sm mb-1 block">Period A</label>
                                <div className="flex gap-2">
                                    <input type="date" value={customDates.a_start} onChange={e => setCustomDates(p => ({...p, a_start: e.target.value}))} className="w-full p-2 text-sm rounded-md border dark:bg-dark-background dark:border-dark-border" />
                                    <input type="date" value={customDates.a_end} onChange={e => setCustomDates(p => ({...p, a_end: e.target.value}))} className="w-full p-2 text-sm rounded-md border dark:bg-dark-background dark:border-dark-border" />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold text-sm mb-1 block">Period B</label>
                                <div className="flex gap-2">
                                    <input type="date" value={customDates.b_start} onChange={e => setCustomDates(p => ({...p, b_start: e.target.value}))} className="w-full p-2 text-sm rounded-md border dark:bg-dark-background dark:border-dark-border" />
                                    <input type="date" value={customDates.b_end} onChange={e => setCustomDates(p => ({...p, b_end: e.target.value}))} className="w-full p-2 text-sm rounded-md border dark:bg-dark-background dark:border-dark-border" />
                                </div>
                            </div>
                        </div>
                         <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                            <button onClick={handleCustomDateApply} className="bg-light-primary text-white font-semibold py-2 px-4 rounded-md text-sm">Apply Dates</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonPage;