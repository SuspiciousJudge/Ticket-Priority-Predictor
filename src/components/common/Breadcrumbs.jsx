import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const routeLabels = {
    '': 'Dashboard',
    tickets: 'All Tickets',
    create: 'Create Ticket',
    analytics: 'Analytics',
    team: 'Team',
    settings: 'Settings',
    manage: 'Manage Teams',
};

export default function Breadcrumbs() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) return null;

    const crumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = routeLabels[segment] || (segment.match(/^\d+$/) ? `#${segment}` : segment);
        const isLast = index === pathSegments.length - 1;
        return { path, label, isLast };
    });

    return (
        <nav className="flex items-center space-x-1.5 text-sm px-6 py-3">
            <Link to="/" className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Home className="w-4 h-4" />
            </Link>
            {crumbs.map((crumb, i) => (
                <motion.div
                    key={crumb.path}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center space-x-1.5"
                >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    {crumb.isLast ? (
                        <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
                    ) : (
                        <Link to={crumb.path} className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </motion.div>
            ))}
        </nav>
    );
}
