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
        queryFn: () => ticketsAPI.getStats().then(res => res.data.data),
        retry: 1,
    });

    const stats = statsResponse || {};
    const totalTickets    = stats.total || 0;
    const criticalTickets = stats.byPriority?.find(p => p._id === 'Critical')?.count || 0;
    const resolvedToday   = stats.todaysResolved || 0;
    const avgResponseTime = stats.avgResolution ? `${stats.avgResolution.toFixed(1)}h` : 'N/A';

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {currentTeam ? currentTeam.name : 'All teams'} · Here&apos;s what&apos;s happening today
                </p>
            </div>

            {/* Stat cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <LoadingSkeleton variant="text" className="mb-3 w-1/2" />
                            <LoadingSkeleton variant="title" className="mb-2" />
                            <LoadingSkeleton variant="text" className="w-1/3" />
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-amber-700 font-medium">
                        Couldn&apos;t load stats — make sure the backend is running on port 5000
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Tickets"     value={totalTickets}    icon={Inbox}         gradient="bg-gradient-primary"   trend="up"   trendValue="12%" delay={0}   />
                    <StatCard title="Critical Priority" value={criticalTickets} icon={AlertTriangle} gradient="bg-gradient-danger"    trend="down" trendValue="8%"  delay={0.08}/>
                    <StatCard title="Resolved Today"    value={resolvedToday}   icon={CheckCircle}   gradient="bg-gradient-success"   trend="up"   trendValue="24%" delay={0.16}/>
                    <StatCard title="Avg Response Time" value={avgResponseTime} icon={Clock}         gradient="bg-gradient-secondary" trend="down" trendValue="15%" delay={0.24}/>
                </div>
            )}

            {/* Quick actions */}
            <QuickActions />

            {/* Trending tickets */}
            <TrendingCarousel />

            {/* Main content grid */}
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
