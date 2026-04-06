import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, Menu, Moon, Sun, User, Settings, HelpCircle, LogOut, X, Check, CheckCheck, Inbox, AlertTriangle, MessageCircle, Shield, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRelativeTime } from '../../lib/utils';
import TeamSelector from './TeamSelector';
import CreateTeamModal from '../common/CreateTeamModal';
import { authAPI } from '../../services/api';

function NotificationPanel({ isOpen, onClose, notifications, setNotifications }) {
    const markNotificationRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };
    const markAllNotificationsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };
    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };
    const panelRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const getNotifIcon = (type) => {
        switch (type) {
            case 'ticket_created': return { icon: Inbox, color: 'text-primary-500 bg-primary-100' };
            case 'ticket_updated': return { icon: AlertTriangle, color: 'text-warning-500 bg-warning-100' };
            case 'comment': return { icon: MessageCircle, color: 'text-secondary-500 bg-secondary-100' };
            case 'resolved': return { icon: Check, color: 'text-success-500 bg-success-100' };
            case 'assigned': return { icon: User, color: 'text-purple-500 bg-purple-100' };
            case 'sla_warning': return { icon: AlertTriangle, color: 'text-danger-500 bg-danger-100' };
            case 'system': return { icon: Shield, color: 'text-gray-500 bg-gray-100' };
            default: return { icon: Inbox, color: 'text-gray-500 bg-gray-100' };
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-16 top-14 w-96 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-strong z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                            {notifications?.filter(n => !n.read).length > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold text-white bg-danger-500 rounded-full">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={markAllNotificationsRead}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {(!notifications || notifications.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Bell className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const { icon: Icon, color } = getNotifIcon(notif.type);
                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            'flex items-start space-x-3 p-4 border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors cursor-pointer',
                                            !notif.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                                        )}
                                    >
                                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', color)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn('text-sm leading-snug', notif.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium')}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatRelativeTime(notif.timestamp)}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markNotificationRead(notif.id); }}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors"
                                                title="Delete"
                                            >
                                                <X className="w-3.5 h-3.5 text-gray-400" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ProfileDropdown({ isOpen, onClose, user, onLogout }) {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const menuItems = [
        { icon: User, label: 'My Profile', action: () => { navigate('/settings'); onClose(); } },
        { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); onClose(); } },
        { icon: HelpCircle, label: 'Help & Support', action: () => { navigate('/help'); onClose(); } },
    ];

    const fallbackName = user?.name || 'Guest User';
    const fallbackEmail = user?.email || 'guest@example.com';
    const fallbackRole = user?.role || 'User';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-14 w-72 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-strong z-50 overflow-hidden"
                >
                    <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {fallbackName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{fallbackName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{fallbackEmail}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full capitalize">
                                    {fallbackRole}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-left"
                            >
                                <item.icon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-2 border-t border-gray-200 dark:border-dark-border">
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function Topbar() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toggleSidebar, darkMode, toggleDarkMode } = useStore();
    
    // Fetch user mapping correctly matching ProtectedRoute format
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => { const res = await authAPI.getMe(); return res.data.data || res.data; }
    });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchFocused, setSearchFocused] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    const getUnreadCount = () => notifications.filter(n => !n.read).length;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const handleLogout = () => {
        localStorage.removeItem('token');
        queryClient.clear();
        setProfileOpen(false);
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border sticky top-0 z-30">
            <div className="h-full flex items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <TeamSelector onCreateTeam={() => setCreateTeamOpen(true)} />

                    <div className="relative">
                        <div className={cn(
                            'flex items-center transition-all duration-300',
                            searchFocused ? 'w-64 md:w-96' : 'w-64'
                        )}>
                            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets (press Enter)..."
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        navigate(`/tickets?search=${encodeURIComponent(e.target.value.trim())}`);
                                    }
                                }}
                                className={cn(
                                    'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg',
                                    'bg-gray-50 dark:bg-dark-bg focus:bg-white dark:focus:bg-dark-surface',
                                    'text-gray-900 dark:text-white placeholder-gray-500',
                                    'focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none',
                                    'transition-all duration-200'
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(currentTime)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(currentTime)}</div>
                    </div>

                    <button
                        onClick={toggleDarkMode}
                        className="relative p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                    >
                        <motion.div initial={false} animate={{ rotate: darkMode ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </motion.div>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                            className="relative p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            {getUnreadCount() > 0 && (
                                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-danger-500 rounded-full animate-pulse">
                                    {getUnreadCount()}
                                </span>
                            )}
                        </button>
                        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} setNotifications={setNotifications} />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                            className="flex items-center space-x-3 cursor-pointer group"
                        >
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Guest User'}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'User'}</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-transparent group-hover:ring-primary-300 transition-all">
                                {(user?.name || 'GU').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform hidden md:block', profileOpen && 'rotate-180')} />
                        </button>
                        <ProfileDropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onLogout={handleLogout} />
                    </div>
                </div>
            </div>
            <CreateTeamModal isOpen={createTeamOpen} onClose={() => setCreateTeamOpen(false)} />
        </header>
    );
}
