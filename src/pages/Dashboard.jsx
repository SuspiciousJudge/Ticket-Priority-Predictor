import { Inbox, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../components/dashboard/StatCard';
import PriorityChart from '../components/dashboard/PriorityChart';
import RecentTicketsTable from '../components/dashboard/RecentTicketsTable';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import TrendingCarousel from '../components/dashboard/TrendingCarousel';
import QuickActions from '../components/dashboard/QuickActions';
import { useStore } from '../store/useStore';
import { ticketsAPI } from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function Dashboard() {
    const { currentTeam } = useStore();

    const { data: statsResponse, isLoading, isError } = useQuery({
        queryKey: ['stats', currentTeam?.id],
        queryFn: () => ticketsAPI.getStats({ team: currentTeam?.id || undefined }).then(res => res.data.data),
        retry: 1,
    });

    const stats = statsResponse || {};
    const totalTickets = stats.total || 0;
    const criticalTickets = stats.byPriority?.find(p => p._id === 'Critical')?.count || 0;
    const resolvedToday = stats.todaysResolved || 0;
    const avgResponseTime = stats.avgResolution ? `${stats.avgResolution.toFixed(1)}h` : 'N/A';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {currentTeam ? `${currentTeam.name} team` : 'All teams'} — Here's what's happening with your tickets today.
                </p>
            </div>

            {/* Stat Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-soft">
                            <LoadingSkeleton variant="text" className="mb-3" />
                            <LoadingSkeleton variant="title" className="mb-2" />
                            <LoadingSkeleton variant="text" className="w-1/2" />
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-700 dark:text-amber-300 font-medium">Couldn't load stats</p>
                    <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">Make sure the backend server is running on port 5000</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Tickets" value={totalTickets} icon={Inbox} gradient="bg-gradient-primary" trend="up" trendValue="12%" delay={0} />
                    <StatCard title="Critical Priority" value={criticalTickets} icon={AlertTriangle} gradient="bg-gradient-danger" trend="down" trendValue="8%" delay={0.1} />
                    <StatCard title="Resolved Today" value={resolvedToday} icon={CheckCircle} gradient="bg-gradient-success" trend="up" trendValue="24%" delay={0.2} />
                    <StatCard title="Avg Response Time" value={avgResponseTime} icon={Clock} gradient="bg-gradient-secondary" trend="down" trendValue="15%" delay={0.3} />
                </div>
            )}

            {/* Quick Actions — always visible */}
            <QuickActions />

            {/* Trending Carousel */}
            <TrendingCarousel />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentTicketsTable />
                </div>
                <div className="space-y-6">
                    <PriorityChart />
                    <ActivityTimeline />
                </div>
            </div>
        </div>
    );
}
