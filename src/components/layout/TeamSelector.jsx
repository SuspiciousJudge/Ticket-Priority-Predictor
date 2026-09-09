import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Check, Plus, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { useQuery } from '@tanstack/react-query';
import { teamsAPI } from '../../services/api';
import { cn } from '../../lib/utils';

export default function TeamSelector({ onCreateTeam }) {
    const navigate = useNavigate();
    const { currentTeam, setCurrentTeam } = useStore();
    
    // Fetch teams using React Query
    const { data: teamsRes, isLoading } = useQuery({
        queryKey: ['teams'],
        queryFn: teamsAPI.getAll,
        retry: false,
    });
    
    // Extract the actual teams array — API returns { data: { success, data: [...] } }
    const teams = teamsRes?.data?.data || [];

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusIndex, setFocusIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    const filtered = Array.isArray(teams) ? teams.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchRef.current) searchRef.current.focus();
    }, [isOpen]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(true); }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusIndex(i => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusIndex >= 0 && focusIndex < filtered.length) {
                    const selected = filtered[focusIndex];
                    setCurrentTeam({ id: selected._id || selected.id, name: selected.name, color: selected.color, initials: selected.name.substring(0, 2).toUpperCase() });
                    setIsOpen(false);
                    setSearch('');
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearch('');
                break;
        }
    };

    const handleSelectTeam = (team) => {
        const teamId = team._id || team.id;
        if (!teamId) {
            // "All Teams" selected
            setCurrentTeam(null);
        } else {
            setCurrentTeam({ id: teamId, name: team.name, color: team.color, initials: team.name.substring(0, 2).toUpperCase() });
        }
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
            <button
                onClick={() => { setIsOpen(!isOpen); setFocusIndex(-1); }}
                className={cn(
                    'flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border transition-all',
                    isOpen
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-surface'
                )}
            >
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: currentTeam?.color || '#667eea' }}
                >
                    {currentTeam?.initials || (currentTeam?.name ? currentTeam.name.substring(0,2).toUpperCase() : 'AL')}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block max-w-[100px] truncate">
                    {currentTeam?.name || 'All Teams'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-12 w-72 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-strong z-50 overflow-hidden"
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-gray-100 dark:border-dark-border">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setFocusIndex(-1); }}
                                    placeholder="Search teams..."
                                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Team List */}
                        <div className="max-h-64 overflow-y-auto p-1">
                            {/* Always show "All Teams" option */}
                            <button
                                onClick={() => handleSelectTeam({ id: null, name: 'All Teams', color: '#667eea' })}
                                className={cn(
                                    'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                                    !currentTeam?.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-border/50'
                                )}
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-primary-500">
                                    AL
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">All Teams</p>
                                </div>
                                {!currentTeam?.id && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                            </button>

                            {isLoading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading teams...</p>
                            ) : filtered.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No teams found</p>
                            ) : (
                                filtered.map((team, index) => {
                                    const teamId = team._id || team.id;
                                    const isSelected = currentTeam?.id === teamId;
                                    const isFocused = focusIndex === index;
                                    const initials = team.name ? team.name.substring(0, 2).toUpperCase() : '??';
                                    const memberCount = team.members?.length || 0;
                                    
                                    return (
                                        <button
                                            key={teamId}
                                            onClick={() => handleSelectTeam(team)}
                                            className={cn(
                                                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                                                isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : '',
                                                isFocused && !isSelected ? 'bg-gray-50 dark:bg-dark-border/50' : '',
                                                !isSelected && !isFocused ? 'hover:bg-gray-50 dark:hover:bg-dark-border/50' : ''
                                            )}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                style={{ backgroundColor: team.color || '#667eea' }}
                                            >
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{team.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {memberCount} members
                                                </p>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-gray-100 dark:border-dark-border space-y-0.5">
                            <button
                                onClick={() => { setIsOpen(false); if (onCreateTeam) onCreateTeam(); }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create New Team</span>
                            </button>
                            <button
                                onClick={() => { setIsOpen(false); navigate('/team/manage'); }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                            >
                                <Settings2 className="w-4 h-4" />
                                <span>Manage Teams</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
