import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Inbox,
    Plus,
    BarChart3,
    Settings,
    Users,
    X,
    ChevronLeft,
    Ticket
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { authAPI } from '../../services/api';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Inbox, label: 'All Tickets', path: '/tickets' },
    { icon: Plus, label: 'Create Ticket', path: '/create' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

function SidebarUser() {
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => { const res = await authAPI.getMe(); return res.data.data || res.data; },
        staleTime: 5 * 60 * 1000,
    });
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
                    'fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-dark-surface',
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

                
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
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
                                    <span className="font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                
                <SidebarUser />

                
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
