import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function useTeamFilter() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentTeam, setCurrentTeam, teams } = useStore();

    // On mount: read ?team= from URL and sync to store
    useEffect(() => {
        const teamParam = searchParams.get('team');
        if (teamParam && teams.some(t => t.id === teamParam) && teamParam !== currentTeam?.id) {
            setCurrentTeam(teamParam);
        }
    }, [searchParams, teams]);

    // When currentTeam changes, update the URL
    useEffect(() => {
        if (currentTeam) {
            const current = searchParams.get('team');
            if (current !== currentTeam.id) {
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('team', currentTeam.id);
                    return next;
                }, { replace: true });
            }
        }
    }, [currentTeam?.id]);
}
