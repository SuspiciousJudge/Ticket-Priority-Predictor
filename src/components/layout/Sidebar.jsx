import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Inbox,
    Plus,
    BarChart3,
    Settings,
    Users,
    BookOpen,
    Bell,
    Calendar,
    ClipboardList,
    Link,
    Gauge,
    FileText,
    UserCircle,
    AlertTriangle,
    Workflow,
    LifeBuoy,
    X,
    ChevronLeft,
    Ticket
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { authAPI, ticketsAPI } from '../../services/api';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: Inbox, label: 'Inbox', path: '/inbox', roles: ['admin', 'manager', 'agent', 'viewer'], badgeKey: 'inboxUnread' },
    { icon: Inbox, label: 'All Tickets', path: '/tickets', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: Plus, label: 'Create Ticket', path: '/create', roles: ['admin', 'manager', 'agent'] },
    { icon: UserCircle, label: 'My Tickets', path: '/my-tickets', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: Users, label: 'Unassigned', path: '/unassigned', roles: ['admin', 'manager', 'agent'], badgeKey: 'unassigned' },
    { icon: AlertTriangle, label: 'Urgent Queue', path: '/urgent', roles: ['admin', 'manager', 'agent'], badgeKey: 'urgent' },
    { icon: FileText, label: 'Saved Views', path: '/saved-views', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: Gauge, label: 'Performance', path: '/performance', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: ClipboardList, label: 'Reports', path: '/reports', roles: ['admin', 'manager', 'agent'] },
    { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['admin', 'manager', 'agent', 'viewer'], badgeKey: 'notificationsUnread' },
    { icon: FileText, label: 'Activity Log', path: '/activity-log', roles: ['admin', 'manager'] },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['admin', 'manager', 'agent'] },
    { icon: Calendar, label: 'Calendar', path: '/calendar', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge-base', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: FileText, label: 'Templates', path: '/templates', roles: ['admin', 'manager', 'agent'] },
    { icon: Workflow, label: 'Automations', path: '/automations', roles: ['admin', 'manager'] },
    { icon: Link, label: 'Integrations', path: '/integrations', roles: ['admin', 'manager'] },
    { icon: AlertTriangle, label: 'SLA Management', path: '/sla', roles: ['admin', 'manager', 'agent'] },
    { icon: LifeBuoy, label: 'Help & Support', path: '/help', roles: ['admin', 'manager', 'agent', 'viewer'] },
    { icon: Users, label: 'Team', path: '/team', roles: ['admin', 'manager'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin', 'manager', 'agent', 'viewer'] },
];

function SidebarUser({ user }) {
    const name = user?.name || 'Guest User';
    const email = user?.email || '';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useStore();
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => { const res = await authAPI.getMe(); return res.data.data || res.data; },
        staleTime: 5 * 60 * 1000,
    });
    const { data: tickets = [] } = useQuery({
        queryKey: ['sidebar-badge-tickets'],
        queryFn: async () => {
            const res = await ticketsAPI.getAll({ limit: 500, sortBy: 'updatedAt', sortOrder: 'desc' });
            return res?.data?.data?.tickets || [];
        },
        refetchInterval: 7000,
    });

    const role = String(user?.role || 'viewer').toLowerCase();
    const myId = String(user?._id || user?.id || '');

    const badgeCounts = useMemo(() => {
        const openLike = new Set(['Open', 'In Progress', 'Pending']);
        const inboxUnread = tickets.filter((t) => {
            const assigneeId = String(t?.assignee?._id || t?.assignee || '');
            const isMineOrUnassigned = !assigneeId || assigneeId === myId;
            return openLike.has(t?.status) && isMineOrUnassigned;
        }).length;

        const unassigned = tickets.filter((t) => openLike.has(t?.status) && !t?.assignee).length;
        const urgent = tickets.filter((t) => openLike.has(t?.status) && (t?.priority === 'Critical' || t?.priority === 'High')).length;

        const readIds = (() => {
            try {
                return new Set(JSON.parse(localStorage.getItem('notif-read') || '[]'));
            } catch {
                return new Set();
            }
        })();

        const generatedNotifications = [];
        tickets.forEach((t) => {
            const assigneeId = String(t?.assignee?._id || t?.assignee || '');
            if (myId && assigneeId === myId) {
                generatedNotifications.push(`${t._id}-assigned`);
            }
            if (t?.priority === 'Critical') {
                generatedNotifications.push(`${t._id}-alert`);
            }
            if (t?.status === 'Resolved') {
                generatedNotifications.push(`${t._id}-update`);
            }
        });

        const notificationsUnread = generatedNotifications.filter((id) => !readIds.has(id)).length;
        return { inboxUnread, unassigned, urgent, notificationsUnread };
    }, [tickets, myId]);

    const visibleMenuItems = useMemo(
        () => menuItems.filter((item) => item.roles.includes(role)),
        [role]
    );

    return (
        <>
            
            <AnimatePresence>
                {!sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            
            <motion.aside
                initial={false}
                animate={{ x: sidebarCollapsed ? -280 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    'fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-dark-surface flex flex-col',
                    'border-r border-gray-200 dark:border-dark-border z-50',
                    'lg:translate-x-0'
                )}
            >
                
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Ticket className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            TicketPro
                        </span>
                    </div>

                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                
                <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto">
                    {visibleMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border',
                                    isActive && 'bg-gradient-primary text-white hover:bg-gradient-primary shadow-colored-primary'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn('w-5 h-5', isActive && 'text-white')} />
                                    <span className="font-medium flex-1">{item.label}</span>
                                    {item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                                        <span
                                            className={cn(
                                                'min-w-5 h-5 px-1 rounded-full text-[10px] font-semibold inline-flex items-center justify-center',
                                                isActive ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                            )}
                                        >
                                            {badgeCounts[item.badgeKey] > 99 ? '99+' : badgeCounts[item.badgeKey]}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                
                <SidebarUser user={user} />

                
                <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                >
                    <ChevronLeft className={cn(
                        'w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform',
                        sidebarCollapsed && 'rotate-180'
                    )} />
                </button>
            </motion.aside>
        </>
    );
}
