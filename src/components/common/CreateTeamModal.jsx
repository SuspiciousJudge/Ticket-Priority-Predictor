import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Users, Settings2, Eye, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, teamsAPI } from '../../services/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const STEPS = [
    { label: 'Team Details', icon: Palette },
    { label: 'Add Members', icon: Users },
    { label: 'Settings', icon: Settings2 },
    { label: 'Review', icon: Eye },
];

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#dc2626', '#84cc16'];
const DEPARTMENTS = ['Engineering', 'Customer Success', 'Sales', 'Product', 'Marketing', 'Operations', 'HR', 'Finance'];
const STRATEGIES = [
    { value: 'round-robin', label: 'Round Robin', desc: 'Distribute tickets evenly among members' },
    { value: 'load-balanced', label: 'Load Balanced', desc: 'Assign based on current workload' },
    { value: 'manual', label: 'Manual', desc: 'Manually assign each ticket' },
];

const INITIAL_FORM_STATE = {
    name: '', description: '', color: COLORS[0], department: DEPARTMENTS[0],
    members: [], memberRoles: {},
    sla: { critical: 4, high: 8, medium: 24, low: 72 },
    workingHours: { start: '09:00', end: '18:00' },
    assignmentStrategy: 'round-robin',
};

export default function CreateTeamModal({ isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [memberSearch, setMemberSearch] = useState('');

    const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.getAll().then(res => res.data.data),
        enabled: isOpen && step === 1,
    });
    
    const users = useMemo(() => {
        if (!usersResponse?.users) return [];
        return usersResponse.users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            avatar: u.name.substring(0, 2).toUpperCase()
        }));
    }, [usersResponse]);

    const filteredMembers = useMemo(() => {
        return users.filter(m =>
            m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
            m.email.toLowerCase().includes(memberSearch.toLowerCase())
        );
    }, [users, memberSearch]);

    const createTeamMutation = useMutation({
        mutationFn: (data) => teamsAPI.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            toast.success(`Team "${form.name}" created successfully!`);
            reset();
            onClose();
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to create team');
        }
    });

    const reset = () => { 
        setStep(0); 
        setForm(INITIAL_FORM_STATE); 
    };

    const canNext = () => {
        if (step === 0) return form.name.trim().length > 0;
        return true;
    };

    const handleCreate = () => {
        const payload = {
            name: form.name.trim(),
            description: form.description,
            department: form.department,
            color: form.color,
            members: form.members,
            settings: {
                sla: form.sla,
                workingHours: { ...form.workingHours, timezone: 'America/New_York' },
                assignmentStrategy: form.assignmentStrategy,
            }
        };
        createTeamMutation.mutate(payload);
    };

    const toggleMember = (id) => {
        setForm(f => ({
            ...f,
            members: f.members.includes(id) ? f.members.filter(m => m !== id) : [...f.members, id],
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-border">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Team</h2>
                    <button onClick={() => { reset(); onClose(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-5 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center space-x-1.5">
                                <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                    i < step ? 'bg-success-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500'
                                )}>
                                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-gray-900 dark:text-white' : 'text-gray-500')}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-1">
                        <div className="bg-primary-600 h-1 rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                            {step === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name *</label>
                                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                                            placeholder="e.g. Platform Engineering" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none resize-none"
                                            placeholder="What does this team do?" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLORS.map(c => (
                                                <button key={c} onClick={() => setForm({ ...form, color: c })}
                                                    className={cn('w-9 h-9 rounded-full transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-dark-surface' : 'hover:scale-110')}
                                                    style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                        <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none">
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4">
                                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                                        placeholder="Search members..." />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {isLoadingUsers ? (
                                            <p className="text-sm text-gray-500 text-center py-4">Loading users...</p>
                                        ) : filteredMembers.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No users found.</p>
                                        ) : (
                                            filteredMembers.map(m => {
                                                const selected = form.members.includes(m.id);
                                                return (
                                                    <button key={m.id} onClick={() => toggleMember(m.id)}
                                                        className={cn('w-full flex items-center space-x-3 p-3 rounded-xl border transition-all text-left',
                                                            selected ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600' : 'border-gray-200 dark:border-dark-border hover:border-gray-300')}>
                                                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                            {m.avatar}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                                                            <p className="text-xs text-gray-500">{m.email}</p>
                                                        </div>
                                                        {selected && (
                                                            <select value={form.memberRoles[m.id] || 'Agent'} onClick={e => e.stopPropagation()}
                                                                onChange={e => setForm(f => ({ ...f, memberRoles: { ...f.memberRoles, [m.id]: e.target.value } }))}
                                                                className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                                                                <option value="Admin">Admin</option>
                                                                <option value="Manager">Manager</option>
                                                                <option value="Agent">Agent</option>
                                                                <option value="Viewer">Viewer</option>
                                                            </select>
                                                        )}
                                                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                            selected ? 'border-primary-600 bg-primary-600' : 'border-gray-300 dark:border-dark-border')}>
                                                            {selected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{form.members.length} member(s) selected</p>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">SLA Targets (hours)</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([key, label]) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                                                    <input type="number" min={1} value={form.sla[key]}
                                                        onChange={e => setForm(f => ({ ...f, sla: { ...f.sla, [key]: Number(e.target.value) } }))}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Working Hours</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start</label>
                                                <input type="time" value={form.workingHours.start}
                                                    onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, start: e.target.value } }))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End</label>
                                                <input type="time" value={form.workingHours.end}
                                                    onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, end: e.target.value } }))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Assignment Strategy</h4>
                                        <div className="space-y-2">
                                            {STRATEGIES.map(s => (
                                                <button key={s.value} onClick={() => setForm(f => ({ ...f, assignmentStrategy: s.value }))}
                                                    className={cn('w-full flex items-start space-x-3 p-3 rounded-xl border transition-all text-left',
                                                        form.assignmentStrategy === s.value ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-border hover:border-gray-300')}>
                                                    <div className={cn('w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                        form.assignmentStrategy === s.value ? 'border-primary-600' : 'border-gray-300')}>
                                                        {form.assignmentStrategy === s.value && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</p>
                                                        <p className="text-xs text-gray-500">{s.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: form.color }}>
                                            {form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">{form.name}</h4>
                                            <p className="text-sm text-gray-500">{form.department}</p>
                                        </div>
                                    </div>
                                    {form.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{form.description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                                            <p className="text-gray-500 text-xs">Members</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{form.members.length}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                                            <p className="text-gray-500 text-xs">Strategy</p>
                                            <p className="font-bold text-gray-900 dark:text-white capitalize">{form.assignmentStrategy.replace('-', ' ')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                                            <p className="text-gray-500 text-xs">Working Hours</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{form.workingHours.start} - {form.workingHours.end}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                                            <p className="text-gray-500 text-xs">SLA (Critical)</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{form.sla.critical}h</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-dark-border">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : (reset(), onClose())}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                        disabled={createTeamMutation.isPending}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{step === 0 ? 'Cancel' : 'Back'}</span>
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => canNext() && setStep(step + 1)}
                            disabled={!canNext() || createTeamMutation.isPending}
                            className={cn(
                                'flex items-center space-x-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all',
                                canNext() ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'
                            )}
                        >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={createTeamMutation.isPending}
                            className={cn(
                                "flex items-center space-x-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all",
                                createTeamMutation.isPending ? "bg-success-400 cursor-wait" : "bg-success-600 hover:bg-success-700"
                            )}
                        >
                            <Check className="w-4 h-4" />
                            <span>{createTeamMutation.isPending ? 'Creating...' : 'Create Team'}</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
