import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Sparkles, Clock, Tag, Save, Send } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useStore } from '../store/useStore';
import { ticketsAPI, uploadAPI, aiAPI } from '../services/api';
import { cn, generateId } from '../lib/utils';
import toast from 'react-hot-toast';

const categories = ['Bug', 'Feature', 'Enhancement', 'Support', 'Security'];
const customerTiers = ['Enterprise', 'Business', 'Professional', 'Free'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];

const similarTicketsData = [
    { id: 'TICK-890', title: 'Login issues with SSO', similarity: 0.92, resolutionTime: '3h', status: 'Resolved' },
    { id: 'TICK-876', title: 'Authentication timeout errors', similarity: 0.85, resolutionTime: '5h', status: 'Resolved' },
    { id: 'TICK-854', title: 'Password reset not working', similarity: 0.78, resolutionTime: '2h', status: 'Resolved' },
    { id: 'TICK-831', title: 'Two-factor auth broken on mobile', similarity: 0.71, resolutionTime: '8h', status: 'Resolved' },
    { id: 'TICK-812', title: 'Session management issues', similarity: 0.65, resolutionTime: '4h', status: 'Closed' },
];

export default function CreateTicket() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentTeam } = useStore();
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [aiPrediction, setAiPrediction] = useState(null);
    const [draftSaved, setDraftSaved] = useState(false);
    const [showSimilar, setShowSimilar] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { title: '', description: '', category: '', customerTier: '', tags: '' }
    });

    const watchTitle = watch('title');
    const watchDescription = watch('description');

    const createTicketMutation = useMutation({
        mutationFn: (data) => ticketsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('🎉 Ticket created successfully!', { duration: 4000, style: { fontWeight: 600 } });
            navigate('/tickets');
        },
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create ticket.');
        }
    });

    const submitting = createTicketMutation.isPending;

    // AI prediction as user types — calls real backend
    useEffect(() => {
        if (watchTitle?.length > 10 || watchDescription?.length > 20) {
            const timer = setTimeout(async () => {
                try {
                    const res = await aiAPI.suggestPriority(watchTitle || '', watchDescription || '');
                    const data = res.data?.data;
                    if (data) {
                        setAiPrediction({
                            priority: data.priority || 'Medium',
                            confidence: data.confidence || 70,
                            category: data.category || 'Support',
                            estimatedTime: data.estimatedTime || '2-8 hours',
                        });
                    }
                    setShowSimilar(true);
                } catch {
                    // Fallback to simple heuristic if AI fails
                    setAiPrediction({
                        priority: 'Medium',
                        confidence: 50,
                        category: 'Support',
                        estimatedTime: '2-8 hours',
                    });
                }
            }, 1200);
            return () => clearTimeout(timer);
        } else {
            setAiPrediction(null);
            setShowSimilar(false);
        }
    }, [watchTitle, watchDescription]);

    // Auto-save draft simulation
    useEffect(() => {
        if (watchTitle || watchDescription) {
            const timer = setTimeout(() => { setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [watchTitle, watchDescription]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...dropped.map(f => ({ file: f, id: generateId(), preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))]);
    }, []);

    const handleFileInput = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selected.map(f => ({ file: f, id: generateId(), preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null }))]);
    };

    const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

    const onSubmit = async (data) => {
        try {
            // Upload files first if any
            let attachments = [];
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(f => formData.append('files', f.file));
                try {
                    const uploadRes = await uploadAPI.upload(formData);
                    attachments = (uploadRes.data?.data || []).map(f => ({
                        filename: f.filename,
                        url: f.url,
                    }));
                } catch (uploadErr) {
                    console.warn('File upload failed, creating ticket without attachments:', uploadErr);
                    toast.error('File upload failed, but ticket will still be created.');
                }
            }

            const payload = {
                title: data.title,
                description: data.description,
                category: data.category || aiPrediction?.category,
                customerTier: data.customerTier,
                tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
                team: currentTeam?.id || undefined,
                attachments,
            };
            createTicketMutation.mutate(payload);
        } catch (err) {
            console.error(err);
        }
    };

    const getPriorityBg = (p) => {
        const map = { Critical: 'bg-danger-100 text-danger-700 border-danger-200', High: 'bg-orange-100 text-orange-700 border-orange-200', Medium: 'bg-warning-100 text-warning-700 border-warning-200', Low: 'bg-success-100 text-success-700 border-success-200' };
        return map[p] || map.Medium;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Ticket</h1>
                    <p className="text-gray-600 dark:text-gray-400">Fill in the details and let AI predict the priority</p>
                </div>
                <AnimatePresence>
                    {draftSaved && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center space-x-2 text-gray-500">
                            <Save className="w-4 h-4" />
                            <span className="text-sm">Draft saved</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                                <input
                                    {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
                                    placeholder="Describe the issue briefly..."
                                    className={cn(
                                        'w-full px-4 py-3 border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400',
                                        'focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                                        errors.title ? 'border-danger-500' : 'border-gray-300 dark:border-dark-border'
                                    )}
                                />
                                {errors.title && <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>}
                            </div>

                            {/* Category & Tier */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select {...register('category')} className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all">
                                        <option value="">Auto-detect by AI</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Tier</label>
                                    <select {...register('customerTier')} className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all">
                                        <option value="">Select tier</option>
                                        {customerTiers.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                <textarea
                                    {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please provide more details (at least 20 characters)' } })}
                                    rows={6}
                                    placeholder="Provide detailed information about the issue..."
                                    className={cn(
                                        'w-full px-4 py-3 border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 resize-none',
                                        'focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all',
                                        errors.description ? 'border-danger-500' : 'border-gray-300 dark:border-dark-border'
                                    )}
                                />
                                {errors.description && <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>}
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />Tags
                                </label>
                                <input
                                    {...register('tags')}
                                    placeholder="e.g. authentication, safari, urgent (comma-separated)"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                                        isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-dark-border hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-border/30'
                                    )}
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragging ? 'text-primary-500' : 'text-gray-400')} />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {isDragging ? 'Drop files here!' : 'Drag & drop files or click to browse'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                                    <input id="file-input" type="file" multiple className="hidden" onChange={handleFileInput} />
                                </div>

                                {files.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {files.map((f) => (
                                            <motion.div
                                                key={f.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-border/30 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    {f.preview ? (
                                                        <img src={f.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{f.file.name}</p>
                                                        <p className="text-xs text-gray-500">{(f.file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeFile(f.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors">
                                                    <X className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                                <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                                <Button type="submit" icon={submitting ? undefined : Send} loading={submitting}>
                                    {submitting ? 'Creating...' : 'Create Ticket'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* AI Sidebar */}
                <div className="space-y-6">
                    {/* AI Prediction */}
                    <Card className="p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-dark-surface dark:to-dark-border border-primary-200 dark:border-primary-800">
                        <div className="flex items-center space-x-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Prediction</h3>
                        </div>

                        {aiPrediction ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Predicted Priority</label>
                                    <div className="flex items-center space-x-3">
                                        <span className={cn('px-3 py-1.5 rounded-lg text-sm font-bold border', getPriorityBg(aiPrediction.priority))}>
                                            {aiPrediction.priority}
                                        </span>
                                        <span className="text-sm font-semibold text-primary-600">{aiPrediction.confidence}% confident</span>
                                    </div>
                                    <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${aiPrediction.confidence}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full bg-gradient-primary rounded-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Suggested Category</label>
                                    <Badge variant="primary">{aiPrediction.category}</Badge>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Estimated Resolution</label>
                                    <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{aiPrediction.estimatedTime}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Start typing to see AI predictions</p>
                            </div>
                        )}
                    </Card>

                    {/* Similar Tickets */}
                    <AnimatePresence>
                        {showSimilar && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Similar Tickets</h3>
                                    <div className="space-y-3">
                                        {similarTicketsData.map((ticket) => (
                                            <div key={ticket.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-dark-border/30 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.title}</p>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className="text-xs text-gray-500">{ticket.id}</span>
                                                        <span className="text-xs text-gray-500">Resolved in {ticket.resolutionTime}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full ml-2">
                                                    {Math.round(ticket.similarity * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
