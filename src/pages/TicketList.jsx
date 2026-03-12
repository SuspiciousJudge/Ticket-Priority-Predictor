import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LayoutGrid, List, Plus, Columns3, ChevronLeft, ChevronRight, Download, Trash2, RefreshCw, CheckSquare, Square, X } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useStore } from '../store/useStore';
import { formatRelativeTime, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

export default function TicketList() {
    const navigate = useNavigate();
    const { getTeamTickets } = useStore();
    const teamTickets = getTeamTickets();
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriority, setSelectedPriority] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const filteredTickets = useMemo(() => {
        return teamTickets.filter((ticket) => {
            const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.id.includes(searchQuery);
            const matchesPriority = selectedPriority.length === 0 || selectedPriority.includes(ticket.priority);
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(ticket.status);
            return matchesSearch && matchesPriority && matchesStatus;
        });
    }, [searchQuery, selectedPriority, selectedStatus]);

    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const togglePriority = (priority) => {
        setSelectedPriority(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
        setCurrentPage(1);
    };

    const toggleStatus = (status) => {
        setSelectedStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
        setCurrentPage(1);
    };

    const toggleTicketSelection = (id) => {
        setSelectedTickets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedTickets.length === paginatedTickets.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(paginatedTickets.map(t => t.id));
        }
    };

    const handleExport = () => {
        const csv = ['ID,Title,Priority,Status,Category,Assignee,Created'];
        filteredTickets.forEach(t => {
            csv.push(`${t.id},"${t.title}",${t.priority},${t.status},${t.category},${t.assignee.name},${t.createdAt}`);
        });
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tickets-export.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filteredTickets.length} tickets`);
    };

    const handleBulkDelete = () => {
        toast.success(`${selectedTickets.length} tickets deleted`);
        setSelectedTickets([]);
    };

    const clearFilters = () => {
        setSelectedPriority([]);
        setSelectedStatus([]);
        setSearchQuery('');
        setCurrentPage(1);
    };

    // Kanban grouping
    const kanbanColumns = useMemo(() => {
        const cols = { 'Open': [], 'In Progress': [], 'Resolved': [], 'Closed': [] };
        filteredTickets.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });
        return cols;
    }, [filteredTickets]);

    const kanbanColors = { 'Open': 'border-t-primary-500', 'In Progress': 'border-t-secondary-500', 'Resolved': 'border-t-success-500', 'Closed': 'border-t-gray-400' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Tickets</h1>
                    <p className="text-gray-600 dark:text-gray-400">{filteredTickets.length} tickets found</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" icon={Download} onClick={handleExport}>Export</Button>
                    <Button icon={Plus} onClick={() => navigate('/create')}>Create Ticket</Button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title or ID..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={cn('flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all', showFilters ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border')}>
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filters</span>
                            {(selectedPriority.length > 0 || selectedStatus.length > 0) && (
                                <span className="w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {selectedPriority.length + selectedStatus.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-dark-border rounded-lg p-1">
                        {[
                            { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
                            { mode: 'list', icon: List, label: 'List' },
                            { mode: 'kanban', icon: Columns3, label: 'Kanban' },
                        ].map(v => (
                            <button key={v.mode} onClick={() => setViewMode(v.mode)} title={v.label}
                                className={cn('p-2 rounded-md transition-all', viewMode === v.mode ? 'bg-white dark:bg-dark-surface shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700')}>
                                <v.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</span>
                                    {(selectedPriority.length > 0 || selectedStatus.length > 0) && (
                                        <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1">
                                            <X className="w-3 h-3" /><span>Clear all</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                                        <button key={p} onClick={() => togglePriority(p)}
                                            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedPriority.includes(p) ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-200')}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</span>
                                    <div className="flex flex-wrap gap-2">
                                        {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                                            <button key={s} onClick={() => toggleStatus(s)}
                                                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedStatus.includes(s) ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-200')}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedTickets.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selectedTickets.length} ticket(s) selected</span>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => toast.success('Status updated')}>Change Status</Button>
                                    <Button variant="danger" size="sm" icon={Trash2} onClick={handleBulkDelete}>Delete</Button>
                                    <button onClick={() => setSelectedTickets([])} className="p-1.5 hover:bg-primary-100 rounded transition-colors">
                                        <X className="w-4 h-4 text-primary-600" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Views */}
            {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(kanbanColumns).map(([status, tickets]) => (
                        <div key={status} className={cn('bg-gray-50 dark:bg-dark-border/20 rounded-xl p-4 border-t-4', kanbanColors[status])}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{status}</h3>
                                <span className="text-xs font-medium bg-white dark:bg-dark-surface px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400 shadow-sm">{tickets.length}</span>
                            </div>
                            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                                {tickets.map((ticket) => (
                                    <motion.div key={ticket.id} whileHover={{ y: -2 }} onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="bg-white dark:bg-dark-surface rounded-lg p-4 shadow-soft hover:shadow-medium transition-all cursor-pointer border border-gray-200 dark:border-dark-border">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-gray-500">#{ticket.id}</span>
                                            <Badge type="priority" value={ticket.priority}>{ticket.priority}</Badge>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">{ticket.title}</h4>
                                        <div className="flex items-center justify-between">
                                            <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold">{ticket.assignee.avatar}</div>
                                            <span className="text-xs text-gray-500">{formatRelativeTime(ticket.createdAt)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTickets.map((ticket, index) => (
                            <motion.div key={ticket.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.04 }}>
                                <Card clickable onClick={() => navigate(`/tickets/${ticket.id}`)} className="p-5 h-full flex flex-col relative group">
                                    <button onClick={(e) => { e.stopPropagation(); toggleTicketSelection(ticket.id); }}
                                        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {selectedTickets.includes(ticket.id) ? <CheckSquare className="w-5 h-5 text-primary-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{ticket.id}</span>
                                        <Badge type="priority" value={ticket.priority}>{ticket.priority}</Badge>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{ticket.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{ticket.description}</p>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">{ticket.assignee.avatar}</div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{ticket.assignee.name}</span>
                                        </div>
                                        <Badge type="status" value={ticket.status}>{ticket.status}</Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                        <span>{formatRelativeTime(ticket.createdAt)}</span>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-success rounded-full" style={{ width: `${ticket.aiConfidence}%` }} />
                                            </div>
                                            <span>{ticket.aiConfidence}%</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </>
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-border/30">
                                    <th className="py-3 px-4 text-left">
                                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                            {selectedTickets.length === paginatedTickets.length ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                                        </button>
                                    </th>
                                    {['ID', 'Title', 'Priority', 'Status', 'Assignee', 'Created'].map(h => (
                                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleTicketSelection(ticket.id)}>
                                                {selectedTickets.includes(ticket.id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4"><span className="text-sm font-medium text-gray-900 dark:text-white">#{ticket.id}</span></td>
                                        <td className="py-3 px-4"><span className="text-sm text-gray-900 dark:text-white truncate max-w-xs block">{ticket.title}</span></td>
                                        <td className="py-3 px-4"><Badge type="priority" value={ticket.priority}>{ticket.priority}</Badge></td>
                                        <td className="py-3 px-4"><Badge type="status" value={ticket.status}>{ticket.status}</Badge></td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">{ticket.assignee.avatar}</div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assignee.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4"><span className="text-sm text-gray-500">{formatRelativeTime(ticket.createdAt)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </>
            )}
        </div>
    );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="flex items-center justify-center space-x-2">
            <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            {start > 1 && <><button onClick={() => onPageChange(1)} className="w-10 h-10 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">1</button><span className="text-gray-400">...</span></>}
            {pages.map(p => (
                <button key={p} onClick={() => onPageChange(p)}
                    className={cn('w-10 h-10 rounded-lg text-sm font-medium transition-all', p === currentPage ? 'bg-gradient-primary text-white shadow-colored-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border')}>
                    {p}
                </button>
            ))}
            {end < totalPages && <><span className="text-gray-400">...</span><button onClick={() => onPageChange(totalPages)} className="w-10 h-10 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">{totalPages}</button></>}
            <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
        </div>
    );
}
