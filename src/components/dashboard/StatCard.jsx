import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../common/Card';

const colorMap = {
    'bg-gradient-primary':   { bg: 'bg-orange-50',  icon: 'text-orange-500'  },
    'bg-gradient-danger':    { bg: 'bg-red-50',     icon: 'text-red-500'     },
    'bg-gradient-success':   { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
    'bg-gradient-secondary': { bg: 'bg-sky-50',     icon: 'text-sky-500'     },
    'bg-gradient-warning':   { bg: 'bg-amber-50',   icon: 'text-amber-500'   },
};

export default function StatCard({ title, value, icon: Icon, gradient, trend, trendValue, delay = 0 }) {
    const [count, setCount] = useState(0);
    const targetValue = typeof value === 'string' ? parseInt(value) : value;

    useEffect(() => {
        if (isNaN(targetValue)) { setCount(value); return; }
        const steps = 50;
        const stepVal = targetValue / steps;
        let s = 0;
        const t = setInterval(() => {
            s++;
            setCount(Math.min(Math.floor(stepVal * s), targetValue));
            if (s >= steps) clearInterval(t);
        }, 700 / steps);
        return () => clearInterval(t);
    }, [targetValue, value]);

    const colors = colorMap[gradient] ?? colorMap['bg-gradient-primary'];
    const display = typeof count === 'number' && !isNaN(count) ? count.toLocaleString() : count;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                </div>

                <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                    {display}
                </p>

                {trend && (
                    <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                        trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                        {trend === 'up'
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                        }
                        <span>{trendValue} from last week</span>
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
