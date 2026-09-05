import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Users, Settings } from 'lucide-react';

const actions = [
    { icon: Plus, label: 'Create Ticket', path: '/create', gradient: 'from-primary-500 to-purple-600', description: 'Report a new issue' },
    { icon: BarChart3, label: 'View Analytics', path: '/analytics', gradient: 'from-secondary-500 to-blue-600', description: 'Explore insights' },
    { icon: Users, label: 'Team View', path: '/team', gradient: 'from-success-500 to-emerald-600', description: 'Manage your team' },
    { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-warning-500 to-orange-600', description: 'Configure system' },
];

export default function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action, index) => (
                <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(action.path)}
                    className={`relative overflow-hidden rounded-xl p-5 bg-gradient-to-br ${action.gradient} text-white text-left group`}
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4" />

                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                            <action.icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold mb-0.5">{action.label}</h4>
                        <p className="text-xs text-white/70">{action.description}</p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
