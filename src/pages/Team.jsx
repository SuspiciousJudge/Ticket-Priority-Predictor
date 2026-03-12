import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Plus, Edit, Trash2, Star, Clock, CheckCircle, Ticket, Mail, Shield, Wifi, WifiOff, X,
    Users, Settings2, Eye, Activity, Lock, Unlock, Save, Download, UserPlus
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useStore } from '../store/useStore';
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
    const { teamMembers, addTeamMember, updateTeamMember, removeTeamMember, currentTeam, updateTeam, getTeamMembers, getTeamTickets } = useStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [modalOpen, setModalOpen] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Support Agent', expertise: '' });

    const currentTeamMembers = getTeamMembers();
    const teamTickets = getTeamTickets();

    const [settingsForm, setSettingsForm] = useState({
        sla: currentTeam?.settings?.sla || { critical: 4, high: 8, medium: 24, low: 72 },
        workingHours: currentTeam?.settings?.workingHours || { start: '09:00', end: '18:00' },
        assignmentStrategy: currentTeam?.settings?.assignmentStrategy || 'round-robin',
    });

    const [roles, setRoles] = useState(mockRoles);

    const workloadData = currentTeamMembers.map(m => ({
        name: m.name.split(' ')[0],
        current: m.currentTickets,
        resolved: m.resolvedToday,
    }));

    const handleSave = () => {
        if (!formData.name || !formData.email) { toast.error('Name and email are required'); return; }
        if (editMember) {
            updateTeamMember(editMember.id, { ...formData, expertise: formData.expertise.split(',').map(e => e.trim()).filter(Boolean) });
            toast.success('Team member updated');
        } else {
            const newMemberId = `user-${Date.now()}`;
            addTeamMember({
                id: newMemberId, ...formData, avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                expertise: formData.expertise.split(',').map(e => e.trim()).filter(Boolean),
                teamId: currentTeam?.id,
                currentTickets: 0, resolvedToday: 0, resolvedThisWeek: 0, avgResolutionTime: 0, satisfaction: 0, status: 'online',
            });
            if (currentTeam) {
                updateTeam(currentTeam.id, { members: [...(currentTeam.members || []), newMemberId] });
            }
            toast.success('Team member added');
        }
        setModalOpen(false);
        setEditMember(null);
        setFormData({ name: '', email: '', role: 'Support Agent', expertise: '' });
    };

    const handleEdit = (member) => {
        setEditMember(member);
        setFormData({ name: member.name, email: member.email, role: member.role, expertise: member.expertise.join(', ') });
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        removeTeamMember(id);
        if (currentTeam) {
            updateTeam(currentTeam.id, { members: currentTeam.members.filter(m => m !== id) });
        }
        toast.success('Team member removed');
    };

    const handleSaveSettings = () => {
        if (currentTeam) {
            updateTeam(currentTeam.id, {
                settings: { ...currentTeam.settings, sla: settingsForm.sla, workingHours: { ...currentTeam.settings.workingHours, ...settingsForm.workingHours }, assignmentStrategy: settingsForm.assignmentStrategy },
            });
            toast.success('Team settings saved');
        }
    };

    const totalResolved = currentTeamMembers.reduce((s, m) => s + m.resolvedToday, 0);
    const avgSatisfaction = currentTeamMembers.length > 0
        ? (currentTeamMembers.reduce((s, m) => s + m.satisfaction, 0) / currentTeamMembers.length).toFixed(1)
        : '0.0';

    const teamActivities = mockTeamActivities.filter(a => a.teamId === currentTeam?.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    {currentTeam && (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: currentTeam.color }}>
                            {currentTeam.initials}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{currentTeam?.name || 'Team'} Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">{currentTeamMembers.length} members · {teamTickets.length} tickets</p>
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
                                    { label: 'Total Members', value: currentTeamMembers.length, icon: Shield, gradient: 'bg-gradient-primary' },
                                    { label: 'Resolved Today', value: totalResolved, icon: CheckCircle, gradient: 'bg-gradient-success' },
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
                            {currentTeam && (
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Team Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><p className="text-gray-500">Department</p><p className="font-medium text-gray-900 dark:text-white">{currentTeam.department}</p></div>
                                        <div><p className="text-gray-500">Created</p><p className="font-medium text-gray-900 dark:text-white">{new Date(currentTeam.createdAt).toLocaleDateString()}</p></div>
                                        <div className="md:col-span-2"><p className="text-gray-500">Description</p><p className="font-medium text-gray-900 dark:text-white">{currentTeam.description}</p></div>
                                        <div><p className="text-gray-500">Assignment Strategy</p><p className="font-medium text-gray-900 dark:text-white capitalize">{currentTeam.settings.assignmentStrategy.replace('-', ' ')}</p></div>
                                        <div><p className="text-gray-500">Working Hours</p><p className="font-medium text-gray-900 dark:text-white">{currentTeam.settings.workingHours.start} — {currentTeam.settings.workingHours.end}</p></div>
                                    </div>
                                </Card>
                            )}
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Workload Distribution</h3>
                                {workloadData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={workloadData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                                            <Bar dataKey="current" fill="#667eea" radius={[6, 6, 0, 0]} name="Current Tickets" />
                                            <Bar dataKey="resolved" fill="#10b981" radius={[6, 6, 0, 0]} name="Resolved Today" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-gray-500 text-center py-8">No members in this team yet</p>}
                            </Card>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{currentTeamMembers.length} members</p>
                                <Button icon={Plus} onClick={() => { setEditMember(null); setFormData({ name: '', email: '', role: 'Support Agent', expertise: '' }); setModalOpen(true); }}>Add Member</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentTeamMembers.map((member, index) => (
                                    <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                                        <Card className="p-6 hover:shadow-strong transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">{member.avatar}</div>
                                                        <div className={cn('absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-dark-surface', member.status === 'online' ? 'bg-success-500' : member.status === 'away' ? 'bg-warning-500' : 'bg-gray-400')} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(member)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"><Edit className="w-4 h-4 text-gray-500" /></button>
                                                    <button onClick={() => handleDelete(member.id)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-danger-500" /></button>
                                                </div>
                                            </div>
                                            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', roleColors[member.role] || 'bg-gray-100 text-gray-700 border-gray-200')}>{member.role}</span>
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {member.expertise.map(exp => (<span key={exp} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 rounded-md">{exp}</span>))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                                                <div className="flex items-center space-x-2"><Ticket className="w-4 h-4 text-primary-500" /><div><p className="text-xs text-gray-500">Active</p><p className="text-sm font-bold text-gray-900 dark:text-white">{member.currentTickets}</p></div></div>
                                                <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-success-500" /><div><p className="text-xs text-gray-500">Resolved</p><p className="text-sm font-bold text-gray-900 dark:text-white">{member.resolvedToday}</p></div></div>
                                                <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-secondary-500" /><div><p className="text-xs text-gray-500">Avg Time</p><p className="text-sm font-bold text-gray-900 dark:text-white">{member.avgResolutionTime}h</p></div></div>
                                                <div className="flex items-center space-x-2"><Star className="w-4 h-4 text-warning-500" /><div><p className="text-xs text-gray-500">Rating</p><p className="text-sm font-bold text-gray-900 dark:text-white">{member.satisfaction}/5</p></div></div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                                {currentTeamMembers.length === 0 && (
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
                                                            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', role.permissions[perm] ? 'bg-success-100 text-success-600 hover:bg-success-200' : 'bg-gray-100 dark:bg-dark-border text-gray-400 hover:bg-gray-200')}>
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
                                            <input type="number" min={1} value={settingsForm.sla[key]}
                                                onChange={e => setSettingsForm(f => ({ ...f, sla: { ...f.sla, [key]: Number(e.target.value) } }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Working Hours</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                        <input type="time" value={settingsForm.workingHours.start}
                                            onChange={e => setSettingsForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                        <input type="time" value={settingsForm.workingHours.end}
                                            onChange={e => setSettingsForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assignment Strategy</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'round-robin', label: 'Round Robin', desc: 'Distribute tickets evenly among members' },
                                        { value: 'load-balanced', label: 'Load Balanced', desc: 'Assign based on current workload' },
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
                            <div className="flex justify-end"><Button icon={Save} onClick={handleSaveSettings}>Save Settings</Button></div>
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

            {/* Add/Edit Member Modal */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditMember(null); }} title={editMember ? 'Edit Team Member' : 'Add Team Member'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Full name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                        <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                            {['Team Lead', 'Senior Agent', 'Support Agent', 'QA Specialist', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expertise</label>
                        <input value={formData.expertise} onChange={e => setFormData({ ...formData, expertise: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="e.g. Security, API, Backend (comma-separated)" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="ghost" onClick={() => { setModalOpen(false); setEditMember(null); }}>Cancel</Button>
                        <Button onClick={handleSave}>{editMember ? 'Update' : 'Add Member'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
