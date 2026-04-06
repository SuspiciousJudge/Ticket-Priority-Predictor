import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useQuery } from '@tanstack/react-query';
import { teamsAPI } from '../services/api';

export default function useTeamFilter() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentTeam, setCurrentTeam } = useStore();
    const { data: teamsRes } = useQuery({
        queryKey: ['teams'],
        queryFn: teamsAPI.getAll,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const teams = teamsRes?.data?.data || [];
    const isInitSync = useRef(false);

    // On mount: read ?team= from URL and sync to store (once)
    useEffect(() => {
        if (!teams || teams.length === 0 || isInitSync.current) return;
        isInitSync.current = true;

        const teamParam = searchParams.get('team');
        if (teamParam && teamParam !== currentTeam?.id) {
            const matchedTeam = teams.find(t => (t._id || t.id) === teamParam);
            if (matchedTeam) {
                setCurrentTeam({ id: matchedTeam._id || matchedTeam.id, name: matchedTeam.name, color: matchedTeam.color });
            }
        }
    }, [teams]);

    // When currentTeam changes in the store, update the URL
    useEffect(() => {
        const current = searchParams.get('team');
        if (currentTeam?.id) {
            if (current !== currentTeam.id) {
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('team', currentTeam.id);
                    return next;
                }, { replace: true });
            }
        } else if (current) {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('team');
                return next;
            }, { replace: true });
        }
    }, [currentTeam?.id]);
}
