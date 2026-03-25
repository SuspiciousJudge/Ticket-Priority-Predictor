import { MessageCircle, User, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../common/Card';
import { formatRelativeTime } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { ticketsAPI } from '../../services/api';
import LoadingSkeleton from '../common/LoadingSkeleton';

const ICON_CONFIG = {
    created:  { icon: AlertCircle, bg: 'bg-orange-50', color: 'text-orange-500' },
    updated:  { icon: Edit,        bg: 'bg-sky-50',    color: 'text-sky-500'    },
    commented:{ icon: MessageCircle,bg:'bg-amber-50', color: 'text-amber-500'  },
    resolved: { icon: CheckCircle, bg: 'bg-emerald-50',color: 'text-emerald-500'},
    assigned: { icon: User,        bg: 'bg-purple-50', color: 'text-purple-500' },
};

export default function ActivityTimeline() {
    const { currentTeam } = useStore();

    const { data: ticketsResponse, isLoading } = useQuery({
        queryKey: ['tickets', 'recent', currentTeam?.id],
        queryFn: () => ticketsAPI.getAll({ limit: 8, team: currentTeam?.id }).then(res => res.data.data),
    });

    const recentTickets = ticketsResponse?.tickets || [];
    const activities = recentTickets.map(t => ({
        id:        t._id || t.ticketId,
        type:      t.status === 'Resolved' ? 'resolved' : 'created',
        name:      t.reporter?.name || t.assignee?.name || 'System',
        initials:  (t.reporter?.name || t.assignee?.name || 'S').substring(0, 2).toUpperCase(),
        message:   t.status === 'Resolved'
            ? `Resolved #${t.ticketId?.substring(0, 8)}`
            : `${t.title}`,
        timestamp: t.updatedAt || t.createdAt,
    }));

    if (isLoading) {
        return (
            <Card className="p-5">
                <LoadingSkeleton count={4} />
            </Card>
        );
    }

    return (
        <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
            </h3>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                        No recent activity.
                    </p>
                ) : activities.map((activity, index) => {
                    const cfg = ICON_CONFIG[activity.type] ?? ICON_CONFIG.created;
                    const Icon = cfg.icon;
                    return (
                        <div key={`${activity.id}-${index}`} className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {activity.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {activity.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {formatRelativeTime(activity.timestamp)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
