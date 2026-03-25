import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { ticketsAPI } from '../../services/api';
import { useStore } from '../../store/useStore';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function RecentTicketsTable() {
    const navigate = useNavigate();
    const { currentTeam } = useStore();
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const { data: ticketsResponse, isLoading } = useQuery({
        queryKey: ['tickets', 'recent', currentTeam?.id],
        queryFn: () => ticketsAPI.getAll({ limit: 10, team: currentTeam?.id }).then(res => res.data.data),
    });

    const recentTickets = ticketsResponse?.tickets || [];

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    if (isLoading) {
        return <Card className="p-6"><LoadingSkeleton count={3} /></Card>;
    }

    return (
        <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Recent Tickets
                </h3>
                <button
                    onClick={() => navigate('/tickets')}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                    View all &rarr;
                </button>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-border">
                            <th
                                className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white"
                                onClick={() => handleSort('ticketId')}
                            >
                                ID
                            </th>
                            <th
                                className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white"
                                onClick={() => handleSort('title')}
                            >
                                Title
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Assignee
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentTickets.map((ticket) => (
                            <tr
                                key={ticket._id || ticket.ticketId}
                                className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/tickets/${ticket._id}`)}
                            >
                                <td className="py-3 px-4">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        #{ticket.ticketId?.substring(0, 8)}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs block">
                                        {ticket.title}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge type="priority" value={ticket.priority}>
                                        {ticket.priority}
                                    </Badge>
                                </td>
                                <td className="py-3 px-4">
                                    <Badge type="status" value={ticket.status}>
                                        {ticket.status}
                                    </Badge>
                                </td>
                                <td className="py-3 px-4">
                                    {ticket.assignee ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                                {ticket.assignee.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {ticket.assignee.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">Unassigned</span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatRelativeTime(ticket.createdAt)}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/tickets/${ticket._id}`);
                                            }}
                                        >
                                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recentTickets.length === 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No recent tickets found.
                    </div>
                )}
            </div>
        </Card>
    );
}
