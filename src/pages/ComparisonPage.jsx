import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus, AlertTriangle, Shield, HeartPulse, Skull } from 'lucide-react';

const kpiIcons = {
    'Total Incidents': AlertTriangle,
    'Lost Time Injury (LTI)': Shield,
    'First Aid': HeartPulse,
    'Fatality': Skull,
};

const ComparisonPage = () => {
    const { incidents, MINES, INCIDENT_TYPES, currentDate } = useContext(AppContext);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'Custom Range'];

    const [periodA, setPeriodA] = useState({ type: 'Last 3 Months', start: null, end: null });
    const [periodB, setPeriodB] = useState({ type: 'Last 12 Months', start: null, end: null });
    const [modalData, setModalData] = useState({ isOpen: false, title: '', periodA: [], periodB: [] });

    const getDateRange = (period) => {
        const end = period.end ? new Date(period.end) : new Date(currentDate);
        let start = period.start ? new Date(period.start) : new Date(currentDate);

        if (period.type !== 'Custom Range') {
             switch (period.type) {
                case 'Last 30 Days': start.setDate(start.getDate() - 30); break;
                case 'Last 3 Months': start.setMonth(start.getMonth() - 3); break;
                case 'Last 6 Months': start.setMonth(start.getMonth() - 6); break;
                case 'Last 12 Months': start.setMonth(start.getMonth() - 12); break;
                default: break;
            }
        }
        return { start, end };
    };

    const incidentsA = useMemo(() => {
        const { start, end } = getDateRange(periodA);
        return incidents.filter(inc => new Date(inc.date) >= start && new Date(inc.date) <= end);
    }, [incidents, periodA]);

    const incidentsB = useMemo(() => {
        const { start, end } = getDateRange(periodB);
        return incidents.filter(inc => new Date(inc.date) >= start && new Date(inc.date) <= end);
    }, [incidents, periodB]);

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
    }, [incidentsA, incidentsB]);
    
    const chartData = useMemo(() => {
        return MINES.map(mine => {
            const data = { mine };
            INCIDENT_TYPES.forEach(type => {
                data[`A_${type}`] = incidentsA.filter(i => i.mine === mine && i.type === type).length;
                data[`B_${type}`] = incidentsB.filter(i => i.mine === mine && i.type === type).length;
            });
            return data;
        });
    }, [incidentsA, incidentsB]);
    
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
            <label className="font-semibold">{label}</label>
            <select
                value={period.type}
                onChange={(e) => handlePeriodChange(setPeriod, 'type', e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
            >
                {periodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {period.type === 'Custom Range' && (
                <div className="flex gap-2">
                    <input
                        type="date"
                        onChange={(e) => handlePeriodChange(setPeriod, 'start', e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
                    />
                    <input
                        type="date"
                        onChange={(e) => handlePeriodChange(setPeriod, 'end', e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600"
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold text-light-text dark:text-dark-text">Period Comparison</h1>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md">
                <PeriodSelector label="Period A" period={periodA} setPeriod={setPeriodA} />
                <PeriodSelector label="Period B (for comparison)" period={periodB} setPeriod={setPeriodB} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiData.map(kpi => {
                    const Icon = kpiIcons[kpi.name] || AlertTriangle;
                    return (
                        <div key={kpi.name} onClick={() => openModal(kpi)} className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-light-subtle-text dark:text-dark-subtle-text">{kpi.name}</h4>
                                <Icon className="text-light-subtle-text dark:text-dark-subtle-text" />
                            </div>
                            <p className="text-3xl font-bold my-2">{kpi.countA}</p>
                            <div className={`flex items-center text-sm ${kpi.changeType === 'increase' ? 'text-red-500' : kpi.changeType === 'decrease' ? 'text-green-500' : 'text-slate-500'}`}>
                                {kpi.changeType === 'increase' && <ArrowUpRight size={16} />}
                                {kpi.changeType === 'decrease' && <ArrowDownRight size={16} />}
                                {kpi.changeType === 'same' && <Minus size={16} />}
                                <span className="ml-1">{Math.abs(kpi.change)} vs Period B ({kpi.countB})</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Stacked Bar Chart */}
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-4">Incidents by Type and Mine</h3>
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="mine" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: "12px"}} />
                        <Bar dataKey="A_Lost Time Injury (LTI)" stackId="a" fill="#d0021b" name="Period A - LTI" />
                        <Bar dataKey="A_First Aid" stackId="a" fill="#f5a623" name="Period A - First Aid" />
                        <Bar dataKey="A_Fatality" stackId="a" fill="#000000" name="Period A - Fatality" />
                        <Bar dataKey="B_Lost Time Injury (LTI)" stackId="b" fill="#7ed321" name="Period B - LTI" />
                        <Bar dataKey="B_First Aid" stackId="b" fill="#4a90e2" name="Period B - First Aid" />
                        <Bar dataKey="B_Fatality" stackId="b" fill="#50e3c2" name="Period B - Fatality" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Modal */}
            {modalData.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{modalData.title}</h3>
                            <button onClick={() => setModalData({ isOpen: false })}>&times;</button>
                        </div>
                        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Period A Incidents ({modalData.periodA.length})</h4>
                                <ul className="text-sm space-y-1">
                                    {modalData.periodA.map(inc => <li key={inc.id} className="bg-slate-100 dark:bg-slate-800 p-1 rounded">{inc.id}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Period B Incidents ({modalData.periodB.length})</h4>
                                <ul className="text-sm space-y-1">
                                    {modalData.periodB.map(inc => <li key={inc.id} className="bg-slate-100 dark:bg-slate-800 p-1 rounded">{inc.id}</li>)}
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
