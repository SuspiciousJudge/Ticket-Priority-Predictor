import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Users, Settings } from 'lucide-react';

const actions = [
    { icon: Plus,      label: 'Create Ticket', path: '/create',    description: 'Report a new issue' },
    { icon: BarChart3, label: 'Analytics',     path: '/analytics', description: 'Explore insights'   },
    { icon: Users,     label: 'Team',          path: '/team',      description: 'Manage members'     },
    { icon: Settings,  label: 'Settings',      path: '/settings',  description: 'Configure system'   },
];

export default function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((action) => (
                <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all duration-150 text-left group"
                >
                    <div className="p-2 bg-orange-50 rounded-lg shrink-0 group-hover:bg-orange-100 transition-colors">
                        <action.icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{action.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{action.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
