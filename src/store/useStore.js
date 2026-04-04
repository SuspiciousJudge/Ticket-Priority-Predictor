import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set, get) => ({
            // UI State
            darkMode: false,
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
            sidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

            // Selected Team State
            currentTeam: null,
            setCurrentTeam: (team) => set({ currentTeam: team }),

            // Server Data State (real backend data only)
            tickets: [],
            users: [],
            teams: [],
            dataLoaded: false,
            setTickets: (tickets) => set({ tickets: tickets || [] }),
            setUsers: (users) => set({ users: users || [] }),
            setTeams: (teams) => set({ teams: teams || [] }),
            bootstrapData: async () => {
                if (get().dataLoaded) return;

                try {
                    const { ticketsAPI, usersAPI, teamsAPI } = await import('../services/api');
                    const [ticketsRes, usersRes, teamsRes] = await Promise.all([
                        ticketsAPI.getAll({ limit: 200 }),
                        usersAPI.getAll(),
                        teamsAPI.getAll(),
                    ]);

                    set({
                        tickets: ticketsRes?.data?.data?.tickets || [],
                        users: usersRes?.data?.data || [],
                        teams: teamsRes?.data?.data || [],
                        dataLoaded: true,
                    });
                } catch {
                    set({ dataLoaded: false });
                }
            },
        }),
        {
            name: 'ticket-app-storage',
            partialize: (state) => ({
                darkMode: state.darkMode,
                currentTeam: state.currentTeam,
                sidebarCollapsed: state.sidebarCollapsed,
            }),
        }
    )
);
