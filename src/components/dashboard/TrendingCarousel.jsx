import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { TrendingUp, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { useStore } from '../../store/useStore';
import { ticketsAPI } from '../../services/api';
import { formatRelativeTime } from '../../lib/utils';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function TrendingCarousel() {
    const navigate = useNavigate();
    const { currentTeam } = useStore();

    const { data: ticketsResponse, isLoading } = useQuery({
        queryKey: ['tickets', 'recent', currentTeam?.id],
        queryFn: () => ticketsAPI.getAll({ limit: 15, team: currentTeam?.id }).then(res => res.data.data),
    });

    const recentTickets = ticketsResponse?.tickets || [];
    const trendingTickets = recentTickets
        .filter(t => t.priority === 'Critical' || t.priority === 'High')
        .slice(0, 8);

    if (isLoading) {
        return <Card className="p-6"><LoadingSkeleton count={3} /></Card>;
    }

    if (trendingTickets.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Trending Tickets
                    </h3>
                </div>
                <div className="text-center py-6 text-gray-500">
                    No trending tickets at the moment.
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Trending Tickets
                    </h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-border px-2.5 py-1 rounded-full">
                    {trendingTickets.length} active
                </span>
            </div>

            <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
                autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true, dynamicBullets: true }}
                navigation
                className="trending-swiper !pb-10"
            >
                {trendingTickets.map((ticket) => {
                    const ticketKey = ticket._id || ticket.id || ticket.ticketId;
                    if (!ticketKey) return null;
                    return (
                    <SwiperSlide key={ticketKey}>
                        <div
                            onClick={() => navigate(`/tickets/${ticketKey}`)}
                            className="relative mx-2 bg-gradient-to-br from-gray-50 to-white dark:from-dark-border/50 dark:to-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5 cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1 group"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{
                                background: ticket.priority === 'Critical' ? '#dc2626' : '#ea580c'
                            }} />

                            <div className="flex items-start justify-between mb-3 mt-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">#{ticket.ticketId?.substring(0,8)}</span>
                                <Badge type="priority" value={ticket.priority}>{ticket.priority}</Badge>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {ticket.title}
                            </h4>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/50">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                        {(ticket.assignee?.name || ticket.reporter?.name || 'S').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {(ticket.assignee?.name || ticket.reporter?.name || 'System').split(' ')[0]}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">{formatRelativeTime(ticket.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                )})}
            </Swiper>
        </Card>
    );
}
