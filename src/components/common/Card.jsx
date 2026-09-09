import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function Card({
    children,
    className = '',
    glassmorphism = false,
    hover = true,
    clickable = false,
    onClick,
    ...props
}) {
    const baseStyles = 'rounded-xl transition-all duration-300';
    const glassStyles = glassmorphism
        ? 'bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md border border-white/20'
        : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border';
    const interactiveStyles = hover ? 'hover:shadow-strong' : '';
    const cursorStyles = clickable ? 'cursor-pointer' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={clickable ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } : {}}
            className={cn(
                baseStyles,
                glassStyles,
                interactiveStyles,
                cursorStyles,
                'shadow-soft',
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    );
}
