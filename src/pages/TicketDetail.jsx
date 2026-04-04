import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Clock, Calendar, User, Send, Save, X, Loader2, MessageSquare, AlertTriangle, Sparkles } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { ticketsAPI } from '../services/api';
import { formatDate, formatRelativeTime, cn } from '../lib/utils';
import toast from 'react-hot-toast';

const priorities = ['Critical', 'High', 'Medium', 'Low'];
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [commentText, setCommentText] = useState('');

    // Fetch ticket from API
    const { data: ticketRes, isLoading, isError, error } = useQuery({
        queryKey: ['ticket', id],
        queryFn: () => ticketsAPI.getById(id).then(res => res.data.data),
        enabled: !!id,
        retry: 1,
    });

    const { data: similarTickets = [], isLoading: similarLoading } = useQuery({
        queryKey: ['ticket-similar', id],
        queryFn: () => ticketsAPI.getSimilar(id).then((res) => res.data.data || []),
        enabled: !!id,
        retry: 1,
    });

    const ticket = ticketRes;

    useEffect(() => {
        setEditing(false);
        setCommentText('');
    }, [id]);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => ticketsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Ticket deleted');
            navigate('/tickets');
        },
        onError: () => toast.error('Failed to delete ticket'),
    });

    // Update mutation (for status/priority/assignee changes)
    const updateMutation = useMutation({
        mutationFn: (data) => ticketsAPI.update(id, data),
        onSuccess: (res) => {
            queryClient.setQueryData(['ticket', id], res.data.data);
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success('Ticket updated');
            setEditing(false);
        },
        onError: () => toast.error('Failed to update ticket'),
    });

    // Add comment mutation
    const commentMutation = useMutation({
        mutationFn: (text) => ticketsAPI.addComment(id, { text }),
        onSuccess: (res) => {
            queryClient.setQueryData(['ticket', id], res.data.data);
            setCommentText('');
            toast.success('Comment added');
        },
        onError: () => toast.error('Failed to add comment'),
    });

    const handleStartEdit = () => {
        setEditForm({ priority: ticket.priority, status: ticket.status });
        setEditing(true);
    };

    const handleSaveEdit = () => {
        updateMutation.mutate(editForm);
    };

    const handleDelete = () => {
        deleteMutation.mutate();
        setDeleteModalOpen(false);
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        commentMutation.mutate(commentText.trim());
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex-1">
                        <LoadingSkeleton variant="title" className="mb-2" />
                        <LoadingSkeleton variant="text" className="w-1/3" />
                    </div>
                </div>
                <Card className="p-6"><LoadingSkeleton count={4} /></Card>
            </div>
        );
    }

    // Error / Not Found
    if (isError || !ticket) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {error?.status === 404 ? 'Ticket Not Found' : 'Error Loading Ticket'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {error?.status === 404 ? "The ticket you're looking for doesn't exist." : 'Something went wrong. Please try again.'}
                </p>
                <Button onClick={() => navigate('/tickets')}>Back to Tickets</Button>
            </div>
        );
    }

    const assigneeName = ticket.assignee?.name || 'Unassigned';
    const assigneeInitials = assigneeName !== 'Unassigned' ? assigneeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    const reporterName = ticket.createdBy?.name || 'Unknown';
    const reporterInitials = reporterName !== 'Unknown' ? reporterName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/tickets')} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {ticket.ticketId ? `#${ticket.ticketId}` : `Ticket`}
                        </h1>
                        <Badge type="status" value={ticket.status}>{ticket.status}</Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Created {formatRelativeTime(ticket.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                    {editing ? (
                        <>
                            <Button variant="ghost" icon={X} onClick={() => setEditing(false)}>Cancel</Button>
                            <Button icon={updateMutation.isPending ? undefined : Save} loading={updateMutation.isPending} onClick={handleSaveEdit}>
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" icon={Edit} onClick={handleStartEdit}>Edit</Button>
                            <Button variant="danger" icon={Trash2} onClick={() => setDeleteModalOpen(true)}>Delete</Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{ticket.title}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap">{ticket.description}</p>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-dark-border">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">{ticket.category || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Customer Tier</label>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">{ticket.customerTier || 'N/A'}</p>
                            </div>
                            {ticket.tags?.length > 0 && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ticket.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Similar Tickets */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-primary-600" />
                            <span>Similar Tickets</span>
                        </h3>

                        {similarLoading ? (
                            <LoadingSkeleton count={3} />
                        ) : similarTickets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {similarTickets.map((item) => (
                                    <button
                                        key={item._id || item.ticketId}
                                        onClick={() => navigate(`/tickets/${item._id}`)}
                                        className="text-left p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/20 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500 mb-1">#{item.ticketId || item._id}</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{item.title}</p>
                                            </div>
                                            <span className="text-xs font-bold text-primary-700 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-1 rounded-full whitespace-nowrap">
                                                {item.similarityPercent}%
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <Badge type="priority" value={item.priority}>{item.priority}</Badge>
                                            <Badge type="status" value={item.status}>{item.status}</Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No similar tickets found.</p>
                        )}
                    </Card>

                    {/* Comments Section */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                            <MessageSquare className="w-5 h-5" />
                            <span>Comments ({ticket.comments?.length || 0})</span>
                        </h3>

                        {ticket.comments?.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                {ticket.comments.map((comment, i) => (
                                    <motion.div key={comment._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="flex space-x-3 p-4 bg-gray-50 dark:bg-dark-border/30 rounded-xl">
                                        <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.author?.name || 'You'}</span>
                                                <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4 mb-4">No comments yet</p>
                        )}

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="flex items-start space-x-3">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                rows={2}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                            <Button type="submit" icon={commentMutation.isPending ? undefined : Send} loading={commentMutation.isPending} disabled={!commentText.trim()}>
                                {commentMutation.isPending ? '' : 'Send'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Details</h3>
                        <div className="space-y-4">
                            {/* Priority — editable */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Priority</label>
                                {editing ? (
                                    <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                ) : (
                                    <Badge type="priority" value={ticket.priority} className="text-sm py-1.5">{ticket.priority}</Badge>
                                )}
                            </div>

                            {/* Status — editable */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Status</label>
                                {editing ? (
                                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <Badge type="status" value={ticket.status} className="text-sm py-1.5">{ticket.status}</Badge>
                                )}
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Assignee</label>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                                        {assigneeInitials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{assigneeName}</p>
                                        {ticket.assignee?.email && <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.assignee.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Reporter */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Reporter</label>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center text-white font-semibold">
                                        {reporterInitials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{reporterName}</p>
                                        {ticket.createdBy?.email && <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.createdBy.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Created */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" /><span>Created</span>
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">{formatDate(ticket.createdAt)}</p>
                            </div>
                        </div>
                    </Card>

                    {/* AI Predictions */}
                    {ticket.aiPredictions && (
                        <Card className="p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-dark-surface dark:to-dark-border border-primary-200">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">AI Predictions</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Priority Confidence</label>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-success rounded-full transition-all" style={{ width: `${ticket.aiPredictions.confidence || 0}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-primary-600">{ticket.aiPredictions.confidence || 0}%</span>
                                    </div>
                                </div>
                                {ticket.aiPredictions.reasoning && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Reasoning</label>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.aiPredictions.reasoning}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Predicted Priority</label>
                                    <Badge type="priority" value={ticket.aiPredictions.predictedPriority}>{ticket.aiPredictions.predictedPriority}</Badge>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Ticket" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-danger-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">Are you sure you want to delete this ticket?</p>
                            <p className="text-sm text-gray-500 mt-1">This action cannot be undone. The ticket and all its comments will be permanently removed.</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
