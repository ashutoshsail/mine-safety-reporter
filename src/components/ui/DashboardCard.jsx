// File: src/components/ui/DashboardCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * A memoized component for displaying a single KPI card on the dashboard.
 * This component is a reusable UI element that adapts to its content and screen size.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the KPI.
 * @param {string|number} props.value - The main value to display.
 * @param {number} [props.change=0] - The percentage change from the previous period.
 * @param {'good'|'bad'|'neutral'} [props.changeType='neutral'] - The type of change, used for coloring.
 * @returns {JSX.Element} The rendered KPI card.
 */
const DashboardCard = React.memo(({ title, value, change = 0, changeType = 'neutral' }) => {
    const isPositive = changeType === 'good';
    const isNegative = changeType === 'bad';

    const Icon = isPositive ? TrendingUp : TrendingDown;
    const iconColorClass = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500';

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex-1 text-center">
            <h4 className="text-sm font-medium text-light-subtle-text dark:text-dark-subtle-text">{title}</h4>
            <p className="text-3xl font-bold my-1 text-light-text dark:text-dark-text">{value}</p>
            {change !== 0 && (
                <div className={`flex items-center justify-center text-sm font-semibold ${iconColorClass}`}>
                    <Icon size={16} />
                    <span className="ml-1">{Math.abs(change)}% vs prev. period</span>
                </div>
            )}
        </div>
    );
});

export default DashboardCard;
