import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { TrendingUp, Clock } from 'lucide-react';
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
        return (
            <Card className="p-5">
                <LoadingSkeleton count={3} />
            </Card>
        );
    }

    if (trendingTickets.length === 0) {
        return (
            <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Trending Tickets
                    </h3>
                </div>
                <p className="text-sm text-gray-400 text-center py-4">
                    No high-priority tickets at the moment.
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Trending Tickets
                    </h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {trendingTickets.length} urgent
                </span>
            </div>

            <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={12}
                slidesPerView={1}
                breakpoints={{
                    640:  { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
                autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true, dynamicBullets: true }}
                navigation
                className="trending-swiper !pb-10"
            >
                {trendingTickets.map((ticket) => (
                    <SwiperSlide key={ticket._id || ticket.ticketId}>
                        <div
                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                            className="relative bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-150 group"
                        >
                            {/* priority indicator bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                                style={{ background: ticket.priority === 'Critical' ? '#dc2626' : '#ea580c' }}
                            />

                            <div className="flex items-start justify-between mb-2 mt-1">
                                <span className="text-[11px] font-mono text-gray-400">
                                    #{ticket.ticketId?.substring(0, 8)}
                                </span>
                                <Badge type="priority" value={ticket.priority}>{ticket.priority}</Badge>
                            </div>

                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                {ticket.title}
                            </h4>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                                        {(ticket.assignee?.name || ticket.reporter?.name || 'S').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {(ticket.assignee?.name || ticket.reporter?.name || 'System').split(' ')[0]}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">{formatRelativeTime(ticket.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </Card>
    );
}
