import { Inbox, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import PriorityChart from '../components/dashboard/PriorityChart';
import RecentTicketsTable from '../components/dashboard/RecentTicketsTable';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import TrendingCarousel from '../components/dashboard/TrendingCarousel';
import QuickActions from '../components/dashboard/QuickActions';
import { useStore } from '../store/useStore';

export default function Dashboard() {
    const { getTeamTickets, currentTeam } = useStore();
    const teamTickets = getTeamTickets();

    const totalTickets = teamTickets.length;
    const criticalTickets = teamTickets.filter((t) => t.priority === 'Critical').length;
    const resolvedToday = teamTickets.filter((t) => {
        const today = new Date();
        const updatedDate = new Date(t.updatedAt);
        return t.status === 'Resolved' &&
            updatedDate.toDateString() === today.toDateString();
    }).length;
    const avgResponseTime = '4.2h';

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Tickets" value={totalTickets} icon={Inbox} gradient="bg-gradient-primary" trend="up" trendValue="12%" delay={0} />
                <StatCard title="Critical Priority" value={criticalTickets} icon={AlertTriangle} gradient="bg-gradient-danger" trend="down" trendValue="8%" delay={0.1} />
                <StatCard title="Resolved Today" value={resolvedToday} icon={CheckCircle} gradient="bg-gradient-success" trend="up" trendValue="24%" delay={0.2} />
                <StatCard title="Avg Response Time" value={avgResponseTime} icon={Clock} gradient="bg-gradient-secondary" trend="down" trendValue="15%" delay={0.3} />
            </div>

            {/* Quick Actions */}
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
