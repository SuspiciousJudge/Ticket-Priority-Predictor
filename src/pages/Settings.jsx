import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Bell, Cog, Link2, Palette, Save, Camera, Eye, EyeOff, Key, Mail, MessageSquare, Smartphone, Slack, Globe, Shield, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useStore } from '../store/useStore';
import { authAPI, usersAPI } from '../services/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Cog },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
];

function Toggle({ enabled, onChange, label, description }) {
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
            </div>
            <button onClick={() => onChange(!enabled)} className={cn('relative w-11 h-6 rounded-full transition-colors', enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-border')}>
                <motion.div animate={{ x: enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
        </div>
    );
}

const defaultSettings = {
    notifications: { emailTicketCreated: true, emailTicketUpdated: true, emailTicketResolved: false, pushTicketCreated: true, pushTicketUpdated: false, pushTicketResolved: true, inAppAll: true },
    system: { autoAssign: true, slaEnabled: true, slaCritical: 4, slaHigh: 8, slaMedium: 24, slaLow: 72 },
    integrations: { slack: true, email: true, apiKeyGenerated: false }
};

export default function Settings() {
    const { darkMode, toggleDarkMode } = useStore();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    
    // Fallback settings for preferences not in DB
    const [uiSettings, setUISettings] = useState(() => {
        try {
            const saved = localStorage.getItem('userSettings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch { return defaultSettings; }
    });

    const updateSettings = (section, updates) => {
        setUISettings(prev => {
            const next = { ...prev, [section]: { ...prev[section], ...updates } };
            localStorage.setItem('userSettings', JSON.stringify(next));
            return next;
        });
    };

    // Reads from the ['me'] cache (same key as ProtectedRoute / Topbar).
    // The cache stores the user object directly — no extra unwrapping needed.
    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await authAPI.getMe();
            return res.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });
    const [profileForm, setProfileForm] = useState({ name: '', email: '', role: '', avatar: '' });

    useEffect(() => {
        if (user) {
            setProfileForm({ name: user.name, email: user.email, role: user.role || 'Agent', avatar: user.avatar || '' });
        }
    }, [user]);

    const updateUserMutation = useMutation({
        mutationFn: (data) => usersAPI.update(user?._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile updated successfully!');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update profile')
    });

    const handleSaveProfile = () => {
        if (!user) return;
        updateUserMutation.mutate({ name: profileForm.name, email: profileForm.email });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account and application preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tab Nav */}
                <Card className="p-3 lg:col-span-1 h-fit">
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn('flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-all text-sm font-medium', activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border')}>
                                <tab.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </Card>

                {/* Content */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {activeTab === 'profile' && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
                                    <div className="flex items-center space-x-6 mb-8">
                                        <div className="relative">
                                            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                                {profileForm.avatar || (profileForm.name ? profileForm.name[0]?.toUpperCase() : 'U')}
                                            </div>
                                            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                                                <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{profileForm.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{profileForm.role}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                            <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <input value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                            <input type="password" placeholder="••••••••"
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
                                        <Button icon={updateUserMutation.isPending ? undefined : Save} loading={updateUserMutation.isPending} onClick={handleSaveProfile}>Save Changes</Button>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'notifications' && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email Notifications</h3>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl px-4 divide-y divide-gray-200 dark:divide-dark-border">
                                                <Toggle label="Ticket Created" description="When a new ticket is assigned to you" enabled={uiSettings.notifications.emailTicketCreated}
                                                    onChange={(v) => updateSettings('notifications', { emailTicketCreated: v })} />
                                                <Toggle label="Ticket Updated" description="When a ticket you're watching is updated" enabled={uiSettings.notifications.emailTicketUpdated}
                                                    onChange={(v) => updateSettings('notifications', { emailTicketUpdated: v })} />
                                                <Toggle label="Ticket Resolved" description="When a ticket is resolved" enabled={uiSettings.notifications.emailTicketResolved}
                                                    onChange={(v) => updateSettings('notifications', { emailTicketResolved: v })} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Smartphone className="w-4 h-4 text-gray-500" />
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Push Notifications</h3>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl px-4 divide-y divide-gray-200 dark:divide-dark-border">
                                                <Toggle label="Ticket Created" enabled={uiSettings.notifications.pushTicketCreated}
                                                    onChange={(v) => updateSettings('notifications', { pushTicketCreated: v })} />
                                                <Toggle label="Ticket Updated" enabled={uiSettings.notifications.pushTicketUpdated}
                                                    onChange={(v) => updateSettings('notifications', { pushTicketUpdated: v })} />
                                                <Toggle label="Ticket Resolved" enabled={uiSettings.notifications.pushTicketResolved}
                                                    onChange={(v) => updateSettings('notifications', { pushTicketResolved: v })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border mt-6">
                                        <Button icon={Save} onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'system' && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h2>
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl px-4 divide-y divide-gray-200 dark:divide-dark-border">
                                            <Toggle label="Auto-Assignment" description="Automatically assign tickets based on team workload" enabled={uiSettings.system.autoAssign}
                                                onChange={(v) => updateSettings('system', { autoAssign: v })} />
                                            <Toggle label="SLA Monitoring" description="Track and alert on SLA breaches" enabled={uiSettings.system.slaEnabled}
                                                onChange={(v) => updateSettings('system', { slaEnabled: v })} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                                                <Clock className="w-4 h-4 text-gray-500" /><span>SLA Rules (hours)</span>
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Critical', key: 'slaCritical', color: 'border-danger-300 focus:ring-danger-500' },
                                                    { label: 'High', key: 'slaHigh', color: 'border-orange-300 focus:ring-orange-500' },
                                                    { label: 'Medium', key: 'slaMedium', color: 'border-warning-300 focus:ring-warning-500' },
                                                    { label: 'Low', key: 'slaLow', color: 'border-success-300 focus:ring-success-500' },
                                                ].map(sla => (
                                                    <div key={sla.key}>
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{sla.label}</label>
                                                        <input type="number" value={uiSettings.system[sla.key]}
                                                            onChange={e => updateSettings('system', { [sla.key]: parseInt(e.target.value) || 0 })}
                                                            className={cn('w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none text-sm', sla.color)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-border mt-6">
                                        <Button icon={Save} onClick={() => toast.success('System settings saved')}>Save System Settings</Button>
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'integrations' && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Integrations</h2>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Slack', description: 'Get ticket notifications in your Slack channels', icon: '💬', connected: uiSettings.integrations.slack, key: 'slack' },
                                            { name: 'Email', description: 'Forward ticket updates to email', icon: '📧', connected: uiSettings.integrations.email, key: 'email' },
                                            { name: 'API Access', description: 'Generate and manage API keys', icon: '🔑', connected: uiSettings.integrations.apiKeyGenerated, key: 'apiKeyGenerated' },
                                        ].map(integration => (
                                            <div key={integration.key} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-dark-border/30 rounded-xl border border-gray-200 dark:border-dark-border">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-3xl">{integration.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{integration.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{integration.description}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant={integration.connected ? 'ghost' : 'primary'}
                                                    size="sm"
                                                    onClick={() => { updateSettings('integrations', { [integration.key]: !integration.connected }); toast.success(integration.connected ? `${integration.name} disconnected` : `${integration.name} connected`); }}
                                                >
                                                    {integration.connected ? 'Disconnect' : 'Connect'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {activeTab === 'appearance' && (
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h2>
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl px-4">
                                            <Toggle label="Dark Mode" description="Switch between light and dark themes" enabled={darkMode} onChange={toggleDarkMode} />
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
