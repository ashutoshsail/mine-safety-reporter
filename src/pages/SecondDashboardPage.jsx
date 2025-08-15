import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ConfigContext } from '../context/ConfigContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChevronLeft, ChevronRight, Filter, X as XIcon, Smile, Search, Info } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, format, eachMonthOfInterval, subDays } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const chartColors = fullConfig.theme.chart; 

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

const SecondDashboardPage = () => {
    const { incidents } = useContext(AppContext);
    const { MINES, INCIDENT_TYPES } = useContext(ConfigContext);
    const width = useWindowSize();
    const isSmallScreen = width < 768;

    const [period, setPeriod] = useState('Last 6 Months');
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

    const incidentTypeColorMap = useMemo(() => {
        const colorKeys = Object.keys(chartColors);
        return (INCIDENT_TYPES || []).reduce((acc, type, index) => {
            acc[type] = chartColors[colorKeys[index % colorKeys.length]];
            return acc;
        }, {});
    }, [INCIDENT_TYPES]);

    const periodOptions = ['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months'];

    const filteredIncidents = useMemo(() => {
        const today = new Date();
        let dateFrom = new Date(today);
        if (period === 'Last 30 Days') dateFrom = subDays(dateFrom, 30);
        if (period === 'Last 3 Months') dateFrom = subMonths(dateFrom, 3);
        if (period === 'Last 6 Months') dateFrom = subMonths(dateFrom, 6);
        if (period === 'Last 12 Months') dateFrom = subMonths(dateFrom, 12);

        return (incidents || []).filter(inc => {
            const incDate = new Date(inc.date);
            const mineMatch = selectedMines.length === 0 ? true : selectedMines.includes(inc.mine);
            const typeMatch = selectedTypes.length === 0 ? true : selectedTypes.includes(inc.type);
            return incDate >= dateFrom && incDate <= today && mineMatch && typeMatch;
        });
    }, [incidents, period, selectedMines, selectedTypes]);
    
    const individualMineData = useMemo(() => {
        if (!selectedMines || selectedMines.length === 0 || !filteredIncidents) return { chartData: [], totalIncidents: 0, hasNearMiss: false };
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

    const minePerformanceData = useMemo(() => {
        return (MINES || []).map(mine => {
            const mineData = { name: mine };
            (INCIDENT_TYPES || []).forEach(type => {
                mineData[type] = (filteredIncidents || []).filter(inc => inc.mine === mine && inc.type === type).length;
            });
            return mineData;
        });
    }, [filteredIncidents, MINES, INCIDENT_TYPES]);

    const monthlyTrendData = useMemo(() => {
        const today = new Date();
        let startDate = new Date(today);
        if (period === 'Last 30 Days') startDate = subMonths(startDate, 1);
        if (period === 'Last 3 Months') startDate = subMonths(startDate, 3);
        if (period === 'Last 6 Months') startDate = subMonths(startDate, 6);
        if (period === 'Last 12 Months') startDate = subMonths(startDate, 12);
        const months = eachMonthOfInterval({ start: startOfMonth(startDate), end: today });
        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const monthIncidents = (filteredIncidents || []).filter(inc => format(new Date(inc.date), 'MMM yyyy') === monthStr);
            const typesCount = {};
            (INCIDENT_TYPES || []).forEach(type => { typesCount[type] = monthIncidents.filter(inc => inc.type === type).length; });
            return { name: format(month, 'MMM'), ...typesCount };
        });
    }, [filteredIncidents, period, INCIDENT_TYPES]);
    const hotspotData = useMemo(() => {
        const sectionCounts = {};
        (filteredIncidents || []).forEach(inc => { sectionCounts[inc.sectionName] = (sectionCounts[inc.sectionName] || 0) + 1; });
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
            <h1 className="text-2xl font-semibold">Secondary Dashboard</h1>
            {/* Filters and Charts JSX will be identical to the original dashboard */}
            {/* You can customize the layout or charts here as needed */}
        </div>
    );
};

export default SecondDashboardPage;
