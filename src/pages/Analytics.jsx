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
import Badge from '../components/common/Badge';
import { useStore } from '../store/useStore';
import { ticketsAPI } from '../services/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function safeIsoDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
}

function getRangeDays(range) {
    if (range === '7d') return 7;
    if (range === '30d') return 30;
    if (range === '90d') return 90;
    return null;
}

function buildAnalyticsFromTickets(tickets = [], dateRange = 'all') {
    const now = new Date();
    const days = getRangeDays(dateRange);
    const filtered = tickets.filter((t) => {
        if (!days) return true;
        const created = new Date(t.createdAt || Date.now());
        const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= days;
    });

    const byPriorityMap = new Map();
    const byStatusMap = new Map();
    const byCategoryMap = new Map();
    const ticketsOverTimeMap = new Map();

    for (const t of filtered) {
        const priority = t.priority || 'Medium';
        const status = t.status || 'Open';
        const category = t.category || 'Support';
        const dateKey = safeIsoDate(t.createdAt || Date.now());

        byPriorityMap.set(priority, asNumber(byPriorityMap.get(priority), 0) + 1);
        byStatusMap.set(status, asNumber(byStatusMap.get(status), 0) + 1);
        byCategoryMap.set(category, asNumber(byCategoryMap.get(category), 0) + 1);

        const existing = ticketsOverTimeMap.get(dateKey) || { date: dateKey, open: 0, resolved: 0 };
        if (status === 'Resolved' || status === 'Closed') existing.resolved += 1;
        else existing.open += 1;
        ticketsOverTimeMap.set(dateKey, existing);
    }

    const byPriority = Array.from(byPriorityMap.entries()).map(([k, v]) => ({ _id: k, count: v }));
    const byStatus = Array.from(byStatusMap.entries()).map(([k, v]) => ({ _id: k, count: v }));
    const byCategory = Array.from(byCategoryMap.entries()).map(([k, v]) => ({ _id: k, count: v }));
    const ticketsOverTime = Array.from(ticketsOverTimeMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const openCount = byStatus.find((x) => x._id === 'Open')?.count || 0;
    const inProgressCount = byStatus.find((x) => x._id === 'In Progress')?.count || 0;
    const resolvedCount = byStatus.find((x) => x._id === 'Resolved')?.count || 0;
    const closedCount = byStatus.find((x) => x._id === 'Closed')?.count || 0;

    return {
        total: filtered.length,
        byPriority,
        byStatus,
        byCategory,
        avgResolution: 0,
        ticketsOverTime,
        resolutionRateTrend: [],
        heatmapData: [],
        funnelData: [
            { stage: 'Open', value: openCount, fill: '#3b82f6' },
            { stage: 'In Progress', value: inProgressCount, fill: '#8b5cf6' },
            { stage: 'Resolved', value: resolvedCount, fill: '#10b981' },
            { stage: 'Closed', value: closedCount, fill: '#14b8a6' },
        ],
    };
}

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

    const { data: statsResponse, isLoading, isError } = useQuery({
        queryKey: ['stats', currentTeam?.id],
        queryFn: () => ticketsAPI.getStats({ team: currentTeam?.id || undefined }),
        retry: 2,
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
    });

    const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery({
        queryKey: ['tickets', 'analytics-fallback', currentTeam?.id],
        queryFn: () => ticketsAPI.getAll({ team: currentTeam?.id || undefined, limit: 1000 }).then((res) => res.data.data),
        retry: 1,
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
    });

    let stats = {};
    try {
        const apiStats = statsResponse?.data?.data;
        const fallbackStats = buildAnalyticsFromTickets(ticketsResponse?.tickets || [], dateRange);
        const hasApiStatsData = apiStats && ((apiStats.total || 0) > 0 || (apiStats.byPriority?.length || 0) > 0 || (apiStats.byStatus?.length || 0) > 0);
        stats = hasApiStatsData ? apiStats : fallbackStats;
    } catch (e) {
        console.error('Analytics data normalization failed:', e);
        stats = buildAnalyticsFromTickets([], dateRange);
    }

    const totalTickets = asNumber(stats?.total, 0);
    const resolvedObj = stats?.byStatus?.find(s => s?._id === 'Resolved' || s?._id === 'Closed');
    const resolvedTickets = asNumber(resolvedObj?.count, 0);
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const categoryData = (stats?.byCategory || []).map(c => ({
        category: c._id || 'Uncategorized',
        count: asNumber(c.count, 0),
        fill: CHART_COLORS[c._id] || '#667eea'
    }));

    const priorityData = (stats?.byPriority || []).map(p => ({
        name: p._id || 'Unknown',
        value: asNumber(p.count, 0),
        color: CHART_COLORS[p._id] || '#6b7280'
    }));

    const ticketsOverTime = Array.isArray(stats?.ticketsOverTime) ? stats.ticketsOverTime : [];
    const resolutionRateTrend = Array.isArray(stats?.resolutionRateTrend) ? stats.resolutionRateTrend : [];
    const heatmapData = Array.isArray(stats?.heatmapData) ? stats.heatmapData : [];
    const funnelData = Array.isArray(stats?.funnelData) ? stats.funnelData : [];

    const handleExport = async () => {
        try {
            const toastId = toast.loading('Preparing executive snapshot...');
            const res = await ticketsAPI.exportExecutiveSnapshot();
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'executive-snapshot.pdf';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Executive snapshot exported', { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error('Export failed');
        }
    };

    const slaRisk = stats?.slaRisk || { breached: 0, atRisk: 0, warning: 0 };
    const triageQueue = Array.isArray(stats?.triageQueue) ? stats.triageQueue : [];
    const reopenByCategory = Array.isArray(stats?.reopenByCategory) ? stats.reopenByCategory : [];
    const priorityOverrideStats = stats?.priorityOverrideStats || { totalOverrides: 0, ticketsWithOverrides: 0 };
    const workloadByAgent = Array.isArray(stats?.workloadByAgent) ? stats.workloadByAgent : [];
    const agentPerformance = Array.isArray(stats?.agentPerformance) ? stats.agentPerformance : [];

    if (isLoading && ticketsLoading) {
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400">{currentTeam ? `${currentTeam.name} team` : 'All teams'} — Insights and metrics</p>
                    {isError && (
                        <p className="text-xs text-amber-600 mt-1">Stats API is temporarily unavailable. Showing live fallback from ticket list.</p>
                    )}
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
                    { label: 'Total Tickets', value: totalTickets, icon: Ticket, trend: '+12%', up: true, gradient: 'bg-gradient-primary' },
                    { label: 'Resolved', value: resolvedTickets, icon: CheckCircle, trend: '+24%', up: true, gradient: 'bg-gradient-success' },
                    { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: TrendingUp, trend: '+5%', up: true, gradient: 'bg-gradient-secondary' },
                    { label: 'Avg Resolution Time', value: `${Math.round(stats?.avgResolution || 0)}h`, icon: Clock, trend: '-3%', up: true, gradient: 'bg-gradient-warning' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                        {stat.up ? <TrendingUp className="w-3.5 h-3.5 text-success-600" /> : <TrendingDown className="w-3.5 h-3.5 text-danger-600" />}
                                        <span className={cn('text-xs font-medium', stat.up ? 'text-success-600' : 'text-danger-600')}>{stat.trend}</span>
                                        <span className="text-xs text-gray-500">vs last period</span>
                                    </div>
                                </div>
                                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.gradient)}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* SLA Risk + Override Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SLA Risk Predictor</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20">
                            <span className="text-sm font-medium text-danger-700">Breached</span>
                            <span className="text-xl font-bold text-danger-700">{slaRisk.breached || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                            <span className="text-sm font-medium text-orange-700">At Risk (2h)</span>
                            <span className="text-xl font-bold text-orange-700">{slaRisk.atRisk || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                            <span className="text-sm font-medium text-yellow-700">Warning (8h)</span>
                            <span className="text-xl font-bold text-yellow-700">{slaRisk.warning || 0}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Auto-Triage Queue</h3>
                    {triageQueue.length === 0 ? (
                        <p className="text-sm text-gray-500">No unassigned open tickets in triage queue.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {triageQueue.map((t) => (
                                <div key={t._id || t.ticketId} className="p-3 border border-gray-200 dark:border-dark-border rounded-lg flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.title}</p>
                                        <p className="text-xs text-gray-500">{t.ticketId} | {t.category || 'Support'}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge type="priority" value={t.priority}>{t.priority}</Badge>
                                        <p className="text-xs text-gray-500 mt-1">Impact {t.impactScore || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tickets Over Time */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tickets Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={ticketsOverTime}>
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
                        <LineChart data={resolutionRateTrend}>
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
                <HeatmapChart data={heatmapData} />
            </Card>

            {/* Funnel Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Resolution Workflow Funnel</h3>
                <FunnelChart data={funnelData} />
            </Card>

            {/* Workload + Agent Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Team Workload Heatmap</h3>
                    {workloadByAgent.length === 0 ? (
                        <p className="text-sm text-gray-500">No assigned open tickets yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {workloadByAgent.map((a) => {
                                const intensity = Math.min(100, a.weightedLoad * 8);
                                return (
                                    <div key={String(a.assigneeId)}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{a.assigneeName}</span>
                                            <span className="text-gray-500">Load {a.weightedLoad} | Open {a.openCount}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
                                            <div className="h-full bg-gradient-danger" style={{ width: `${intensity}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Agent Performance Cards</h3>
                    {agentPerformance.length === 0 ? (
                        <p className="text-sm text-gray-500">No agent performance data available.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {agentPerformance.slice(0, 6).map((a) => (
                                <div key={String(a.assigneeId)} className="p-3 rounded-lg border border-gray-200 dark:border-dark-border">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.assigneeName}</p>
                                        <span className="text-xs text-gray-500">{a.resolutionRate}% resolution rate</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                        <span>Resolved: {a.resolved}</span>
                                        <span>Open: {a.open}</span>
                                        <span>Avg MTTR: {Math.round(a.avgResolution || 0)}h</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Reopen and override analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reopen Analytics</h3>
                    {reopenByCategory.length === 0 ? (
                        <p className="text-sm text-gray-500">No reopened ticket patterns yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {reopenByCategory.map((r) => (
                                <div key={r._id || 'unknown'} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-border/30">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r._id || 'Uncategorized'}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{r.totalReopens} reopens</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Priority Override Audit</h3>
                    <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Overrides</p>
                            <p className="text-2xl font-bold text-primary-700">{priorityOverrideStats.totalOverrides || 0}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-border/30">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tickets With Override</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{priorityOverrideStats.ticketsWithOverrides || 0}</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function HeatmapChart({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500">No heatmap data available yet.</p>;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const maxValue = Math.max(...data.map(d => d.value), 1);

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
    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500">No funnel data available yet.</p>;
    }

    const maxValue = data[0]?.value || 1;

    return (
        <div className="space-y-3 max-w-2xl mx-auto">
            {data.map((stage, index) => {
                const current = asNumber(stage?.value, 0);
                const prev = index > 0 ? asNumber(data[index - 1]?.value, 0) : 0;
                const widthPercent = maxValue > 0 ? (current / maxValue) * 100 : 0;
                const dropOff = index > 0 && prev > 0 ? Math.round(((prev - current) / prev) * 100) : 0;

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
                                    <span className="text-xs font-bold text-white">{current}</span>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
