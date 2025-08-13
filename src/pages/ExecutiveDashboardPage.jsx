import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChevronLeft, ChevronRight, Filter, X as XIcon, Smile, Search, Info } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, format, eachMonthOfInterval, subDays } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const chartColors = fullConfig.theme.colors.chart;

const COLORS = Object.values(chartColors);

const useWindowSize = () => {
    const [width, setWidth] = useState(window.innerWidth);
    React.useLayoutEffect(() => {
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

const ExecutiveDashboardPage = () => {
    const { incidents } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    const width = useWindowSize();
    const isSmallScreen = width < 768;

    const [period, setPeriod] = useState('Last 3 Months');
    const [selectedMines, setSelectedMines] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [pieChartMineIndex, setPieChartMineIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    useEffect(() => {
        if (MINES) setSelectedMines(MINES);
        if (INCIDENT_TYPES) setSelectedTypes(INCIDENT_TYPES);
    }, [MINES, INCIDENT_TYPES]);
    
    useEffect(() => {
        if (pieChartMineIndex >= selectedMines.length && selectedMines.length > 0) {
            setPieChartMineIndex(0);
        }
    }, [selectedMines, pieChartMineIndex]);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months'];

    const filteredIncidents = useMemo(() => {
        let dateFrom = new Date();
        if (period === 'Last 30 Days') dateFrom = subDays(dateFrom, 30);
        if (period === 'Last 3 Months') dateFrom = subMonths(dateFrom, 3);
        if (period === 'Last 6 Months') dateFrom = subMonths(dateFrom, 6);
        if (period === 'Last 12 Months') dateFrom = subMonths(dateFrom, 12);

        return (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= dateFrom &&
                   (selectedMines.length > 0 ? selectedMines.includes(inc.mine) : false) &&
                   (selectedTypes.length > 0 ? selectedTypes.includes(inc.type) : false);
        });
    }, [incidents, period, selectedMines, selectedTypes]);
    
    const individualMineData = useMemo(() => {
        if (selectedMines.length === 0) return { chartData: [], totalIncidents: 0, hasNearMiss: false };
        const mine = selectedMines[pieChartMineIndex];
        if (!mine) return { chartData: [], totalIncidents: 0, hasNearMiss: false };
        
        const mineIncidents = filteredIncidents.filter(inc => inc.mine === mine);
        const data = (INCIDENT_TYPES || []).map(type => ({
            name: type,
            value: mineIncidents.filter(inc => inc.type === type).length
        })).filter(item => item.value > 0);

        const hasNearMiss = data.some(item => item.name === 'Near Miss' && item.value > 0);
        const totalIncidents = data.reduce((sum, item) => sum + item.value, 0);

        return { chartData: data, totalIncidents, hasNearMiss };
    }, [filteredIncidents, pieChartMineIndex, selectedMines, INCIDENT_TYPES]);

    const minePerformanceData = useMemo(() => (MINES || []).map(mine => ({ name: mine, Incidents: filteredIncidents.filter(inc => inc.mine === mine).length })), [filteredIncidents, MINES]);
    const monthlyTrendData = useMemo(() => {
        let startDate = new Date();
        if (period === 'Last 30 Days') startDate = subMonths(startDate, 1);
        if (period === 'Last 3 Months') startDate = subMonths(startDate, 3);
        if (period === 'Last 6 Months') startDate = subMonths(startDate, 6);
        if (period === 'Last 12 Months') startDate = subMonths(startDate, 12);
        const months = eachMonthOfInterval({ start: startOfMonth(startDate), end: new Date() });
        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const monthIncidents = filteredIncidents.filter(inc => format(new Date(inc.date), 'MMM yyyy') === monthStr);
            const typesCount = {};
            (INCIDENT_TYPES || []).forEach(type => { typesCount[type] = monthIncidents.filter(inc => inc.type === type).length; });
            return { name: format(month, 'MMM'), ...typesCount };
        });
    }, [filteredIncidents, period, INCIDENT_TYPES]);
    const hotspotData = useMemo(() => {
        const sectionCounts = {};
        filteredIncidents.forEach(inc => { sectionCounts[inc.sectionName] = (sectionCounts[inc.sectionName] || 0) + 1; });
        return Object.entries(sectionCounts).map(([name, Incidents]) => ({ name, Incidents })).sort((a, b) => a.Incidents - b.Incidents);
    }, [filteredIncidents]);


    const handleMineToggle = (mine) => setSelectedMines(prev => prev.includes(mine) ? prev.filter(m => m !== mine) : [...prev, mine]);
    const handleTypeToggle = (type) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    
    const nextMine = () => {
        if (selectedMines.length === 0) return;
        setPieChartMineIndex(prev => (prev + 1) % selectedMines.length);
    };
    const prevMine = () => {
        if (selectedMines.length === 0) return;
        setPieChartMineIndex(prev => (prev - 1 + selectedMines.length) % selectedMines.length);
    };
    
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 w-max">
                        {periodOptions.map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-sm font-normal whitespace-nowrap ${period === p ? 'bg-light-secondary text-white' : 'bg-light-card dark:bg-dark-card'}`}>{p}</button>)}
                    </div>
                </div>
                 <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 w-max">
                        {(MINES || []).map(mine => <button key={mine} onClick={() => handleMineToggle(mine)} className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap ${selectedMines.includes(mine) ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>{mine}</button>)}
                    </div>
                </div>
                {isSmallScreen ? (
                    <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2 bg-light-card dark:bg-dark-card px-4 py-2 rounded-md shadow-sm text-sm font-normal">
                        <Filter size={16} /> Filter by Type ({selectedTypes.length})
                    </button>
                ) : (
                    <div className="overflow-x-auto pb-2">
                        <div className="flex items-center gap-2 w-max">
                            {(INCIDENT_TYPES || []).map(type => <button key={type} onClick={() => handleTypeToggle(type)} className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap ${selectedTypes.includes(type) ? 'bg-light-primary text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>{type}</button>)}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-2 text-base">Mine Performance</h3>
                    <ResponsiveContainer width="100%" height={300}><BarChart data={minePerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Incidents" fill={chartColors.blue} /></BarChart></ResponsiveContainer>
                </div>

                <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-base">Individual Mine Analysis</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft size={16} /></button>
                            <span className="text-sm font-semibold w-20 text-center">{selectedMines[pieChartMineIndex] || 'N/A'}</span>
                            <button onClick={nextMine} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        {selectedMines.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-light-subtle-text dark:text-dark-subtle-text">
                                <Info size={48} className="text-light-secondary mb-2" />
                                <p className="font-semibold">No Mine Selected</p>
                                <p className="text-sm">Please select a mine from the filter above.</p>
                            </div>
                        ) : individualMineData.totalIncidents > 0 ? (
                            <>
                                <PieChart>
                                    <Pie data={individualMineData.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {individualMineData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconSize={10} wrapperStyle={{fontSize: "10px"}}/>
                                </PieChart>
                                {!individualMineData.hasNearMiss && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-center text-light-accent dark:text-dark-accent bg-orange-50 dark:bg-orange-900/50 p-1 rounded">
                                        <p className="flex items-center gap-1"><Search size={12}/> <span>Zero Near Misses reported. Are you sure?</span></p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-light-subtle-text dark:text-dark-subtle-text">
                                <Smile size={48} className="text-green-500 mb-2" />
                                <p className="font-semibold">Nice! A safe day at this mine.</p>
                                <p className="text-sm">No incidents to report for this period.</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
                
                <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md lg:col-span-2">
                    <h3 className="font-semibold mb-2 text-base">Monthly Trend Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}><LineChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip content={<CustomTooltip />} /><Legend iconSize={10} wrapperStyle={{fontSize: "10px"}}/>{selectedTypes.map((type, i) => <Line key={type} type="monotone" dataKey={type} stroke={COLORS[i % COLORS.length]} />)}</LineChart></ResponsiveContainer>
                </div>

                <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md lg:col-span-2">
                    <h3 className="font-semibold mb-2 text-base">Incident Hotspots (by Section)</h3>
                    <ResponsiveContainer width="100%" height={400}><BarChart data={hotspotData} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} /><XAxis type="number" fontSize={10} /><YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Incidents" fill={chartColors.orange} barSize={15} /></BarChart></ResponsiveContainer>
                </div>
            </div>

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
