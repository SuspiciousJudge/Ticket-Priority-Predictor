import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, Ticket, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { mockAnalyticsData } from '../data/mockData';
import { useStore } from '../store/useStore';
import { ticketsAPI } from '../services/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const dateRanges = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CHART_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
    Bug: '#ef4444',
    Feature: '#3b82f6',
    Enhancement: '#8b5cf6',
    Support: '#10b981',
    Security: '#f97316',
};

export default function Analytics() {
    const [dateRange, setDateRange] = useState('7d');
    const { currentTeam } = useStore();

    const { data: statsResponse, isLoading } = useQuery({
        queryKey: ['stats', currentTeam?.id],
        queryFn: ticketsAPI.getStats,
    });

    const stats = statsResponse?.data;

    const totalTickets = stats?.total || 0;
    const resolvedObj = stats?.byStatus?.find(s => s._id === 'Resolved' || s._id === 'Closed');
    const resolvedTickets = resolvedObj ? resolvedObj.count : 0;
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const categoryData = stats?.byCategory?.map(c => ({
        category: c._id || 'Uncategorized',
        count: c.count,
        fill: CHART_COLORS[c._id] || '#667eea'
    })) || mockAnalyticsData.ticketsByCategory;

    const priorityData = stats?.byPriority?.map(p => ({
        name: p._id || 'Unknown',
        value: p.count,
        color: CHART_COLORS[p._id] || '#6b7280'
    })) || mockAnalyticsData.priorityDistribution;

    const handleExport = () => {
        toast.success('Analytics report exported!');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-gray-500">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{currentTeam ? `${currentTeam.name}` : 'All teams'} · Insights and metrics</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-gray-100 dark:bg-dark-border rounded-lg p-1">
                        {dateRanges.map(range => (
                            <button key={range.value} onClick={() => setDateRange(range.value)}
                                className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                                    dateRange === range.value ? 'bg-white dark:bg-dark-surface shadow-sm text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900')}>
                                {range.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" icon={Download} onClick={handleExport}>Export</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tickets',       value: totalTickets,                           icon: Ticket,      iconBg: 'bg-orange-50',  iconColor: 'text-orange-500',  trend: '+12%', up: true  },
                    { label: 'Resolved',            value: resolvedTickets,                        icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', trend: '+24%', up: true  },
                    { label: 'Resolution Rate',     value: `${resolutionRate}%`,                   icon: TrendingUp,  iconBg: 'bg-sky-50',     iconColor: 'text-sky-500',     trend: '+5%',  up: true  },
                    { label: 'Avg Resolution Time', value: `${Math.round(stats?.avgResolution || 0)}h`, icon: Clock,  iconBg: 'bg-amber-50',   iconColor: 'text-amber-500',   trend: '-3%',  up: false },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <div className={cn('p-2 rounded-lg', stat.iconBg)}>
                                    <stat.icon className={cn('w-4 h-4', stat.iconColor)} />
                                </div>
                            </div>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{stat.value}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                {stat.up ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                <span className={cn('text-xs font-medium', stat.up ? 'text-emerald-600' : 'text-red-500')}>{stat.trend}</span>
                                <span className="text-xs text-gray-400">vs last period</span>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tickets Over Time */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tickets Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mockAnalyticsData.ticketsOverTime}>
                            <defs>
                                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="open" stroke="#667eea" strokeWidth={2} fill="url(#colorOpen)" name="Open" />
                            <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#colorResolved)" name="Resolved" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Tickets by Category */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tickets by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Tickets" radius={[8, 8, 0, 0]}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Priority Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Priority Distribution</h3>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const total = priorityData.reduce((s, i) => s + i.value, 0) || 1;
                                        return (
                                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
                                                <p className="text-sm font-medium" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                                                <p className="text-xs text-gray-600">{payload[0].value} tickets ({((payload[0].value / total) * 100).toFixed(1)}%)</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        {priorityData.map((item) => (
                            <div key={item.name} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Resolution Rate Trend */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Resolution Rate Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mockAnalyticsData.resolutionRate}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} domain={[60, 100]} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="rate" stroke="#667eea" strokeWidth={3} dot={{ fill: '#667eea', r: 5 }}
                                activeDot={{ r: 7, fill: '#667eea', stroke: '#fff', strokeWidth: 2 }} name="Resolution Rate %" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Heatmap */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Peak Hours Heatmap</h3>
                <HeatmapChart data={mockAnalyticsData.heatmapData} />
            </Card>

            {/* Funnel Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Resolution Workflow Funnel</h3>
                <FunnelChart data={mockAnalyticsData.funnelData} />
            </Card>
        </div>
    );
}

function HeatmapChart({ data }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const maxValue = Math.max(...data.map(d => d.value));

    const getColor = (value) => {
        const intensity = value / maxValue;
        if (intensity < 0.25) return 'bg-primary-100 dark:bg-primary-900/30';
        if (intensity < 0.5) return 'bg-primary-300 dark:bg-primary-700/50';
        if (intensity < 0.75) return 'bg-primary-500 dark:bg-primary-600/70';
        return 'bg-primary-700 dark:bg-primary-500';
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${hours.length}, 1fr)` }}>
                    <div />
                    {hours.map(h => (
                        <div key={h} className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-2">{h}</div>
                    ))}
                    {days.map(day => (
                        <React.Fragment key={day}>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center pr-3 justify-end">{day}</div>
                            {hours.map(hour => {
                                const cell = data.find(d => d.day === day && d.hour === hour);
                                return (
                                    <motion.div
                                        key={`${day}-${hour}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: Math.random() * 0.3 }}
                                        className={cn('rounded-md h-10 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all', getColor(cell?.value || 0))}
                                        title={`${day} ${hour}: ${cell?.value || 0} tickets`}
                                    >
                                        <span className="text-xs font-medium text-white/80">{cell?.value || 0}</span>
                                    </motion.div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center justify-end space-x-2 mt-4">
                    <span className="text-xs text-gray-500">Less</span>
                    {['bg-primary-100', 'bg-primary-300', 'bg-primary-500', 'bg-primary-700'].map(c => (
                        <div key={c} className={cn('w-5 h-5 rounded', c)} />
                    ))}
                    <span className="text-xs text-gray-500">More</span>
                </div>
            </div>
        </div>
    );
}

function FunnelChart({ data }) {
    const maxValue = data[0]?.value || 1;

    return (
        <div className="space-y-3 max-w-2xl mx-auto">
            {data.map((stage, index) => {
                const widthPercent = (stage.value / maxValue) * 100;
                const dropOff = index > 0 ? Math.round(((data[index - 1].value - stage.value) / data[index - 1].value) * 100) : 0;

                return (
                    <motion.div key={stage.stage} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4">
                        <div className="w-24 text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{stage.stage}</p>
                            {dropOff > 0 && <p className="text-xs text-danger-500">-{dropOff}%</p>}
                        </div>
                        <div className="flex-1">
                            <div className="relative h-10 bg-gray-100 dark:bg-dark-border rounded-lg overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercent}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.15, ease: 'easeOut' }}
                                    className="h-full rounded-lg flex items-center justify-end pr-3"
                                    style={{ backgroundColor: stage.fill }}
                                >
                                    <span className="text-xs font-bold text-white">{stage.value}</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
