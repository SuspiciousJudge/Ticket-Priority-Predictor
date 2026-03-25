import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Inbox,
    Plus,
    BarChart3,
    Settings,
    Users,
    X,
    ChevronLeft,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Inbox, label: 'All Tickets', path: '/tickets' },
    { icon: Plus, label: 'Create Ticket', path: '/create' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

function StarburstIcon({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 8 }, (_, i) => (
                <rect
                    key={i}
                    x="13"
                    y="1"
                    width="2"
                    height="11"
                    rx="1"
                    fill="#f97316"
                    transform={`rotate(${i * 45} 14 14)`}
                />
            ))}
        </svg>
    );
}

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useStore();

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {!sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ x: sidebarCollapsed ? -280 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-0 h-full w-[280px] z-50 flex flex-col lg:translate-x-0"
                style={{ backgroundColor: '#0c0c0c', borderRight: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Logo */}
                <div
                    className="h-16 flex items-center justify-between px-6 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="flex items-center space-x-2.5">
                        <StarburstIcon size={28} />
                        <span className="font-bold text-lg text-white tracking-tight">
                            TicketPro
                        </span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium',
                                    isActive
                                        ? 'bg-orange-500 text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/10'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-white/40')}
                                    />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div
                    className="p-4 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            JD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">John Doe</p>
                            <p className="text-xs text-white/40 truncate">john@example.com</p>
                        </div>
                    </div>
                </div>

                {/* Desktop collapse toggle */}
                <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center shadow-md"
                    style={{ backgroundColor: '#0c0c0c', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                    <ChevronLeft
                        className={cn(
                            'w-3.5 h-3.5 text-white/50 transition-transform',
                            sidebarCollapsed && 'rotate-180'
                        )}
                    />
                </button>
            </motion.aside>
        </>
    );
}
