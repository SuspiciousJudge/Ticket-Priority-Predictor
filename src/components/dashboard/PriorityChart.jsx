import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import Card from '../common/Card';
import { useStore } from '../../store/useStore';
import { ticketsAPI } from '../../services/api';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function PriorityChart() {
    const { currentTeam } = useStore();

    const { data: statsResponse, isLoading } = useQuery({
        queryKey: ['stats', currentTeam?.id],
        queryFn: () => ticketsAPI.getStats({ team: currentTeam?.id || undefined }).then(res => res.data.data),
    });

    const stats = statsResponse || {};
    const colors = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
    
    const data = stats.byPriority?.map(item => ({
        name: item._id,
        value: item.count,
        color: colors[item._id] || '#6b7280'
    })) || [];

    if (isLoading) {
        return <Card className="p-6 h-[360px]"><LoadingSkeleton count={3} /></Card>;
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const totalValues = data.reduce((sum, item) => sum + item.value, 0);
            return (
                <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payload[0].name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payload[0].value} tickets ({totalValues > 0 ? ((payload[0].value / totalValues) * 100).toFixed(1) : 0}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);

        return (
            <div className="grid grid-cols-2 gap-3 mt-4">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {entry.value}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {data[index].value} ({total > 0 ? ((data[index].value / total) * 100).toFixed(1) : 0}%)
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Priority Distribution
            </h3>

            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-500">
                    No data available
                </div>
            )}
        </Card>
    );
}
