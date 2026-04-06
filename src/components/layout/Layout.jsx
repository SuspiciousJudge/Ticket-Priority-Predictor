import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from '../common/Breadcrumbs';
import PageTransition from '../common/PageTransition';
import AIAssistantWidget from '../common/AIAssistantWidget';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import useTeamFilter from '../../hooks/useTeamFilter';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

function PageLoader() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-dark-border rounded-lg"></div>
            <div className="h-4 w-72 bg-gray-200 dark:bg-dark-border rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[0,1,2,3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-dark-border rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
    : 'http://localhost:5000';

export default function Layout({ children }) {
    const { sidebarCollapsed, currentTeam, bootstrapData } = useStore();
    const queryClient = useQueryClient();
    useTeamFilter();

    useEffect(() => {
        bootstrapData();
    }, [bootstrapData]);

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });
        
        if (currentTeam?.id) {
            socket.emit('join_team', currentTeam.id);
        }

        const refreshTicketQueries = () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['ticket'] });
            queryClient.invalidateQueries({ queryKey: ['ticket-similar'] });
        };

        socket.on('ticket_created', () => {
            refreshTicketQueries();
        });

        socket.on('ticket_updated', () => {
            refreshTicketQueries();
        });

        socket.on('team_ticket_created', (ticket) => {
            refreshTicketQueries();
            toast(`New Ticket: ${ticket.title}`, { icon: '🤖' });
        });
        
        socket.on('team_ticket_updated', (ticket) => {
            refreshTicketQueries();
            toast.success(`Ticket Updated: ${ticket.ticketId}`);
        });

        return () => socket.disconnect();
    }, [currentTeam?.id, queryClient]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <Sidebar />

            <div className={cn(
                'transition-all duration-300',
                sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'
            )}>
                <Topbar />
                <Breadcrumbs />

                <main className="p-6">
                    <Suspense fallback={<PageLoader />}>
                        <PageTransition>
                            {children || <Outlet />}
                        </PageTransition>
                    </Suspense>
                </main>
            </div>
            <AIAssistantWidget />
        </div>
    );
}
