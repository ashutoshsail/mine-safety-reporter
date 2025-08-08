import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChevronLeft, ChevronRight, Filter, X as XIcon } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, format, eachMonthOfInterval, getYear } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const useWindowSize = () => {
    const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
    React.useLayoutEffect(() => {
        const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
};

const ExecutiveDashboardPage = () => {
    const { incidents, MINES, INCIDENT_TYPES, currentDate } = useContext(AppContext);
    const [width] = useWindowSize();
    const isSmallScreen = width < 768;

    // Filters State
    const [period, setPeriod] = useState('Last 3 Months');
    const [selectedMines, setSelectedMines] = useState(MINES);
    const [selectedTypes, setSelectedTypes] = useState(INCIDENT_TYPES);
    const [pieChartMineIndex, setPieChartMineIndex] = useState(0);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months'];

    const filteredIncidents = useMemo(() => {
        let dateFrom = new Date(currentDate);
        if (period === 'Last 30 Days') dateFrom.setDate(dateFrom.getDate() - 30);
        if (period === 'Last 3 Months') dateFrom = subMonths(dateFrom, 3);
        if (period === 'Last 6 Months') dateFrom = subMonths(dateFrom, 6);
        if (period === 'Last 12 Months') dateFrom = subMonths(dateFrom, 12);

        return incidents.filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= dateFrom &&
                   incDate <= currentDate &&
                   selectedMines.includes(inc.mine) &&
                   selectedTypes.includes(inc.type);
        });
    }, [incidents, period, selectedMines, selectedTypes, currentDate]);

    // Chart Data Processing
    const minePerformanceData = useMemo(() => {
        const data = MINES.map(mine => ({
            name: mine,
            Incidents: filteredIncidents.filter(inc => inc.mine === mine).length
        }));
        return data;
    }, [filteredIncidents]);

    const individualMineData = useMemo(() => {
        const mine = selectedMines[pieChartMineIndex];
        if (!mine) return [];
        const mineIncidents = filteredIncidents.filter(inc => inc.mine === mine);
        const data = INCIDENT_TYPES.map(type => ({
            name: type,
            value: mineIncidents.filter(inc => inc.type === type).length
        })).filter(item => item.value > 0);
        return data;
    }, [filteredIncidents, pieChartMineIndex, selectedMines]);

    const monthlyTrendData = useMemo(() => {
        let startDate = new Date(currentDate);
        if (period === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
        if (period === 'Last 3 Months') startDate = subMonths(startDate, 3);
        if (period === 'Last 6 Months') startDate = subMonths(startDate, 6);
        if (period === 'Last 12 Months') startDate = subMonths(startDate, 12);

        const months = eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(currentDate) });
        
        const data = months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const monthIncidents = filteredIncidents.filter(inc => format(new Date(inc.date), 'MMM yyyy') === monthStr);
            
            const typesCount = {};
            INCIDENT_TYPES.forEach(type => {
                typesCount[type] = monthIncidents.filter(inc => inc.type === type).length;
            });

            return { name: format(month, 'MMM'), ...typesCount };
        });
        return data;
    }, [filteredIncidents, period, currentDate]);
    
    const hotspotData = useMemo(() => {
        const sectionCounts = {};
        filteredIncidents.forEach(inc => {
            sectionCounts[inc.sectionName] = (sectionCounts[inc.sectionName] || 0) + 1;
        });
        return Object.entries(sectionCounts)
            .map(([name, Incidents]) => ({ name, Incidents }))
            .sort((a, b) => a.Incidents - b.Incidents);
    }, [filteredIncidents]);

    const handleMineToggle = (mine) => {
        setSelectedMines(prev => prev.includes(mine) ? prev.filter(m => m !== mine) : [...prev, mine]);
    };
    
    const handleTypeToggle = (type) => {
        setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const nextMine = () => setPieChartMineIndex(prev => (prev + 1) % selectedMines.length);
    const prevMine = () => setPieChartMineIndex(prev => (prev - 1 + selectedMines.length) % selectedMines.length);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-light-card dark:bg-dark-card p-2 border border-slate-300 dark:border-slate-600 rounded shadow-lg text-sm">
                    <p className="label font-semibold">{`${label}`}</p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderTypeFilter = () => {
        if (isSmallScreen) {
            return (
                <button onClick={() => setIsFilterModalOpen(true)} className="flex items-center gap-2 bg-light-card dark:bg-dark-card px-4 py-2 rounded-md shadow-sm text-sm font-semibold">
                    <Filter size={16} />
                    Filter by Type ({selectedTypes.length})
                </button>
            );
        }
        return (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {INCIDENT_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => handleTypeToggle(type)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${selectedTypes.includes(type) ? 'bg-light-primary text-white dark:bg-dark-primary dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-600'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text">Executive Dashboard</h1>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {periodOptions.map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${period === p ? 'bg-light-secondary text-white dark:bg-dark-secondary' : 'bg-light-card dark:bg-dark-card'}`}>
                            {p}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {MINES.map(mine => (
                        <button key={mine} onClick={() => handleMineToggle(mine)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${selectedMines.includes(mine) ? 'bg-light-primary text-white dark:bg-dark-primary dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-600'}`}>
                            {mine}
                        </button>
                    ))}
                </div>
                {renderTypeFilter()}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mine Performance */}
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Mine Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={minePerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" fontSize={12} tick={{ fill: 'currentColor' }} />
                            <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}/>
                            <Bar dataKey="Incidents" fill="var(--color-primary)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Individual Mine Analysis */}
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Individual Mine Analysis</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMine} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><ChevronLeft size={18} /></button>
                            <span className="text-sm font-semibold w-24 text-center">{selectedMines[pieChartMineIndex] || 'N/A'}</span>
                            <button onClick={nextMine} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={individualMineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                return (
                                    <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}>
                                {individualMineData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Monthly Trend */}
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md lg:col-span-2">
                    <h3 className="font-semibold mb-4">Monthly Trend Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" fontSize={12} tick={{ fill: 'currentColor' }} />
                            <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                            {selectedTypes.map((type, i) => (
                                <Line key={type} type="monotone" dataKey={type} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Incident Hotspots */}
                 <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md lg:col-span-2">
                    <h3 className="font-semibold mb-4">Incident Hotspots (by Section)</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={hotspotData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis type="number" fontSize={12} tick={{ fill: 'currentColor' }} />
                            <YAxis type="category" dataKey="name" width={100} fontSize={12} tick={{ fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}/>
                            <Bar dataKey="Incidents" fill="var(--color-secondary)" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Filter Modal for Small Screens */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                            <h3 className="font-semibold">Filter by Type</h3>
                            <button onClick={() => setIsFilterModalOpen(false)}><XIcon size={20} /></button>
                        </div>
                        <div className="p-4 space-y-2">
                            {INCIDENT_TYPES.map(type => (
                                <label key={type} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => handleTypeToggle(type)}
                                        className="h-4 w-4 rounded border-gray-300 text-light-primary focus:ring-light-primary"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-600">
                             <button onClick={() => setIsFilterModalOpen(false)} className="w-full bg-light-primary text-white dark:bg-dark-primary dark:text-slate-900 py-2 rounded-md font-semibold">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboardPage;
