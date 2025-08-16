import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { ChevronLeft, ChevronRight, Filter, X as XIcon, Smile, Search, Info, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, format, eachMonthOfInterval, subDays, subYears } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const chartColors = fullConfig.theme.chart; 
const COLORS = Object.values(chartColors);

// --- KPI Card Component ---
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

// --- Custom Hooks & Components ---
const useWindowSize = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};

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

// --- Main Dashboard Component ---
const ExecutiveDashboardPage = () => {
    const { incidents, hoursWorked, currentDate } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    
    const width = useWindowSize();
    const isSmallScreen = width < 768;

    const [period, setPeriod] = useState('Last 3 Months');
    const [selectedMines, setSelectedMines] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [pieChartMineIndex, setPieChartMineIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [drillDownFilter, setDrillDownFilter] = useState(null);

    useEffect(() => {
        if (MINES) setSelectedMines(MINES);
        if (INCIDENT_TYPES) setSelectedTypes(INCIDENT_TYPES);
    }, [MINES, INCIDENT_TYPES]);
    
    useEffect(() => {
        if (pieChartMineIndex >= selectedMines.length && selectedMines.length > 0) {
            setPieChartMineIndex(0);
        }
    }, [selectedMines, pieChartMineIndex]);

    const incidentTypeColorMap = useMemo(() => {
        const colorKeys = Object.keys(chartColors);
        return (INCIDENT_TYPES || []).reduce((acc, type, index) => {
            acc[type] = chartColors[colorKeys[index % colorKeys.length]];
            return acc;
        }, {});
    }, [INCIDENT_TYPES]);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months'];

    const getPeriodDates = (p, base) => {
        let dateFrom = new Date(base);
        let dateTo = new Date(base);
        if (p === 'Last 30 Days') dateFrom = subDays(dateFrom, 30);
        if (p === 'Last 3 Months') dateFrom = subMonths(dateFrom, 3);
        if (p === 'Last 6 Months') dateFrom = subMonths(dateFrom, 6);
        if (p === 'Last 12 Months') dateFrom = subMonths(dateFrom, 12);
        return { dateFrom, dateTo };
    };

    const filteredIncidents = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom } = getPeriodDates(period, baseDate);
        
        let initialFilter = (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            const mineMatch = selectedMines.length === 0 ? true : selectedMines.includes(inc.mine);
            const typeMatch = selectedTypes.length === 0 ? true : selectedTypes.includes(inc.type);
            return incDate >= dateFrom && incDate <= baseDate && mineMatch && typeMatch;
        });

        if (drillDownFilter) {
            return initialFilter.filter(inc => inc[drillDownFilter.key] === drillDownFilter.value);
        }
        return initialFilter;
    }, [incidents, period, selectedMines, selectedTypes, currentDate, drillDownFilter]);

    const kpiData = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom: currentPeriodFrom, dateTo: currentPeriodTo } = getPeriodDates(period, baseDate);
        
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

        const currentHours = getTotalHours(currentPeriodFrom, currentPeriodTo);
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

    const monthlyTrendData = useMemo(() => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        const { dateFrom } = getPeriodDates(period, baseDate);
        const allIncidentsInScope = (incidents || []).filter(inc => selectedMines.includes(inc.mine) && selectedTypes.includes(inc.type));
        const months = eachMonthOfInterval({ start: dateFrom, end: baseDate });
        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const prevYearMonthStr = format(subYears(month, 1), 'MMM yyyy');
            return {
                name: format(month, 'MMM'),
                'Current Year': allIncidentsInScope.filter(inc => format(new Date(inc.date), 'MMM yyyy') === monthStr).length,
                'Previous Year': allIncidentsInScope.filter(inc => format(new Date(inc.date), 'MMM yyyy') === prevYearMonthStr).length,
            };
        });
    }, [period, incidents, selectedMines, selectedTypes, currentDate]);

    const hotspotData = useMemo(() => {
        const sectionCounts = {};
        (filteredIncidents || []).forEach(inc => { sectionCounts[inc.sectionName] = (sectionCounts[inc.sectionName] || 0) + 1; });
        return Object.entries(sectionCounts).map(([name, Incidents]) => ({ name, Incidents })).sort((a, b) => b.Incidents - a.Incidents);
    }, [filteredIncidents]);

    const handleMineToggle = (mine) => setSelectedMines(prev => prev.includes(mine) ? prev.filter(m => m !== mine) : [...prev, mine]);
    const handleTypeToggle = (type) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const nextMine = () => setPieChartMineIndex(prev => (prev + 1) % selectedMines.length);
    const prevMine = () => setPieChartMineIndex(prev => (prev - 1 + selectedMines.length) % selectedMines.length);
    const handlePieClick = (data) => {
        if (drillDownFilter && drillDownFilter.value === data.name) setDrillDownFilter(null);
        else setDrillDownFilter({ key: 'type', value: data.name });
    };
    
    const areAllMinesSelected = MINES && selectedMines.length === MINES.length;
    const areAllTypesSelected = INCIDENT_TYPES && selectedTypes.length === INCIDENT_TYPES.length;
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
                <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">Data as of: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-3 -mb-3">
                <KpiCard title="Total Incidents" value={kpiData.totalIncidents.value} change={kpiData.totalIncidents.change} changeType={kpiData.totalIncidents.change > 0 ? 'bad' : 'good'} />
                <KpiCard title="LTIFR" value={kpiData.ltifr.value} change={kpiData.ltifr.change} changeType={kpiData.ltifr.change > 0 ? 'bad' : 'good'} />
                <KpiCard title="Near Miss Ratio" value={kpiData.nearMissRatio.value} change={0} changeType={'good'} />
            </div>

            <div className="space-y-3">
                <div className="overflow-x-auto pb-2"><div className="flex items-center gap-2 w-max">{periodOptions.map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-sm font-normal whitespace-nowrap ${period === p ? 'bg-light-secondary text-white' : 'bg-light-card dark:bg-dark-card'}`}>{p}</button>)}</div></div>
                <div className="overflow-x-auto pb-2"><div className="flex items-center gap-2 w-max"><button onClick={() => setSelectedMines(areAllMinesSelected ? [] : MINES)} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${areAllMinesSelected ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>All</button>{(MINES || []).map(mine => <button key={mine} onClick={() => handleMineToggle(mine)} className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap ${selectedMines.includes(mine) ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>{mine}</button>)}</div></div>
                {isSmallScreen ? (<button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2 bg-light-card dark:bg-dark-card px-4 py-2 rounded-md shadow-sm text-sm font-normal"><Filter size={16} /> Filter by Type ({selectedTypes.length})</button>) : (<div className="overflow-x-auto pb-2"><div className="flex items-center gap-2 w-max"><button onClick={() => setSelectedTypes(areAllTypesSelected ? [] : INCIDENT_TYPES)} className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${areAllTypesSelected ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>All</button>{(INCIDENT_TYPES || []).map(type => (<button key={type} onClick={() => handleTypeToggle(type)} className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap text-white`} style={{ backgroundColor: selectedTypes.includes(type) ? incidentTypeColorMap[type] : '#94a3b8' }}>{type}</button>))}</div></div>)}
            </div>

            {drillDownFilter && (
                <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-md flex justify-between items-center text-sm">
                    <span>Showing data for <strong>{drillDownFilter.value}</strong> incidents only.</span>
                    <button onClick={() => setDrillDownFilter(null)} className="flex items-center gap-1 font-semibold hover:underline"><XIcon size={16} /> Clear Filter</button>
                </div>
            )}

            {filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-light-subtle-text dark:text-dark-subtle-text bg-light-card dark:bg-dark-card rounded-lg">
                    <Info size={48} className="text-light-secondary mb-2" /><p className="font-semibold">No incidents found for the selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2 text-base">Mine Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={minePerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{fontSize: "12px"}}/><ReferenceLine y={15} label={{ value: 'Target', position: 'insideTopLeft', fill: '#dc2626' }} stroke="#dc2626" strokeDasharray="3 3" />
                                {(INCIDENT_TYPES || []).map(type => (<Bar key={type} dataKey={type} stackId="a" fill={incidentTypeColorMap[type]} />))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-base">Individual Mine Analysis</h3>
                            <div className="flex items-center gap-1"><button onClick={prevMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft size={16} /></button><span className="text-sm font-semibold w-20 text-center">{selectedMines[pieChartMineIndex] || 'N/A'}</span><button onClick={nextMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight size={16} /></button></div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            {individualMineData.totalIncidents > 0 ? (
                                <PieChart>
                                    <Pie data={individualMineData.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label onClick={handlePieClick} style={{ cursor: 'pointer' }}>
                                        {individualMineData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={incidentTypeColorMap[entry.name]} />)}
                                    </Pie><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{fontSize: "12px"}}/>
                                </PieChart>
                            ) : ( <div className="flex flex-col items-center justify-center h-full text-center text-light-subtle-text dark:text-dark-subtle-text"><Smile size={48} className="text-green-500 mb-2" /><p className="font-semibold">Nice! Zero incidents at this mine.</p></div> )}
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="font-semibold mb-2 text-base">Monthly Trend (YoY)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{fontSize: "12px"}}/><Line type="monotone" dataKey="Current Year" stroke={chartColors.blue} strokeWidth={2} /><Line type="monotone" dataKey="Previous Year" stroke={chartColors.gray} strokeDasharray="5 5" /></LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="font-semibold mb-2 text-base">Incident Hotspots (by Section)</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={hotspotData} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis type="number" fontSize={10} /><YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Incidents" fill={chartColors.orange} barSize={15} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-4 border-b flex justify-between items-center"><h3 className="font-semibold">Filter by Type</h3><button onClick={() => setIsFilterModalOpen(false)}><XIcon size={20} /></button></div>
                        <div className="p-4 space-y-2">{(INCIDENT_TYPES || []).map(type => <label key={type} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => handleTypeToggle(type)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary" /><span>{type}</span></label>)}</div>
                        <div className="p-4 border-t"><button onClick={() => setIsFilterModalOpen(false)} className="w-full bg-light-primary text-white py-2 rounded-md font-semibold">Apply</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboardPage;