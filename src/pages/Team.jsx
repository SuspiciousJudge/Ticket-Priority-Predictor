import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Edit, Trash2, Star, Clock, CheckCircle, Ticket, Mail, Shield, Wifi, WifiOff, X,
    Users, Settings2, Eye, Activity, Lock, Unlock, Save, Download, UserPlus, Loader2
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useStore } from '../store/useStore';
import { teamsAPI, usersAPI, ticketsAPI } from '../services/api';
import { mockRoles, mockTeamActivities } from '../data/mockData';
import { cn, formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'roles', label: 'Roles & Permissions', icon: Shield },
    { key: 'settings', label: 'Team Settings', icon: Settings2 },
    { key: 'activity', label: 'Activity Log', icon: Activity },
];

const roleColors = {
    'Team Lead': 'bg-purple-100 text-purple-700 border-purple-200',
    'Senior Agent': 'bg-primary-100 text-primary-700 border-primary-200',
    'Support Agent': 'bg-secondary-100 text-secondary-700 border-secondary-200',
    'QA Specialist': 'bg-warning-100 text-warning-700 border-warning-200',
    'Admin': 'bg-danger-100 text-danger-700 border-danger-200',
};

const activityTypeColors = {
    member_added: 'bg-success-100 text-success-600',
    member_removed: 'bg-danger-100 text-danger-600',
    settings_changed: 'bg-primary-100 text-primary-600',
    role_changed: 'bg-warning-100 text-warning-600',
    team_created: 'bg-secondary-100 text-secondary-600',
};

const activityTypeIcons = {
    member_added: UserPlus,
    member_removed: Trash2,
    settings_changed: Settings2,
    role_changed: Shield,
    team_created: Plus,
};

export default function Team() {
    const { currentTeam } = useStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ userId: '', role: 'member' });

    // Fetch all teams (for the all-teams list view)
    const { data: allTeamsRes, isLoading: allTeamsLoading } = useQuery({
        queryKey: ['teams'],
        queryFn: teamsAPI.getAll,
    });
    const allTeams = allTeamsRes?.data?.data || [];

    // Fetch team details
    const { data: teamRes, isLoading: teamLoading } = useQuery({
        queryKey: ['team', currentTeam?.id],
        queryFn: () => teamsAPI.getById(currentTeam.id),
        enabled: !!currentTeam?.id
    });

    const team = teamRes?.data?.data || null;
    const teamMembers = team?.members || [];

    // Fetch team tickets for analytics
    const { data: ticketsRes } = useQuery({
        queryKey: ['teamTickets', currentTeam?.id],
        queryFn: () => ticketsAPI.getAll({ team: currentTeam.id, limit: 1000 }),
        enabled: !!currentTeam?.id
    });

    const teamTickets = ticketsRes?.data?.data?.tickets || [];

    // Fetch all users for "Add Member" dropdown
    const { data: usersRes } = useQuery({
        queryKey: ['users'],
        queryFn: usersAPI.getAll,
    });
    const allUsers = usersRes?.data?.data || [];
    // Filter out users already in the team
    const availableUsers = allUsers.filter(u => !teamMembers.some(m => m.user?._id === u._id));

    const [settingsForm, setSettingsForm] = useState({
        sla: team?.settings?.slaTargets || { critical: 4, high: 8, medium: 24, low: 72 },
        workingHours: team?.settings?.workingHours || { start: '09:00', end: '18:00' },
        assignmentStrategy: team?.settings?.autoAssignment ? 'round-robin' : 'manual',
    });

    const [roles, setRoles] = useState(mockRoles);

    // Mutations
    const addMemberMutation = useMutation({
        mutationFn: (data) => teamsAPI.addMember(currentTeam.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeam.id] });
            toast.success('Team member added');
            setModalOpen(false);
            setFormData({ userId: '', role: 'member' });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to add member')
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId) => teamsAPI.removeMember(currentTeam.id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeam.id] });
            toast.success('Team member removed');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member')
    });

    const updateTeamMutation = useMutation({
        mutationFn: (data) => teamsAPI.update(currentTeam.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team', currentTeam.id] });
            toast.success('Team settings saved');
        },
        onError: (err) => toast.error('Failed to update team')
    });

    const handleAddMember = () => {
        if (!formData.userId) { toast.error('Please select a user'); return; }
        addMemberMutation.mutate(formData);
    };

    const handleDelete = (userId) => {
        removeMemberMutation.mutate(userId);
    };

    const handleSaveSettings = () => {
        updateTeamMutation.mutate({
            settings: {
                slaTargets: settingsForm.sla,
                workingHours: settingsForm.workingHours,
                autoAssignment: settingsForm.assignmentStrategy !== 'manual',
            }
        });
    };

    // Derived analytics
    const totalResolved = teamTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const avgSatisfaction = '4.8'; // Mocked or derived from comments/feedback later
    
    const userWorkload = useMemo(() => {
        const workload = {};
        teamMembers.forEach(m => {
            if (m.user) workload[m.user._id] = { name: m.user.name.split(' ')[0], current: 0, resolved: 0 };
        });
        teamTickets.forEach(t => {
            if (!t.assignee) return;
            const uid = t.assignee._id || t.assignee;
            if (workload[uid]) {
                if (t.status === 'Resolved' || t.status === 'Closed') workload[uid].resolved++;
                else workload[uid].current++;
            }
        });
        return Object.values(workload);
    }, [teamTickets, teamMembers]);

    const teamActivities = mockTeamActivities.filter(a => a.teamId === currentTeam?.id);

    if (teamLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-gray-500">Loading team data...</p>
            </div>
        );
    }

    if (!currentTeam || !team) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Team Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select a team to manage or create a new one.</p>
                </div>
                {allTeamsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                ) : allTeams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Users className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500">No teams created yet.</p>
                        <p className="text-sm text-gray-400">Create a team from the top bar to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allTeams.map((t, i) => {
                            const tid = t._id || t.id;
                            return (
                                <motion.div key={tid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <Card clickable onClick={() => {
                                        const { setCurrentTeam } = useStore.getState();
                                        setCurrentTeam({ id: tid, name: t.name, color: t.color, initials: (t.name || '').substring(0,2).toUpperCase() });
                                    }} className="p-6 hover:shadow-strong transition-all">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: t.color || '#667eea' }}>
                                                {t.initials || (t.name || '').substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.name}</h3>
                                                <p className="text-sm text-gray-500">{t.members?.length || 0} members</p>
                                            </div>
                                        </div>
                                        {t.description && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{t.description}</p>}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: team.color || currentTeam.color }}>
                        {team.initials || currentTeam.initials}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{team.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teamMembers.length} members · {teamTickets.length} active tickets</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-dark-border">
                <nav className="flex space-x-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={cn('flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                                activeTab === tab.key ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300')}>
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Members', value: teamMembers.length, icon: Shield, gradient: 'bg-gradient-primary' },
                                    { label: 'Resolved Tickets', value: totalResolved, icon: CheckCircle, gradient: 'bg-gradient-success' },
                                    { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, icon: Star, gradient: 'bg-gradient-warning' },
                                ].map((stat, i) => (
                                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                        <Card className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                                                </div>
                                                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.gradient)}>
                                                    <stat.icon className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Team Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-gray-500">Created</p><p className="font-medium text-gray-900 dark:text-white">{new Date(team.createdAt).toLocaleDateString()}</p></div>
                                    <div className="md:col-span-2"><p className="text-gray-500">Description</p><p className="font-medium text-gray-900 dark:text-white">{team.description}</p></div>
                                    <div><p className="text-gray-500">Assignment Strategy</p><p className="font-medium text-gray-900 dark:text-white capitalize">{team.settings?.autoAssignment ? 'Round Robin (Auto)' : 'Manual'}</p></div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Workload Distribution</h3>
                                {userWorkload.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={userWorkload}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                                            <Bar dataKey="current" fill="#667eea" radius={[6, 6, 0, 0]} name="Current Tickets" />
                                            <Bar dataKey="resolved" fill="#10b981" radius={[6, 6, 0, 0]} name="Resolved Tickets" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-gray-500 text-center py-8">No assigned tickets found yet</p>}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{teamMembers.length} members</p>
                                <Button icon={Plus} onClick={() => setModalOpen(true)}>Add Member</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teamMembers.map((member, index) => {
                                    const u = member.user;
                                    if (!u) return null;
                                    const wk = userWorkload.find(w => w.name === u.name.split(' ')[0]) || { current: 0, resolved: 0 };
                                    return (
                                        <motion.div key={u._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                                            <Card className="p-6 hover:shadow-strong transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="relative">
                                                            <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                                {u.avatar || u.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleDelete(u._id)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors" disabled={removeMemberMutation.isPending}><Trash2 className="w-4 h-4 text-danger-500" /></button>
                                                    </div>
                                                </div>
                                                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', roleColors[member.role] || 'bg-gray-100 text-gray-700 border-gray-200')}>{member.role}</span>
                                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                                                    <div className="flex items-center space-x-2"><Ticket className="w-4 h-4 text-primary-500" /><div><p className="text-xs text-gray-500">Active</p><p className="text-sm font-bold text-gray-900 dark:text-white">{wk.current}</p></div></div>
                                                    <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-success-500" /><div><p className="text-xs text-gray-500">Resolved</p><p className="text-sm font-bold text-gray-900 dark:text-white">{wk.resolved}</p></div></div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                                {teamMembers.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No members in this team yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-border/30">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-48">Permission</th>
                                            {roles.map(role => (<th key={role.id} className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{role.name}</th>))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(roles[0].permissions).map((perm) => (
                                            <tr key={perm} className="border-b border-gray-100 dark:border-dark-border/50">
                                                <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{perm.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                {roles.map(role => (
                                                    <td key={role.id} className="py-3 px-4 text-center">
                                                        <button onClick={() => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: { ...r.permissions, [perm]: !r.permissions[perm] } } : r))}
                                                            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto', role.permissions[perm] ? 'bg-success-100 text-success-600 hover:bg-success-200' : 'bg-gray-100 dark:bg-dark-border text-gray-400 hover:bg-gray-200')}>
                                                            {role.permissions[perm] ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6 max-w-2xl">
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SLA Targets (hours)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([key, label]) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                                            <input type="number" min={1} value={settingsForm.sla?.[key] || ''}
                                                onChange={e => setSettingsForm(f => ({ ...f, sla: { ...f.sla, [key]: Number(e.target.value) } }))}
                                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Working Hours</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                        <input type="time" value={settingsForm.workingHours?.start || ''}
                                            onChange={e => setSettingsForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                        <input type="time" value={settingsForm.workingHours?.end || ''}
                                            onChange={e => setSettingsForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assignment Strategy</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'round-robin', label: 'Round Robin (Auto)', desc: 'Distribute tickets evenly among members' },
                                        { value: 'manual', label: 'Manual', desc: 'Manually assign each ticket' },
                                    ].map(s => (
                                        <button key={s.value} onClick={() => setSettingsForm(f => ({ ...f, assignmentStrategy: s.value }))}
                                            className={cn('w-full flex items-start space-x-3 p-3 rounded-xl border transition-all text-left',
                                                settingsForm.assignmentStrategy === s.value ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-border hover:border-gray-300')}>
                                            <div className={cn('w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0', settingsForm.assignmentStrategy === s.value ? 'border-primary-600' : 'border-gray-300')}>
                                                {settingsForm.assignmentStrategy === s.value && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                                            </div>
                                            <div><p className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</p><p className="text-xs text-gray-500">{s.desc}</p></div>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                            <div className="flex justify-end"><Button icon={updateTeamMutation.isPending ? undefined : Save} loading={updateTeamMutation.isPending} onClick={handleSaveSettings}>Save Settings</Button></div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-end">
                                <Button variant="outline" icon={Download} onClick={() => toast.success('Activity log exported')}>Export</Button>
                            </div>
                            <Card className="p-6">
                                {teamActivities.length > 0 ? (
                                    <div className="space-y-1">
                                        {teamActivities.map((activity, index) => {
                                            const Icon = activityTypeIcons[activity.type] || Activity;
                                            const colorClass = activityTypeColors[activity.type] || 'bg-gray-100 text-gray-600';
                                            return (
                                                <motion.div key={activity.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                                    className="flex items-start space-x-4 py-4 border-b border-gray-100 dark:border-dark-border/50 last:border-b-0">
                                                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}><Icon className="w-4 h-4" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 dark:text-white"><span className="font-medium">{activity.user}</span> {activity.message}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(activity.timestamp)}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No activity yet</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

            {/* Add Member Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Team Member">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select User *</label>
                        <select value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none">
                            <option value="">-- Choose User --</option>
                            {availableUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none">
                            {['admin', 'manager', 'member'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember} loading={addMemberMutation.isPending} disabled={!formData.userId}>Add Member</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
