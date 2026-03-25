import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from '../common/Breadcrumbs';
import PageTransition from '../common/PageTransition';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import useTeamFilter from '../../hooks/useTeamFilter';

function PageLoader() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-dark-border rounded-lg"></div>
            <div className="h-4 w-72 bg-gray-200 dark:bg-dark-border rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[0,1,2,3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-dark-border rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}

export default function Layout() {
    const { sidebarCollapsed } = useStore();
    useTeamFilter();

    return (
        <div className="min-h-screen bg-[#f7f7f8] dark:bg-dark-bg">
            <Sidebar />

            <div className={cn(
                'transition-all duration-300',
                sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'
            )}>
                <Topbar />
                <Breadcrumbs />

                <main className="p-6 lg:p-8">
                    <Suspense fallback={<PageLoader />}>
                        <PageTransition>
                            <Outlet />
                        </PageTransition>
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
