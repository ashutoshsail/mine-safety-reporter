import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus, AlertTriangle, Shield, HeartPulse, Skull, X } from 'lucide-react';
import { subDays, subMonths, startOfDay, endOfDay, format, startOfYear, endOfYear, startOfMonth } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const kpiIcons = {
    'Total Incidents': AlertTriangle,
    'Lost Time Injury (LTI)': Shield,
    'First Aid': HeartPulse,
    'Fatality': Skull,
};

const ComparisonPage = () => {
    const { incidents, currentDate } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);

    // CRITICAL FIX: Move theme config resolution inside the component and memoize it.
    const chartColors = useMemo(() => {
        const fullConfig = resolveConfig(tailwindConfig);
        return fullConfig.theme.colors.chart || {};
    }, []);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'Custom Range'];

    const [periodA, setPeriodA] = useState({ type: 'Last 3 Months', start: '', end: '' });
    const [periodB, setPeriodB] = useState({ type: 'Last 12 Months', start: '', end: '' });
    const [modalData, setModalData] = useState({ isOpen: false, title: '', periodA: [], periodB: [] });

    const getDateRange = (period) => {
        const baseDate = currentDate ? new Date(currentDate) : new Date();
        if (period.type === 'Custom Range') {
            const start = period.start ? startOfDay(new Date(period.start)) : null;
            const end = period.end ? endOfDay(new Date(period.end)) : null;
            return { start, end };
        }
        
        let start;
        switch (period.type) {
            case 'Last 30 Days': start = subDays(baseDate, 30); break;
            case 'Last 3 Months': start = subMonths(baseDate, 3); break;
            case 'Last 6 Months': start = subMonths(baseDate, 6); break;
            case 'Last 12 Months': start = subMonths(baseDate, 12); break;
            default: start = subMonths(baseDate, 3);
        }
        return { start: startOfDay(start), end: endOfDay(baseDate) };
    };

    const incidentsA = useMemo(() => {
        const { start, end } = getDateRange(periodA);
        if (!start || !end) return [];
        return (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= start && incDate <= end;
        });
    }, [incidents, periodA, currentDate]);

    const incidentsB = useMemo(() => {
        const { start, end } = getDateRange(periodB);
        if (!start || !end) return [];
        return (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            return incDate >= start && incDate <= end;
        });
    }, [incidents, periodB, currentDate]);

    const handlePeriodChange = (periodSetter, field, value) => {
        periodSetter(prev => ({ ...prev, [field]: value }));
    };

    const kpiData = useMemo(() => {
        const kpis = ['Total Incidents', ...INCIDENT_TYPES];
        return kpis.map(kpi => {
            const countA = kpi === 'Total Incidents' ? incidentsA.length : incidentsA.filter(i => i.type === kpi).length;
            const countB = kpi === 'Total Incidents' ? incidentsB.length : incidentsB.filter(i => i.type === kpi).length;
            const change = countA - countB;
            const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same';
            return { name: kpi, countA, countB, change, changeType };
        }).filter(kpi => kpi.name !== 'Reportable' && kpi.name !== 'Near Miss' && kpi.name !== 'High Potential Incident');
    }, [incidentsA, incidentsB, INCIDENT_TYPES]);
    
    const chartData = useMemo(() => {
        return (MINES || []).map(mine => {
            const data = { mine };
            (INCIDENT_TYPES || []).forEach(type => {
                data[`A_${type}`] = incidentsA.filter(i => i.mine === mine && i.type === type).length;
                data[`B_${type}`] = incidentsB.filter(i => i.mine === mine && i.type === type).length;
            });
            return data;
        });
    }, [incidentsA, incidentsB, MINES, INCIDENT_TYPES]);
    
    const openModal = (kpi) => {
        const periodAIncidents = kpi.name === 'Total Incidents' ? incidentsA : incidentsA.filter(i => i.type === kpi.name);
        const periodBIncidents = kpi.name === 'Total Incidents' ? incidentsB : incidentsB.filter(i => i.type === kpi.name);
        setModalData({
            isOpen: true,
            title: `${kpi.name} Details`,
            periodA: periodAIncidents,
            periodB: periodBIncidents,
        });
    };

    const PeriodSelector = ({ label, period, setPeriod }) => (
        <div className="space-y-2">
            <label className="font-semibold text-sm">{label}</label>
            <select
                value={period.type}
                onChange={(e) => handlePeriodChange(setPeriod, 'type', e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-light-border dark:border-dark-border text-sm"
            >
                {periodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {period.type === 'Custom Range' && (
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={period.start}
                        onChange={(e) => handlePeriodChange(setPeriod, 'start', e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-light-border dark:border-dark-border text-sm"
                    />
                    <input
                        type="date"
                        value={period.end}
                        onChange={(e) => handlePeriodChange(setPeriod, 'end', e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-light-border dark:border-dark-border text-sm"
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Period Comparison</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <PeriodSelector label="Period A" period={periodA} setPeriod={setPeriodA} />
                <PeriodSelector label="Period B (for comparison)" period={periodB} setPeriod={setPeriodB} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiData.map(kpi => {
                    const Icon = kpiIcons[kpi.name] || AlertTriangle;
                    return (
                        <div key={kpi.name} onClick={() => openModal(kpi)} className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm text-light-subtle-text dark:text-dark-subtle-text">{kpi.name}</h4>
                                <Icon size={16} className="text-light-subtle-text dark:text-dark-subtle-text" />
                            </div>
                            <p className="text-2xl font-semibold my-1">{kpi.countA}</p>
                            <div className={`flex items-center text-xs ${kpi.changeType === 'increase' ? 'text-light-status-danger' : kpi.changeType === 'decrease' ? 'text-light-status-success' : 'text-slate-500'}`}>
                                {kpi.changeType === 'increase' && <ArrowUpRight size={14} />}
                                {kpi.changeType === 'decrease' && <ArrowDownRight size={14} />}
                                {kpi.changeType === 'same' && <Minus size={14} />}
                                <span className="ml-1">{Math.abs(kpi.change)} vs Period B ({kpi.countB})</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg shadow-md">
                <h3 className="font-semibold mb-2 text-base">Incidents by Type and Mine</h3>
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="mine" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: "10px"}}/>
                        <Bar dataKey="A_Lost Time Injury (LTI)" stackId="a" fill={chartColors.red} name="Period A - LTI" />
                        <Bar dataKey="A_First Aid" stackId="a" fill={chartColors.yellow} name="Period A - First Aid" />
                        <Bar dataKey="A_Fatality" stackId="a" fill="#000000" name="Period A - Fatality" />
                        <Bar dataKey="B_Lost Time Injury (LTI)" stackId="b" fill={chartColors.green} name="Period B - LTI" />
                        <Bar dataKey="B_First Aid" stackId="b" fill={chartColors.blue} name="Period B - First Aid" />
                        <Bar dataKey="B_Fatality" stackId="b" fill={chartColors.purple} name="Period B - Fatality" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {modalData.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{modalData.title}</h3>
                            <button onClick={() => setModalData({ isOpen: false, title: '', periodA: [], periodB: [] })}><X size={20}/></button>
                        </div>
                        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Period A Incidents ({modalData.periodA.length})</h4>
                                <ul className="text-sm space-y-1 max-h-96 overflow-y-auto">
                                    {modalData.periodA.map(inc => <li key={inc.id} className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-xs">{inc.id}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Period B Incidents ({modalData.periodB.length})</h4>
                                <ul className="text-sm space-y-1 max-h-96 overflow-y-auto">
                                    {modalData.periodB.map(inc => <li key={inc.id} className="bg-slate-100 dark:bg-slate-800 p-1 rounded text-xs">{inc.id}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonPage;
