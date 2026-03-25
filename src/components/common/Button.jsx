import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    disabled = false,
    icon: Icon,
    loading = false,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

    const variants = {
        primary: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white focus:ring-orange-400',
        secondary: 'bg-gradient-secondary text-white hover:shadow-lg focus:ring-secondary-500',
        success: 'bg-gradient-success text-white hover:shadow-lg focus:ring-success-500',
        danger: 'bg-gradient-danger text-white hover:shadow-colored-danger focus:ring-danger-500',
        outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
        ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const handleClick = (e) => {
        if (!disabled && !loading && onClick) {
            const button = e.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.className = 'absolute rounded-full bg-white/30 pointer-events-none animate-ping';

            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);

            onClick(e);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {Icon && !loading && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </motion.button>
    );
}
